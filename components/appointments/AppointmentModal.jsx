"use client";

import { useCases } from "@/components/cases/CasesContext";
import AppointmentFormFields from "./AppointmentFormFields";

export function readAppointmentForm(form) {
  const fd = new FormData(form);
  return {
    title: fd.get("title"),
    type: fd.get("type"),
    date: fd.get("date"),
    time: fd.get("time"),
    location: fd.get("location"),
    caseNo: fd.get("caseNo") || null,
    clientName: fd.get("clientName") || null,
    notes: fd.get("notes") || "",
  };
}

export default function AppointmentModal({ open, initialValues, onClose, onSubmit }) {
  const { cases } = useCases();
  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    onSubmit(readAppointmentForm(form));
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="case-modal" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">APPOINTMENTS</p>
            <h2>{initialValues ? "Edit" : "Add"} appointment</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <AppointmentFormFields cases={cases} defaultValues={initialValues} />
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
