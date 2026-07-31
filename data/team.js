// Chamber team directory used for task delegation. No auth/staff-management
// system exists in this app — this is a fixed demo roster, same convention as
// the other data/*.js seed files.
export const TEAM_MEMBERS = [
  { id: "sr-01", name: "John Anderson", role: "Senior Advocate" },
  { id: "adv-01", name: "R. Sharma", role: "Junior Advocate" },
  { id: "adv-02", name: "K. Verma", role: "Junior Advocate" },
  { id: "clerk-01", name: "P. Iyer", role: "Clerk" },
  { id: "staff-01", name: "S. Nair", role: "Staff" },
];

export const TASK_STATUSES = ["Assigned", "In Progress", "Done"];

export function toneForTaskStatus(status) {
  return { Assigned: "blue", "In Progress": "orange", Done: "green" }[status] || "blue";
}
