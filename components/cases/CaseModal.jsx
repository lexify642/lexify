"use client";

import { useEffect, useState } from "react";
import { TEAM_MEMBERS, TASK_STATUSES } from "@/data/team";
import { checkConflicts } from "./clientDirectory";
import { useCases } from "./CasesContext";

const ASSIGNEE_OPTIONS = TEAM_MEMBERS.map((m) => `${m.name} — ${m.role}`);

const STAGE_OPTIONS = [
  "Institution",
  "Notice Stage",
  "Admission",
  "Written Statement",
  "Evidence",
  "Cross Examination",
  "Arguments",
  "Final Hearing",
  "Reply",
  "Judgment",
];

const FORM_CONFIGS = {
  case: {
    fields: [
      { name: "number", label: "Case number", required: true },
      { name: "parties", label: "Parties", required: true },
      { name: "court", label: "Court", required: true },
      { name: "city", label: "City", required: true },
      { name: "room", label: "Room", required: true },
      { name: "judge", label: "Judge", required: true },
      { name: "date", label: "Next date", type: "date", required: true },
      { name: "time", label: "Time", required: true, placeholder: "10:30 AM" },
      { name: "stage", label: "Stage", type: "select", options: ["Admission", "Final Hearing", "Evidence", "Reply"] },
      { name: "registered", label: "Registration date", required: true },
      { name: "filing", label: "Filing details", required: true, full: true },
    ],
  },
  client: {
    fields: [
      { name: "name", label: "Client name", required: true, full: true },
      { name: "phone", label: "Phone number", required: true, pattern: "[0-9+ ()-]{7,}" },
      { name: "address", label: "Address", required: true, full: true, type: "textarea", rows: 3 },
    ],
  },
  note: {
    fields: [
      { name: "date", label: "Hearing date", type: "date", required: true },
      { name: "text", label: "Note", required: true, full: true, type: "textarea", rows: 5 },
      { name: "isReminder", label: "Mark as Reminder", type: "checkbox", full: true },
      { name: "dueDate", label: "Due Date", type: "date", dependsOn: "isReminder" },
    ],
  },
  previousDate: {
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "court", label: "Court", required: true },
      { name: "stage", label: "Stage of Proceedings", type: "select", options: STAGE_OPTIONS },
      { name: "purpose", label: "Purpose of Hearing", required: true, full: true },
      { name: "outcome", label: "Outcome / Proceedings", required: true, full: true },
      { name: "advocate", label: "Advocate / User", required: true },
      { name: "fullNotes", label: "Complete Notes", full: true, type: "textarea", rows: 5 },
    ],
  },
  nextDate: {
    fields: [
      { name: "outcome", label: "Outcome / Proceedings (this hearing)", required: true, full: true, type: "textarea", rows: 4 },
      { name: "nextDate", label: "Next Hearing Date", type: "date", required: true },
      { name: "nextTime", label: "Next Hearing Time", required: true, placeholder: "10:30 AM" },
    ],
  },
  task: {
    fields: [
      { name: "title", label: "Task", required: true, full: true },
      { name: "assignee", label: "Assign To", type: "select", options: ASSIGNEE_OPTIONS },
      { name: "dueDate", label: "Due Date", type: "date", required: true },
      { name: "status", label: "Status", type: "select", options: TASK_STATUSES },
    ],
  },
  document: {
    fields: [
      { name: "name", label: "Document / draft name", required: true, full: true },
      {
        name: "file",
        label: "Upload new document",
        type: "file",
        full: true,
        accept: ".pdf,.doc,.docx,.xlsx",
        hint: "Selected filename will be added to this demo case.",
      },
    ],
  },
};

