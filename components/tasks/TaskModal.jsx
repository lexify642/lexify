"use client";

import TaskFormFields, { DEFAULT_ASSIGNED_BY } from "./TaskFormFields";

export function readTaskForm(form, existingAttachments = []) {
  const fd = new FormData(form);
  const assignedBy = fd.get("assignedBy") || DEFAULT_ASSIGNED_BY;
  const assignedTo = fd.get("assignedTo") || "";
  const [assignedByName, assignedByRole] = assignedBy.split(" — ");
  const [assignedToName, assignedToRole] = assignedTo ? assignedTo.split(" — ") : [null, null];
  const reminder = fd.get("reminder") || "None";
  const newFiles = fd.getAll("attachments").filter((f) => f && typeof f === "object" && f.size > 0);
  const newAttachments = newFiles.map((f, i) => ({ id: `att-${Date.now()}-${i}`, name: f.name }));
  return {
    title: fd.get("title"),
    description: fd.get("description") || "",
    caseNo: fd.get("caseNo") || null,
    clientName: fd.get("clientName") || "",
    assignedByName,
    assignedByRole,
    assignedToName,
    assignedToRole,
    priority: fd.get("priority") || "Medium",
    dueDate: fd.get("dueDate"),
    dueTime: fd.get("dueTime") || "",
    reminder,
    customReminderMinutes: reminder === "Custom" ? Number(fd.get("customReminderMinutes")) || null : null,
    notes: fd.get("notes") || "",
    attachments: [...existingAttachments, ...newAttachments],
  };
}

// "Select Existing Case" mode requires a case to actually be picked from the
// searchable dropdown — the link is a hidden input, so native HTML
// `required` can't surface this, hence the manual check.
export function validateTaskForm(form) {
  const fd = new FormData(form);
  if (fd.get("mode") === "existing" && !fd.get("caseNo")) {
    return "Please select a case, or switch to Independent Task.";
  }
  return null;
}

export default function TaskModal({ open, defaultValues, presetCaseNo, onClose, onSubmit }) {
  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const error = validateTaskForm(form);
    if (error) {
      window.alert(error);
      return;
    }
    onSubmit(readTaskForm(form, defaultValues?.attachments ?? []));
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="case-modal event-modal" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">TASK MANAGEMENT</p>
            <h2>{defaultValues ? "Edit" : "New"} task</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <TaskFormFields defaultValues={defaultValues} presetCaseNo={presetCaseNo} />
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
