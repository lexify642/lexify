"use client";

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
      { name: "text", label: "Historical note", required: true, full: true, type: "textarea", rows: 5 },
    ],
  },
  task: {
    fields: [
      { name: "due", label: "Due date/time", required: true },
      { name: "priority", label: "Priority", type: "select", options: ["High", "Medium"] },
      { name: "text", label: "Task", required: true, full: true },
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
  if (!modal) return null;
  const { type, index } = modal;
  const isEdit = index !== null && index !== undefined;
  const config = FORM_CONFIGS[type];

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
              return (
                <label key={field.name} className={`form-field${field.full ? " full" : ""}`}>
                  {field.label}
                  {field.type === "select" ? (
                    <select name={field.name} defaultValue={defaultValue ?? field.options[0]}>
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
                      required={field.required}
                      pattern={field.pattern}
                      placeholder={field.placeholder}
                      defaultValue={defaultValue ?? ""}
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
