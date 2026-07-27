"use client";

import { INPUT_FIELD_GROUPS } from "./inputFieldsConfig";

export default function InputDetailsCard({ values, onChange, onCalculate, onReset }) {
  return (
    <section className="card">
      <h2 className="panel-title">1. Input Details</h2>
      {INPUT_FIELD_GROUPS.map((group) => (
        <div className="field-group" key={group.id}>
          <h4>{group.title}</h4>
          <div className="field-row">
            {group.fields.map((field) => {
              if (field.visible && !field.visible(values)) return null;
              const id = `calc-${field.key}`;
              if (field.type === "toggle") {
                return (
                  <label className="toggle-field" key={field.key} htmlFor={id}>
                    <span className="switch">
                      <input
                        id={id}
                        type="checkbox"
                        checked={!!values[field.key]}
                        onChange={(e) => onChange(field.key, e.target.checked)}
                      />
                      <span className="switch-track" />
                    </span>
                    {field.label}
                  </label>
                );
              }
              return (
                <div className="field" key={field.key}>
                  <label htmlFor={id}>{field.label} {field.required !== false && field.type !== "text" ? <span className="req">*</span> : null}</label>
                  {field.type === "select" ? (
                    <select id={id} value={values[field.key]} onChange={(e) => onChange(field.key, e.target.value)}>
                      {field.options(values).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "number" ? (
                    <input
                      id={id}
                      inputMode="numeric"
                      value={values[field.key]}
                      onChange={(e) => onChange(field.key, e.target.value)}
                    />
                  ) : (
                    <input id={id} value={values[field.key]} onChange={(e) => onChange(field.key, e.target.value)} />
                  )}
                  {field.hint && <div className="hint">{field.hint}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="form-navigation">
        <button type="button" className="btn btn-outline" onClick={onReset}>
          ↺ Reset
        </button>
        <button type="button" className="btn" onClick={onCalculate}>
          🖩 Calculate Estimate
        </button>
      </div>
      <div className="hint" style={{ textAlign: "right", marginTop: 8 }}>
        <span className="req">*</span> Mandatory fields
      </div>
    </section>
  );
}
