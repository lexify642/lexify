import { TEAM_MEMBERS } from "@/data/team";
import { dueCategory } from "@/data/tasks";
import { TODAY } from "@/data/cases";

// "Pending drafts" has no real per-user draft-tracking data anywhere in this
// app (Legal Drafts is a static catalog, not linked to advocates or tasks) —
// this is an explicit, honest heuristic: tasks whose title mentions "draft"
// and aren't done yet, grouped by assignee.
function isDraftTask(task) {
  return /draft/i.test(task.title) && task.status !== "Completed" && task.status !== "Cancelled";
}

function workloadLevel(pendingTasks, hearingsToday) {
  const load = pendingTasks + hearingsToday * 2;
  if (load >= 8) return "High";
  if (load >= 3) return "Medium";
  return "Low";
}

export function computeAdvocateWorkload({ tasks = [], cases = [] }) {
  return TEAM_MEMBERS.map((member) => {
    const memberTasks = tasks.filter((t) => t.assignedToName === member.name);
    const pendingTasks = memberTasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
    const assignedCases = new Set(memberTasks.map((t) => t.caseNo).filter(Boolean));

    const memberCaseNos = new Set([
      ...assignedCases,
      ...cases.filter((c) => c.caseDetails?.assignedAdvocate === member.name).map((c) => c.no),
    ]);
    const memberCases = cases.filter((c) => memberCaseNos.has(c.no));
    const hearingsToday = memberCases.filter((c) => c.date === TODAY).length;
    const upcomingHearings = memberCases.filter((c) => c.date > TODAY).length;
    const pendingDrafts = memberTasks.filter(isDraftTask).length;

    return {
      name: member.name,
      role: member.role,
      assignedCases: memberCaseNos.size,
      pendingTasks: pendingTasks.length,
      hearingsToday,
      upcomingHearings,
      pendingDrafts,
      workloadLevel: workloadLevel(pendingTasks.length, hearingsToday),
    };
  });
}

export function toneForWorkload(level) {
  return { Low: "green", Medium: "orange", High: "red" }[level] || "grey";
}
