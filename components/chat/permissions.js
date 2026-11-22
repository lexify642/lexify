import { MANAGER_ROLES } from "@/lib/roles";

// Same pattern as components/tasks/permissions.js — real rules, now
// evaluated against the real signed-in user (useCurrentUser()) instead of
// the hardcoded CURRENT_USER. Every function here takes currentUser
// explicitly since callers are always inside a component that already has it.
export function canManageChat(currentUser) {
  return MANAGER_ROLES.includes(currentUser?.role);
}

export function canReassignClientChat(currentUser) {
  return canManageChat(currentUser);
}

export function canDeleteMessage(message, currentUser) {
  return canManageChat(currentUser) || message.senderName === currentUser?.name;
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

export function canAccessCaseRoom(caseData, tasks, currentUser) {
  if (canManageChat(currentUser)) return true;
  return accessListForCase(caseData, tasks).includes(currentUser?.name);
}
