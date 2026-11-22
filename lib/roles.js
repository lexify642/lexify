// Single source of truth for the role vocabulary shared by the DB (CHECK
// constraint in supabase/migrations/0001_foundation.sql), RLS helper
// functions (is_admin/is_manager/is_active_staff), and every UI surface
// that lists or labels roles (Admin → Users, task/appointment assignee
// pickers).
export const ROLE_OPTIONS = ["admin", "senior_advocate", "junior_advocate", "clerk", "staff"];

export const ROLE_LABELS = {
  admin: "Admin",
  senior_advocate: "Senior Advocate",
  junior_advocate: "Junior Advocate",
  clerk: "Clerk",
  staff: "Staff",
};

// Mirrors MANAGER_ROLES in components/tasks/permissions.js and the
// is_manager() SQL function.
export const MANAGER_ROLES = ["admin", "senior_advocate"];
