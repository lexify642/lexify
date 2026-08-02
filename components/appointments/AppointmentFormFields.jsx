"use client";

import { APPOINTMENT_TYPES } from "@/data/appointments";

// Plain field-set (no <form>/backdrop of its own) so it can be mounted either
// inside AppointmentModal (edit) or inside the Calendar's AddEventModal
// (create) without duplicating the field definitions in two places.
export default function AppointmentFormFields({ cases, defaultValues }) {
  return (
    <div className="form-grid">
      <label className="form-field full">
        Title
        <input name="title" required defaultValue={defaultValues?.title ?? ""} />
      </label>
      <label className="form-field">
        Type
        <select name="type" defaultValue={defaultValues?.type ?? APPOINTMENT_TYPES[0]}>
          {APPOINTMENT_TYPES.map((t) => (
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
        Location
        <input name="location" required defaultValue={defaultValues?.location ?? ""} />
      </label>
      <label className="form-field">
        Linked case (optional)
        <select name="caseNo" defaultValue={defaultValues?.caseNo ?? ""}>
          <option value="">None</option>
          {cases.map((c) => (
            <option key={c.no} value={c.no}>
              {c.number} — {c.parties}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        Client name (optional)
        <input name="clientName" defaultValue={defaultValues?.clientName ?? ""} />
      </label>
      <label className="form-field full">
        Notes
        <textarea name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
      </label>
    </div>
  );
}