export default function CaseModal({ modal, initialValues, onClose, onSubmit }) {
  const config = modal ? FORM_CONFIGS[modal.type] : null;
  const [watched, setWatched] = useState({});
  const [partiesValue, setPartiesValue] = useState("");
  const [conflictMatches, setConflictMatches] = useState([]);
  const { cases } = useCases();

  useEffect(() => {
    if (!config) return;
    const w = {};
    config.fields.forEach((field) => {
      if (field.type === "checkbox") w[field.name] = !!initialValues?.[field.name];
    });
    setWatched(w);
    setPartiesValue(initialValues?.parties ?? "");
    setConflictMatches([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal?.type, modal?.index]);

  // Quick conflict-of-interest check as the advocate types the new matter's
  // parties — non-blocking, just an inline heads-up (see clientDirectory.js).
  useEffect(() => {
    if (modal?.type !== "case") return;
    const timer = setTimeout(() => {
      setConflictMatches(checkConflicts(partiesValue, cases));
    }, 400);
    return () => clearTimeout(timer);
  }, [partiesValue, modal?.type, cases]);

  if (!modal) return null;
  const { type, index } = modal;
  const isEdit = index !== null && index !== undefined;

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const data = {};
    config.fields.forEach((field) => {
      if (field.type === "file") {
        const file = formData.get(field.name);
        data[field.name] = file && file.size > 0 ? file : null;
      } else if (field.type === "checkbox") {
        data[field.name] = formData.get(field.name) === "on";
      } else {
        data[field.name] = formData.get(field.name) ?? "";
      }
    });
    onSubmit(data);
  };

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="case-modal" onSubmit={handleSubmit} key={`${type}-${index}`}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">CASE DIARY</p>
            <h2>
              {isEdit ? "Edit" : "Add"} {type}
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            {config.fields.map((field) => {
              const defaultValue = initialValues?.[field.name];
              const disabled = field.dependsOn ? !watched[field.dependsOn] : false;
              const isPartiesField = type === "case" && field.name === "parties";

              if (isPartiesField) {
                return (
                  <label key={field.name} className={`form-field${field.full ? " full" : ""}`}>
                    {field.label}
                    <input
                      name={field.name}
                      required={field.required}
                      value={partiesValue}
                      onChange={(e) => setPartiesValue(e.target.value)}
                    />
                    {conflictMatches.length > 0 && (
                      <div className="conflict-hint">
                        ⚠ Possible conflict — matches {conflictMatches.length} existing record(s):
                        <ul>
                          {conflictMatches.slice(0, 3).map((m, i) => (
                            <li key={i}>
                              <b>{m.matchedName}</b> ({m.matchedAs}) in {m.parties} — {m.number}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </label>
                );
              }

              if (field.type === "checkbox") {
                return (
                  <label key={field.name} className={`toggle-field${field.full ? " full" : ""}`}>
                    <span className="switch">
                      <input
                        name={field.name}
                        type="checkbox"
                        defaultChecked={!!defaultValue}
                        onChange={(e) => setWatched((prev) => ({ ...prev, [field.name]: e.target.checked }))}
                      />
                      <span className="switch-track" />
                    </span>
                    {field.label}
                  </label>
                );
              }

              return (
                <label key={field.name} className={`form-field${field.full ? " full" : ""}${disabled ? " disabled" : ""}`}>
                  {field.label}
                  {field.type === "select" ? (
                    <select name={field.name} defaultValue={defaultValue ?? field.options[0]} disabled={disabled}>
                      {field.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      required={field.required}
                      rows={field.rows}
                      defaultValue={defaultValue ?? ""}
                      disabled={disabled}
                    />
                  ) : field.type === "file" ? (
                    <>
                      <input name={field.name} type="file" accept={field.accept} />
                      {field.hint && <small>{field.hint}</small>}
                    </>
                  ) : (
                    <input
                      name={field.name}
                      type={field.type || "text"}
                      required={field.required && !disabled}
                      pattern={field.pattern}
                      placeholder={field.placeholder}
                      defaultValue={defaultValue ?? ""}
                      disabled={disabled}
                    />
                  )}
                </label>
              );
            })}
          </div>
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
