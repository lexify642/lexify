"use client";

import { useState } from "react";
import { TEAM_MEMBERS } from "@/data/team";
import { EVENT_TYPE_OPTIONS, REMINDER_OPTIONS, STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/data/appointments";
import CaseSearchSelect from "@/components/calendar/CaseSearchSelect";

const ASSIGNEE_OPTIONS = TEAM_MEMBERS.map((m) => `${m.name} — ${m.role}`);

// The full Calendar Event form: an Existing Case / Independent Event toggle
// up top, then a shared field set below. Plain field-set (no <form>/backdrop
// of its own) so it can be mounted either inside AppointmentModal (edit) or
// the Calendar's AddEventModal (create) without duplicating the definition.
// Case linkage and the reminder's "Custom" sub-field are the only bits that
// need live UI state (search-select, conditional field) — everything else
// stays a plain uncontrolled input read via FormData on submit, same as the
// rest of the app's modals.
export default function AppointmentFormFields({ cases, defaultValues }) {
  const [mode, setMode] = useState(defaultValues?.caseNo ? "existing" : "independent");
  const [selectedCaseNo, setSelectedCaseNo] = useState(defaultValues?.caseNo ?? "");
  const [reminder, setReminder] = useState(defaultValues?.reminder ?? "None");

  const selectedCase = cases.find((c) => c.no === selectedCaseNo);
  const defaultAssignee = defaultValues?.assignedToName ? `${defaultValues.assignedToName} — ${defaultValues.assignedToRole}` : "";

  return (
    <div className="event-form">
      <div className="event-mode-toggle">
        <button type="button" className={`event-mode-btn${mode === "existing" ? " active" : ""}`} onClick={() => setMode("existing")}>
          Select Existing Case
        </button>
        <button
          type="button"
          className={`event-mode-btn${mode === "independent" ? " active" : ""}`}
          onClick={() => setMode("independent")}
        >
          Independent Event
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
                <b>{selectedCase.client?.name ?? "No client linked"}</b>
                Client name
              </span>
              <span>
                <b>{selectedCase.parties}</b>
                Parties
              </span>
              <span>
                <b>{selectedCase.court}</b>
                Court
              </span>
              <span>
                <b>{selectedCase.judge}</b>
                Judge
              </span>
              <span>
                <b>{selectedCase.stage}</b>
                Stage
              </span>
            </div>
          )}
        </>
      )}

      <div className="form-grid">
        <label className="form-field full">
          Event title
          <input name="title" required defaultValue={defaultValues?.title ?? ""} />
        </label>

        {mode === "independent" && (
          <label className="form-field">
            Client name (optional)
            <input name="clientName" defaultValue={defaultValues?.clientName ?? ""} />
          </label>
        )}

        <label className="form-field">
          Event type
          <select name="eventType" defaultValue={defaultValues?.eventType ?? EVENT_TYPE_OPTIONS[0]}>
            {EVENT_TYPE_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Date
          <input name="date" type="date" required defaultValue={defaultValues?.date ?? ""} />
        </label>
        <label className="form-field">
          Time
          <input name="time" required placeholder="10:30 AM" defaultValue={defaultValues?.time ?? ""} />
        </label>
        <label className="form-field">
          Location (optional)
          <input name="location" defaultValue={defaultValues?.location ?? ""} />
        </label>
        <label className="form-field">
          Assigned to
          <select name="assignedTo" defaultValue={defaultAssignee}>
            <option value="">Unassigned</option>
            {ASSIGNEE_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
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
        <label className="form-field">
          Status
          <select name="status" defaultValue={defaultValues?.status ?? STATUS_OPTIONS[0]}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
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
        <label className="form-field full">
          Notes
          <textarea name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
        </label>
      </div>
    </div>
  );
}
