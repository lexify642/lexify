import { CURRENT_USER } from "@/data/team";

const MANAGER_ROLES = ["Senior Advocate", "Admin"];

// Same pattern as components/tasks/permissions.js — real rules evaluated
// against CURRENT_USER (the app's one hardcoded session identity, since
// there's no real multi-user auth here), not hardcoded true/false.
export function canManageChat() {
  return MANAGER_ROLES.includes(CURRENT_USER.role);
}

export function canReassignClientChat() {
  return canManageChat();
}

export function canDeleteMessage(message) {
  return canManageChat() || message.senderName === CURRENT_USER.name;
}

// A case's discussion room is open to whoever is actually working the case:
// the assigned advocate on the case record, plus anyone with a task linked
// to that case, plus any Admin/Senior Advocate — derived from data already
// tracked elsewhere (case + tasks) rather than a new "case team" field.
export function accessListForCase(caseData, tasks) {
  const names = new Set();
  if (caseData?.caseDetails?.assignedAdvocate) names.add(caseData.caseDetails.assignedAdvocate);
  (tasks || []).forEach((t) => {
    if (t.caseNo === caseData?.no && t.assignedToName) names.add(t.assignedToName);
  });
  return Array.from(names);
}

export function canAccessCaseRoom(caseData, tasks) {
  if (canManageChat()) return true;
  return accessListForCase(caseData, tasks).includes(CURRENT_USER.name);
}
