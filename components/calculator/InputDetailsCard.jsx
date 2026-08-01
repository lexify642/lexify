"use client";

export default function InputDetailsCard({ group, values, onChange, onReset }) {
  return (
    <section className="card">
      <div className="panel-title-row">
        <h2 className="panel-title">{group.title}</h2>
        {onReset && (
          <button type="button" className="link" onClick={onReset}>
            ↺ Reset all fields
          </button>
        )}
      </div>
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
      <div className="hint" style={{ textAlign: "right", marginTop: 8 }}>
        <span className="req">*</span> Mandatory fields
      </div>
    </section>
  );
}
