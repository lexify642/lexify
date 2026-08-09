import { CURRENT_USER } from "@/data/team";

// Same MANAGER_ROLES-against-CURRENT_USER pattern as components/chat/
// permissions.js and components/tasks/permissions.js. This app has no
// multi-user auth (CURRENT_USER is the one signed-in identity, always
// "Senior Advocate" today) and no "Client"/view-only user actually exists —
// but the rule itself is real and correctly scoped for when it does, same
// convention as the two existing permission files.
const MANAGER_ROLES = ["Senior Advocate", "Admin"];
const VIEW_ONLY_ROLES = ["Client"];

export function canManageDraft() {
  return MANAGER_ROLES.includes(CURRENT_USER.role);
}

export function canEditDraft() {
  return !VIEW_ONLY_ROLES.includes(CURRENT_USER.role);
}

export function canComment() {
  return true;
}

export function canDeleteComment(thread) {
  return canManageDraft() || thread?.author === CURRENT_USER.name;
}

export function canReview() {
  return true;
}

export function canApprove() {
  return canManageDraft();
}

export function canSendForReview() {
  return !VIEW_ONLY_ROLES.includes(CURRENT_USER.role);
}

export function canRestoreVersion() {
  return canManageDraft();
}

export function canAcceptRejectChanges() {
  return canManageDraft();
}

export function canDownloadDraft() {
  return true;
}
