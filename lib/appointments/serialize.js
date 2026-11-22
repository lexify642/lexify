import "server-only";

export function serializeAppointment(row, { matterDisplayNo = null } = {}) {
  return {
    id: row.id,
    title: row.title,
    eventType: row.event_type,
    date: row.event_date,
    time: row.event_time || "",
    location: row.location || "",
    caseNo: matterDisplayNo,
    clientName: row.client_name,
    notes: row.notes || "",
    assignedToName: row.assigned_to_name,
    assignedToRole: row.assigned_to_role,
    reminder: row.reminder,
    customReminderMinutes: row.custom_reminder_minutes,
    status: row.status,
    priority: row.priority,
  };
}
