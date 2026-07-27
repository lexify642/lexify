"use client";

import { useEffect, useState } from "react";
import { BASE_FIELDS, CATEGORY_FIELD_GROUPS, CATEGORY_STORAGE_KEY } from "./editCaseFieldsConfig";

function buildValues(caseData) {
  const cd = caseData?.caseDetails || {};
  const values = {};
  BASE_FIELDS.forEach((f) => {
    values[f.name] = (f.topLevel ? caseData?.[f.topLevelKey] : cd[f.name]) ?? "";
  });
  Object.values(CATEGORY_STORAGE_KEY).forEach((key) => {
    values[key] = { ...(cd[key] || {}) };
  });
  return values;
}

export function diffEditCaseValues(initial, current) {
  const changes = [];
  BASE_FIELDS.forEach((f) => {
    const oldVal = initial[f.name] || "";
    const newVal = current[f.name] || "";
    if (oldVal !== newVal) changes.push({ field: f.label, previous: oldVal || "(empty)", new: newVal || "(empty)" });
  });
  const categoryKey = CATEGORY_STORAGE_KEY[current.caseCategory];
  const groupFields = CATEGORY_FIELD_GROUPS[current.caseCategory] || [];
  groupFields.forEach((f) => {
    const oldVal = initial[categoryKey]?.[f.name] || "";
    const newVal = current[categoryKey]?.[f.name] || "";
    if (oldVal !== newVal) changes.push({ field: f.label, previous: oldVal || "(empty)", new: newVal || "(empty)" });
  });
  return changes;
}

export default function EditCaseModal({ open, caseData, onClose, onSave }) {
  const [values, setValues] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (open && caseData) {
      const initial = buildValues(caseData);
      setValues(initial);
      setSnapshot(initial);
    }
  }, [open, caseData?.no]);

  if (!open || !caseData || !values) return null;

  function handleBaseChange(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function handleCategoryChange(name, value) {
    const key = CATEGORY_STORAGE_KEY[values.caseCategory];
    setValues((v) => ({ ...v, [key]: { ...v[key], [name]: value } }));
  }

  function handleReset() {
    setValues(snapshot);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;

    const changes = diffEditCaseValues(snapshot, values);

    const topLevelUpdates = {};
    BASE_FIELDS.forEach((f) => {
      if (f.topLevel) topLevelUpdates[f.topLevelKey] = values[f.name];
    });

    const caseDetails = {};
    BASE_FIELDS.forEach((f) => {
      if (!f.topLevel) caseDetails[f.name] = values[f.name];
    });
    Object.values(CATEGORY_STORAGE_KEY).forEach((key) => {
      caseDetails[key] = values[key];
    });

    onSave(topLevelUpdates, caseDetails, changes);
  }

  const categoryKey = CATEGORY_STORAGE_KEY[values.caseCategory];
  const categoryFields = CATEGORY_FIELD_GROUPS[values.caseCategory] || [];

  function renderField(field, value, onChange) {
    const id = `edit-case-${field.name}`;
    return (
      <div className={`field${field.full ? " full" : ""}`} key={field.name}>
        <label htmlFor={id}>
          {field.label} {field.required && <span className="req">*</span>}
        </label>
        {field.type === "select" ? (
          <select id={id} required={field.required} value={value} onChange={(e) => onChange(field.name, e.target.value)}>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "—"}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            id={id}
            required={field.required}
            rows={field.rows || 3}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        ) : (
          <input
            id={id}
            type={field.type || "text"}
            required={field.required}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        )}
        {field.hint && <div className="hint">{field.hint}</div>}
      </div>
    );
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="case-modal wide" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">CASE ANALYTICS</p>
            <h2>Edit Case</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <h4>Case Information</h4>
            <div className="field-row">{BASE_FIELDS.map((f) => renderField(f, values[f.name], handleBaseChange))}</div>
          </div>

          {categoryFields.length > 0 && (
            <div className="field-group">
              <h4>{values.caseCategory} Details</h4>
              <div className="field-row">
                {categoryFields.map((f) => renderField(f, values[categoryKey][f.name] || "", handleCategoryChange))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={handleReset}>
            Reset Changes
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" type="submit">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
