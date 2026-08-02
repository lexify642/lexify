"use client";

import { useState } from "react";
import { TEAM_MEMBERS, CURRENT_USER } from "@/data/team";
import { PRIORITY_OPTIONS, REMINDER_OPTIONS } from "@/data/tasks";
import { useCases } from "@/components/cases/CasesContext";
import CaseSearchSelect from "@/components/calendar/CaseSearchSelect";

const ASSIGNEE_OPTIONS = TEAM_MEMBERS.map((m) => `${m.name} — ${m.role}`);
export const DEFAULT_ASSIGNED_BY = `${CURRENT_USER.name} — ${CURRENT_USER.role}`;

// Plain field-set (no <form>/backdrop of its own), same split used for
// AppointmentFormFields — mounted inside TaskModal (standalone create/edit)
// or the Calendar's AddEventModal (Task/Calendar Event toggle) without
// duplicating the field definitions. Status is deliberately not editable
// here: every status change goes through TaskDetailsWorkspace's
// updateTaskStatus, which prompts for a note, so the activity history stays
// complete.
export default function TaskFormFields({ defaultValues, presetCaseNo }) {
  const { cases } = useCases();
  const [mode, setMode] = useState(defaultValues?.caseNo || presetCaseNo ? "existing" : "independent");
  const [selectedCaseNo, setSelectedCaseNo] = useState(defaultValues?.caseNo ?? presetCaseNo ?? "");
  const [reminder, setReminder] = useState(defaultValues?.reminder ?? "None");

  const selectedCase = cases.find((c) => c.no === selectedCaseNo);
  const defaultAssignedBy = defaultValues?.assignedByName ? `${defaultValues.assignedByName} — ${defaultValues.assignedByRole}` : DEFAULT_ASSIGNED_BY;
  const defaultAssignedTo = defaultValues?.assignedToName ? `${defaultValues.assignedToName} — ${defaultValues.assignedToRole}` : "";

  return (
    <div className="event-form">
      <div className="event-mode-toggle">
        <button type="button" className={`event-mode-btn${mode === "existing" ? " active" : ""}`} onClick={() => setMode("existing")}>
          Select Existing Case
        </button>
        <button type="button" className={`event-mode-btn${mode === "independent" ? " active" : ""}`} onClick={() => setMode("independent")}>
          Independent Task
        </button>
      </div>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="caseNo" value={mode === "existing" ? selectedCaseNo : ""} />

      {mode === "existing" && (
        <>
          <div className="form-grid">
            <label className="form-field full">
              Case
              <CaseSearchSelect cases={cases} value={selectedCaseNo} onChange={setSelectedCaseNo} />
            </label>
          </div>
          {selectedCase && (
            <div className="matter-meta event-case-readonly">
              <span>
                <b>{selectedCase.number}</b>
                Case number
              </span>
              <span>
                <b>{selectedCase.parties}</b>
                Case title
              </span>
              <span>
                <b>{selectedCase.client?.name ?? "No client linked"}</b>
                Client name
              </span>
              <span>
                <b>{selectedCase.court}</b>
                Court
              </span>
            </div>
          )}
        </>
      )}

      <div className="form-grid">
        <label className="form-field full">
          Task title
          <input name="title" required defaultValue={defaultValues?.title ?? ""} />
        </label>
        <label className="form-field full">
          Description
          <textarea name="description" rows={3} defaultValue={defaultValues?.description ?? ""} />
        </label>

        {mode === "independent" && (
          <label className="form-field">
            Client name (optional)
            <input name="clientName" defaultValue={defaultValues?.clientName ?? ""} />
          </label>
        )}

        <label className="form-field">
          Assigned by
          <select name="assignedBy" defaultValue={defaultAssignedBy}>
            {ASSIGNEE_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Assigned to
          <select name="assignedTo" defaultValue={defaultAssignedTo} required>
            <option value="" disabled>
              Select a person
            </option>
            {ASSIGNEE_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Priority
          <select name="priority" defaultValue={defaultValues?.priority ?? "Medium"}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Due date
          <input name="dueDate" type="date" required defaultValue={defaultValues?.dueDate ?? ""} />
        </label>
        <label className="form-field">
          Due time (optional)
          <input name="dueTime" placeholder="10:30 AM" defaultValue={defaultValues?.dueTime ?? ""} />
        </label>
        <label className="form-field">
          Reminder
          <select name="reminder" value={reminder} onChange={(e) => setReminder(e.target.value)}>
            {REMINDER_OPTIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        {reminder === "Custom" && (
          <label className="form-field">
            Custom reminder (minutes before)
            <input name="customReminderMinutes" type="number" min="1" defaultValue={defaultValues?.customReminderMinutes ?? ""} />
          </label>
        )}
        <label className="form-field full">
          Notes / comments
          <textarea name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
        </label>
        <label className="form-field full">
          Attach documents
          <input type="file" name="attachments" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
          {defaultValues?.attachments?.length > 0 && <small>{defaultValues.attachments.length} file(s) already attached.</small>}
        </label>
      </div>
    </div>
  );
}
