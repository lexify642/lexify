import { MANAGER_ROLES } from "@/lib/roles";

// Real Supabase-backed roles now (see lib/roles.js) — the rule is unchanged:
// Admin/Senior Advocate can manage any task, everyone else only the ones
// assigned to them. Takes currentUser explicitly (from useCurrentUser())
// instead of importing a fixed identity, since callers are always inside a
// component that already has it.
export function canManageTask(currentUser) {
  return MANAGER_ROLES.includes(currentUser?.role);
}

export function canUpdateStatus(task, currentUser) {
  return canManageTask(currentUser) || task.assignedToName === currentUser?.name;
}
