import { MANAGER_ROLES } from "@/lib/roles";

// Same pattern as components/tasks/permissions.js and components/chat/
// permissions.js — real rules, now evaluated against the real signed-in
// user (useCurrentUser()) instead of the hardcoded CURRENT_USER. A
// "Client" view-only role is modeled here (VIEW_ONLY_ROLES) even though no
// real client-portal login exists yet — same forward-looking scoping the
// other permission files already use.
const VIEW_ONLY_ROLES = ["client"];

export function canManageDraft(currentUser) {
  return MANAGER_ROLES.includes(currentUser?.role);
}

export function canEditDraft(currentUser) {
  return !VIEW_ONLY_ROLES.includes(currentUser?.role);
}

export function canComment() {
  return true;
}

export function canDeleteComment(thread, currentUser) {
  return canManageDraft(currentUser) || thread?.author === currentUser?.name;
}

export function canReview() {
  return true;
}

export function canApprove(currentUser) {
  return canManageDraft(currentUser);
}

export function canSendForReview(currentUser) {
  return !VIEW_ONLY_ROLES.includes(currentUser?.role);
}

export function canRestoreVersion(currentUser) {
  return canManageDraft(currentUser);
}

export function canAcceptRejectChanges(currentUser) {
  return canManageDraft(currentUser);
}

export function canDownloadDraft() {
  return true;
}
