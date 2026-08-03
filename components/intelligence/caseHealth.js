import { accessListForCase } from "@/components/chat/permissions";
import { caseConversationId, clientConversationId } from "@/components/chat/ChatContext";
import { messagesFor } from "@/components/chat/conversationUtils";
import { dueCategory } from "@/data/tasks";
import { daysAgo } from "./shared";

// The six-stage litigation lifecycle used by the Case Progress Tracker.
// Real case `stage` strings vary quite a bit across matter types (writ,
// civil, criminal, NCLT, arbitration all use different stage vocabulary),
// so this is a best-effort normalization rather than a strict 1:1 mapping —
// a case whose stage isn't recognized falls back to its previousDates
// history depth as a rough proxy, clamped into range.
export const CASE_PROGRESS_STAGES = ["Filed", "Summons", "Written Statement", "Evidence", "Arguments", "Judgment"];

const STAGE_INDEX_MAP = {
  institution: 0,
  filed: 0,
  "notice stage": 1,
  admission: 1,
  summons: 1,
  "written statement": 2,
  reply: 2,
  evidence: 3,
  "cross examination": 3,
  "final hearing": 4,
  arguments: 4,
  judgment: 5,
  disposed: 5,
};

export function caseProgressIndex(caseData) {
  const key = (caseData?.stage || "").trim().toLowerCase();
  if (key in STAGE_INDEX_MAP) return STAGE_INDEX_MAP[key];
  const depth = caseData?.previousDates?.length || 0;
  return Math.max(0, Math.min(CASE_PROGRESS_STAGES.length - 1, Math.floor(depth / 2)));
}

function mentionsAffidavit(caseData) {
  const haystack = [
    ...(caseData.previousDates || []).flatMap((pd) => [pd.purpose, pd.outcome, pd.fullNotes]),
    ...(caseData.notes || []).map((n) => n.text),
  ]
    .filter(Boolean)
    .join(" ");
  return /affidavit/i.test(haystack);
}

function hasAffidavitOnFile(caseData, linkedAttachments) {
  return (
    (caseData.docs || []).some((d) => /affidavit/i.test(d)) ||
    linkedAttachments.some((a) => /affidavit/i.test(a.name))
  );
}

// Health score = percentage of APPLICABLE checks that pass. A check that
// doesn't structurally apply to this case (e.g. court fees don't exist as a
// field on criminal/writ/NCLT/arbitration matters — only `civil` sub-cases
// have `courtFeePaid` at all) is excluded from the denominator rather than
// counted as a failure, so the score never unfairly penalizes a case for a
// field its own case type doesn't have.
export function computeCaseHealth(caseData, { tasks = [], attachments = [], messages = [] } = {}) {
  if (!caseData) return { score: 0, level: "Critical", metChecks: [], issues: [] };

  const met = [];
  const issues = [];
  let applicable = 0;

  function check(applies, passed, metLabel, issueLabel) {
    if (!applies) return;
    applicable += 1;
    if (passed) met.push(metLabel);
    else issues.push(issueLabel);
  }

  const caseTasks = tasks.filter((t) => t.caseNo === caseData.no);
  const linkedAttachments = attachments.filter((a) => a.linkedCaseNo === caseData.no);
  const team = accessListForCase(caseData, tasks);
  const roomId = caseConversationId(caseData.no);
  const clientId = caseData.client?.name ? clientConversationId(caseData.client.name) : null;
  const hasRecentComms =
    messagesFor(roomId, messages).length > 0 || (clientId ? messagesFor(clientId, messages).length > 0 : false);

  check(true, caseData.previousDates?.length > 0, "Case Diary Updated", "No hearing history logged yet");
  check(
    true,
    Boolean(caseData.date) && (daysAgo(caseData.date) ?? 0) <= 0,
    "Next Hearing Set",
    "No upcoming hearing date on record"
  );
  check(
    true,
    Boolean(caseData.client?.name && caseData.client?.phone && caseData.client?.address),
    "Client Details Complete",
    "Client details incomplete"
  );
  check(
    true,
    (caseData.docs?.length || 0) > 0 || linkedAttachments.length > 0,
    "Documents Complete",
    "No documents on file"
  );
  check(
    caseTasks.length > 0,
    !caseTasks.some((t) => dueCategory(t) === "overdue"),
    "Tasks Completed",
    "Overdue tasks on this matter"
  );
  check(
    caseData.caseDetails?.civil?.courtFeePaid !== undefined,
    Boolean(caseData.caseDetails?.civil?.courtFeePaid),
    "Court Fees Updated",
    "Court fee status not recorded"
  );
  check(true, team.length > 0, "Team Assigned", "No team member assigned");
  check(true, (caseData.notes?.length || 0) > 0, "Notes Available", "No notes recorded");
  check(
    caseData.previousDates?.length > 0,
    Boolean(caseData.previousDates?.[0]?.fullNotes?.trim()),
    "Hearing Notes Updated",
    "Hearing Notes Missing"
  );
  check(
    true,
    linkedAttachments.some((a) => a.category === "Research" || a.linkedDraftSlug),
    "Research Attached",
    "Pending Research"
  );
  check(true, hasRecentComms, "Communication Updated", "Client Not Contacted");
  check(mentionsAffidavit(caseData), hasAffidavitOnFile(caseData, linkedAttachments), "Affidavit Filed", "Missing Affidavit");

  const score = applicable === 0 ? 100 : Math.round((met.length / applicable) * 100);
  const level = score >= 85 ? "Excellent" : score >= 70 ? "Healthy" : score >= 45 ? "Needs Attention" : "Critical";

  return { score, level, metChecks: met, issues };
}

export function toneForHealthLevel(level) {
  return { Excellent: "green", Healthy: "green", "Needs Attention": "orange", Critical: "red" }[level] || "grey";
}
