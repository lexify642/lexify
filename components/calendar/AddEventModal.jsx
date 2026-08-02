"use client";

import { useState } from "react";
import { useCases } from "@/components/cases/CasesContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { useTasks } from "@/components/tasks/TasksContext";
import AppointmentFormFields from "@/components/appointments/AppointmentFormFields";
import { readAppointmentForm, validateEventForm } from "@/components/appointments/AppointmentModal";
import TaskFormFields from "@/components/tasks/TaskFormFields";
import { readTaskForm, validateTaskForm } from "@/components/tasks/TaskModal";

const KINDS = [
  { key: "task", label: "Task" },
  { key: "event", label: "Calendar Event" },
];

// Every event created here — whether a Task or a Calendar Event, whether
// linked to an existing case or fully independent — writes to exactly one
// place (the Tasks store or the Appointments store, respectively). Linking
// a case never mutates the Case Diary's own records; it's a live caseNo
// reference, so the Case Diary stays the single source of truth for its own
// data while the calendar can still show read-only case context and link
// back to it.
export default function AddEventModal({ open, onClose }) {
  const { cases } = useCases();
  const { addAppointment } = useAppointments();
  const { addTask } = useTasks();
  const [kind, setKind] = useState("task");

  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    if (kind === "task") {
      const error = validateTaskForm(form);
      if (error) {
        window.alert(error);
        return;
      }
      addTask(readTaskForm(form));
    } else {
      const error = validateEventForm(form);
      if (error) {
        window.alert(error);
        return;
      }
      addAppointment(readAppointmentForm(form));
    }
    onClose();
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="case-modal event-modal" onSubmit={handleSubmit} key={kind}>
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
            {KINDS.map((k) => (
              <button
                type="button"
                key={k.key}
                className={`calendar-type-btn${kind === k.key ? " active" : ""}`}
                onClick={() => setKind(k.key)}
              >
                {k.label}
              </button>
            ))}
          </div>

          {kind === "task" ? <TaskFormFields defaultValues={null} /> : <AppointmentFormFields cases={cases} defaultValues={null} />}
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
