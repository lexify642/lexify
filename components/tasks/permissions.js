import { CURRENT_USER } from "@/data/team";

const MANAGER_ROLES = ["Senior Advocate", "Admin"];

// The app has no multi-user auth — CURRENT_USER is the one signed-in
// identity — but the rule itself is real: Admin/Senior Advocate can manage
// any task, everyone else only the ones assigned to them.
export function canManageTask() {
  return MANAGER_ROLES.includes(CURRENT_USER.role);
}

export function canUpdateStatus(task) {
  return canManageTask() || task.assignedToName === CURRENT_USER.name;
}
