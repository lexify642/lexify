"use client";

import { templateGroups } from "@/data/templates";

function TemplateCard({ template, onSelect }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(template);
    }
  };

  return (
    <article
      className="card template-card"
      tabIndex={0}
      onClick={() => onSelect(template)}
      onKeyDown={handleKeyDown}
    >
      <div className="template-icon">{template.icon}</div>
      <h3>{template.template}</h3>
      <p>{template.blurb}</p>
      <div className="variant-list">
        {template.variants.map((variant) => (
          <span className="variant" key={variant}>
            {variant}
          </span>
        ))}
      </div>
      <button className="link template-launch">Use draft →</button>
    </article>
  );
}

export default function TemplateBank({ active, onSelect }) {
  return (
    <section className={`library-view${active ? " active" : ""}`} data-library-view="templates" id="templates">
      <div className="heading-row">
        <div>
          <h2 className="section-title">Template Bank</h2>
          <p className="page-subtitle">Choose a structured legal draft and its relevant variant to begin.</p>
        </div>
        <button className="btn">+ Create from blank</button>
      </div>
      {templateGroups.map((group) => (
        <section className="template-group" key={group.heading}>
          <h2>{group.heading}</h2>
          <p>{group.description}</p>
          <div className="template-grid">
            {group.templates.map((template) => (
              <TemplateCard template={template} onSelect={onSelect} key={template.template} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
