import { caseLabel } from "./shared";

// Merges the three real event logs that already exist in this app into one
// timeline — no separate "activity" store was created for this: task.activity[]
// (per-task status history), Attachments records (uploadedBy/uploadedAt), and
// CasesContext.auditLog (case-detail edits). Nothing here is synthesized.
export function computeRecentActivity({ tasks = [], cases = [], attachments = [], auditLog = [] }, limit = 20) {
  const items = [];
  const caseByNo = new Map(cases.map((c) => [c.no, c]));

  tasks.forEach((t) => {
    (t.activity || []).forEach((a) => {
      const linkedCase = t.caseNo ? caseByNo.get(t.caseNo) : null;
      items.push({
        id: `activity-task-${a.id}`,
        user: a.user,
        timestamp: a.timestamp,
        action: a.note || `updated "${t.title}" to ${a.statusTo}`,
        caseNo: t.caseNo || null,
        caseLabel: linkedCase ? caseLabel(linkedCase) : null,
        href: `/tasks/${t.id}`,
      });
    });
  });

  attachments.forEach((att) => {
    const linkedCase = att.linkedCaseNo ? caseByNo.get(att.linkedCaseNo) : null;
    items.push({
      id: `activity-doc-${att.id}`,
      user: att.uploadedBy,
      timestamp: att.uploadedAt,
      action: `uploaded "${att.name}"`,
      caseNo: att.linkedCaseNo || null,
      caseLabel: linkedCase ? caseLabel(linkedCase) : null,
      href: att.linkedCaseNo ? `/cases/${att.linkedCaseNo}` : "/documents",
    });
  });

  auditLog.forEach((entry) => {
    const linkedCase = entry.caseNo ? caseByNo.get(entry.caseNo) : null;
    items.push({
      id: entry.id,
      user: entry.user,
      timestamp: entry.timestamp,
      action: Array.isArray(entry.changes) ? entry.changes.join(", ") : String(entry.changes || "Case updated"),
      caseNo: entry.caseNo || null,
      caseLabel: linkedCase ? caseLabel(linkedCase) : null,
      href: entry.caseNo ? `/cases/${entry.caseNo}` : "/cases",
    });
  });

  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
}
