"use client";

import { displayDate } from "./utils";

export default function CaseDrawer({
  caseData,
  open,
  onClose,
  onEdit,
  onDelete,
  onAdd,
  onRecordHearing,
  onViewDocument,
}) {
  return (
    <>
      <div className={`drawer-backdrop${open ? " show" : ""}`} onClick={onClose} />
      <aside className={`case-drawer${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">CASE ANALYTICS</p>
            <h2>{caseData?.parties ?? "Case details"}</h2>
            <span>{caseData ? `${caseData.number} · Active matter` : ""}</span>
          </div>
          <button className="drawer-close" aria-label="Close case panel" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="drawer-content">
          {caseData && (
            <>
              <div className="drawer-actions">
                <button type="button" className="btn btn-outline" onClick={() => onEdit("case", 0)}>
                  Edit case
                </button>
                <button
                  type="button"
                  className="btn btn-outline danger-outline"
                  onClick={() => onDelete("case")}
                >
                  Delete case
                </button>
              </div>

              <div className="matter-meta">
                <span>
                  <b>{caseData.court}</b>
                  {caseData.city} · {caseData.room}
                </span>
                <span>
                  <b>{caseData.judge}</b>
                  Presiding judge
                </span>
                <span>
                  <b>{caseData.stage}</b>
                  Current stage
                </span>
              </div>

              <section className="drawer-section">
                <div className="drawer-section-title">
                  <h3>Client details</h3>
                  {caseData.client ? (
                    <span>
                      <button type="button" className="link" onClick={() => onEdit("client", 0)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link danger-link"
                        onClick={() => onDelete("client")}
                      >
                        Delete
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="link" onClick={() => onAdd("client")}>
                      + Add client
                    </button>
                  )}
                </div>
                {caseData.client ? (
                  <div className="client-card">
                    <b>{caseData.client.name}</b>
                    <span>{caseData.client.phone}</span>
                    <span>{caseData.client.address}</span>
                  </div>
                ) : (
                  <div className="empty-inline">No client linked.</div>
                )}
              </section>

              <section className="drawer-section">
                <h3>Upcoming hearing</h3>
                <div className="hearing-highlight">
                  <b>
                    {displayDate(caseData.date)} · {caseData.time}
                  </b>
                  <span>
                    {caseData.court}, {caseData.room}
                  </span>
                </div>
              </section>

              <section className="drawer-section">
                <h3>Registration &amp; lifecycle</h3>
                <p className="lifecycle-intro">
                  <b>Registered {caseData.registered}</b>
                  {caseData.filing}
                </p>
                <div className="case-timeline">
                  {caseData.history.map(([date, title, result], i) => (
                    <article key={i}>
                      <time>{date}</time>
                      <div>
                        <b>{title}</b>
                        <p>{result}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <button type="button" className="link" onClick={onRecordHearing}>
                  + Record hearing
                </button>
              </section>

              <section className="drawer-section">
                <div className="drawer-section-title">
                  <h3>Historical notes</h3>
                  <button type="button" className="link" onClick={() => onAdd("note")}>
                    + Add note
                  </button>
                </div>
                {caseData.notes.length ? (
                  caseData.notes.map(([date, text], i) => (
                    <div className="case-note" key={i}>
                      <div>
                        <time>{date}</time>
                        <p>{text}</p>
                      </div>
                      <span className="mini-actions">
                        <button type="button" onClick={() => onEdit("note", i)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-action"
                          onClick={() => onDelete("note", i)}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-inline">No historical notes.</div>
                )}
              </section>

              <section className="drawer-section">
                <div className="drawer-section-title">
                  <h3>Reminders &amp; tasks</h3>
                  <button type="button" className="link" onClick={() => onAdd("task")}>
                    + Add task
                  </button>
                </div>
                {caseData.tasks.length ? (
                  caseData.tasks.map(([due, text, priority], i) => (
                    <div className="case-task" key={i}>
                      <span className="task-check">✓</span>
                      <div>
                        <b>{text}</b>
                        <small>Due {due}</small>
                      </div>
                      <em className={`priority ${priority.toLowerCase()}`}>{priority}</em>
                      <span className="mini-actions">
                        <button type="button" onClick={() => onEdit("task", i)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-action"
                          onClick={() => onDelete("task", i)}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-inline">No active tasks.</div>
                )}
              </section>

              <section className="drawer-section">
                <div className="drawer-section-title">
                  <h3>Linked drafts &amp; documents</h3>
                  <button type="button" className="link" onClick={() => onAdd("document")}>
                    + Add document
                  </button>
                </div>
                <div className="document-chips">
                  {caseData.docs.map((doc, i) => (
                    <span key={i}>
                      ▧ {doc}
                      <span className="mini-actions">
                        <button type="button" onClick={() => onViewDocument(doc)}>
                          View
                        </button>
                        <button type="button" onClick={() => onEdit("document", i)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-action"
                          onClick={() => onDelete("document", i)}
                        >
                          Delete
                        </button>
                      </span>
                    </span>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
