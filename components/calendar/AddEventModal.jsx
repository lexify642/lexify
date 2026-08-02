"use client";

import { useState } from "react";
import { useCases } from "@/components/cases/CasesContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { toneForStage } from "@/components/cases/utils";
import { FORM_CONFIGS } from "@/components/cases/CaseModal";
import AppointmentFormFields from "@/components/appointments/AppointmentFormFields";
import { readAppointmentForm } from "@/components/appointments/AppointmentModal";
import { EVENT_META, EVENT_TYPES } from "./eventAggregation";

// Renders the same field shapes CaseModal uses for its "case"/"task" configs
// (text/date/select/textarea) so Case and Task creation here stay in sync
// with the single-case forms instead of drifting into a second definition.
function GenericFields({ fields }) {
  return (
    <div className="form-grid">
      {fields.map((field) => (
        <label key={field.name} className={`form-field${field.full ? " full" : ""}`}>
          {field.label}
          {field.type === "select" ? (
            <select name={field.name} defaultValue={field.options[0]}>
              {field.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea name={field.name} required={field.required} rows={field.rows} />
          ) : (
            <input name={field.name} type={field.type || "text"} required={field.required} placeholder={field.placeholder} />
          )}
        </label>
      ))}
    </div>
  );
}

export default function AddEventModal({ open, onClose }) {
  const { cases, setCases } = useCases();
  const { addAppointment } = useAppointments();
  const [eventType, setEventType] = useState("case");

  if (!open) return null;

  const needsCasePicker = eventType === "task" || eventType === "deadline";

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fd = new FormData(form);

    if (eventType === "case") {
      const data = {};
      FORM_CONFIGS.case.fields.forEach((f) => {
        data[f.name] = fd.get(f.name) ?? "";
      });
      setCases((prev) => [
        ...prev,
        {
          no: String(prev.length + 1).padStart(2, "0"),
          ...data,
          tone: toneForStage(data.stage),
          activity: "Case created",
          previousDates: [],
          notes: [],
          tasks: [],
          docs: [],
          client: null,
        },
      ]);
    } else if (eventType === "task") {
      const targetCaseNo = fd.get("caseNo");
      const data = {};
      FORM_CONFIGS.task.fields.forEach((f) => {
        data[f.name] = fd.get(f.name) ?? "";
      });
      const [assignee, assigneeRole] = data.assignee.split(" — ");
      setCases((prev) =>
        prev.map((c) =>
          c.no !== targetCaseNo
            ? c
            : {
                ...c,
                tasks: [
                  {
                    id: `task-${Date.now()}`,
                    title: data.title,
                    assignee,
                    assigneeRole,
                    dueDate: data.dueDate,
                    status: data.status || "Assigned",
                    createdAt: new Date().toISOString().slice(0, 10),
                  },
                  ...c.tasks,
                ],
              }
        )
      );
    } else if (eventType === "deadline") {
      const targetCaseNo = fd.get("caseNo");
      const text = fd.get("text");
      const dueDate = fd.get("dueDate");
      setCases((prev) =>
        prev.map((c) =>
          c.no !== targetCaseNo
            ? c
            : {
                ...c,
                notes: [{ id: `note-${Date.now()}`, date: "Today", text, isReminder: true, dueDate, completed: false }, ...c.notes],
              }
        )
      );
    } else if (eventType === "appointment") {
      addAppointment(readAppointmentForm(form));
    }

    onClose();
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="case-modal" onSubmit={handleSubmit} key={eventType}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">CALENDAR</p>
            <h2>Add event</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="calendar-type-select">
            {EVENT_TYPES.map((type) => {
              const meta = EVENT_META[type];
              const Icon = meta.Icon;
              return (
                <button
                  type="button"
                  key={type}
                  className={`calendar-type-btn${eventType === type ? " active" : ""}`}
                  style={eventType === type ? { borderColor: meta.hex, color: meta.hex } : undefined}
                  onClick={() => setEventType(type)}
                >
                  <Icon size={15} strokeWidth={2} aria-hidden="true" /> {meta.label}
                </button>
              );
            })}
          </div>

          {needsCasePicker && (
            <div className="form-grid" style={{ marginBottom: 4 }}>
              <label className="form-field full">
                Case
                <select name="caseNo" defaultValue={cases[0]?.no} required>
                  {cases.map((c) => (
                    <option key={c.no} value={c.no}>
                      {c.number} — {c.parties}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {eventType === "case" && <GenericFields fields={FORM_CONFIGS.case.fields} />}
          {eventType === "task" && <GenericFields fields={FORM_CONFIGS.task.fields} />}
          {eventType === "deadline" && (
            <div className="form-grid">
              <label className="form-field full">
                Deadline description
                <textarea name="text" required rows={3} />
              </label>
              <label className="form-field">
                Due date
                <input name="dueDate" type="date" required />
              </label>
            </div>
          )}
          {eventType === "appointment" && <AppointmentFormFields cases={cases} defaultValues={null} />}
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
