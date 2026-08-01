"use client";

import { useState } from "react";
import { displayDate } from "./utils";
import { toneForTaskStatus } from "@/data/team";

const TABS = [
  { key: "client", label: "Client Details" },
  { key: "hearing", label: "Upcoming Hearing" },
  { key: "previousDates", label: "Previous Dates" },
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks & Delegation" },
  { key: "documents", label: "Linked Drafts & Documents" },
];

export default function CaseOverview({ caseData, onAdd, onEdit, onDelete, onViewDocument, onEditCase, onAdvanceTaskStatus }) {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [expandedId, setExpandedId] = useState(null);

  if (!caseData) return null;

  return (
    <>
      <div className="drawer-actions">
        <button type="button" className="btn btn-outline" onClick={onEditCase}>
          ✎ Edit Case
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

      <div className="case-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`case-tab${activeTab === t.key ? " active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="case-tab-panel">
        {activeTab === "client" && (
          <section className="drawer-section">
            <div className="drawer-section-title">
              <h3>Client details</h3>
              {!caseData.client && (
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
        )}

        {activeTab === "hearing" && (
          <section className="drawer-section">
            <div className="drawer-section-title">
              <h3>Upcoming hearing</h3>
              <button type="button" className="link" onClick={() => onAdd("nextDate")}>
                + Next Date
              </button>
            </div>
            <div className="hearing-highlight">
              <b>
                {displayDate(caseData.date)} · {caseData.time}
              </b>
              <span>
                {caseData.court}, {caseData.room}
              </span>
            </div>
          </section>
        )}

        {activeTab === "previousDates" && (
          <section className="drawer-section">
            <div className="drawer-section-title">
              <h3>Previous Dates</h3>
              <button type="button" className="link" onClick={() => onAdd("previousDate")}>
                + Add previous date
              </button>
            </div>
            {caseData.previousDates.length ? (
              <div className="previous-date-list">
                {caseData.previousDates.map((pd) => {
                  const expanded = expandedId === pd.id;
                  return (
                    <article className="previous-date-card" key={pd.id}>
                      <button
                        type="button"
                        className="previous-date-head"
                        onClick={() => setExpandedId(expanded ? null : pd.id)}
                        aria-expanded={expanded}
                      >
                        <div>
                          <b>{pd.date}</b>
                          <span className="previous-date-meta">
                            {pd.court} · {pd.stage}
                          </span>
                        </div>
                        <span className="previous-date-expand">{expanded ? "▾" : "▸"}</span>
                      </button>
                      <div className="previous-date-meta">
                        <b>Purpose:</b> {pd.purpose}
                      </div>
                      <div className="previous-date-meta">
                        <b>Outcome:</b> {pd.outcome}
                      </div>
                      <div className="previous-date-meta">
                        {pd.advocate} · Updated {pd.updatedAt}
                      </div>
                      {expanded && <div className="previous-date-full-notes">{pd.fullNotes}</div>}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-inline">No previous dates recorded.</div>
            )}
          </section>
        )}

        {activeTab === "notes" && (
          <section className="drawer-section">
            <div className="drawer-section-title">
              <h3>Notes</h3>
              <button type="button" className="link" onClick={() => onAdd("note")}>
                + Add note
              </button>
            </div>
            {caseData.notes.length ? (
              caseData.notes.map((note, i) => (
                <div className="case-note" key={note.id}>
                  <div>
                    <time>{note.date}</time>
                    <p>{note.text}</p>
                  </div>
                  <span className="mini-actions">
                    <button type="button" onClick={() => onEdit("note", i)}>
                      Edit
                    </button>
                    <button type="button" className="danger-action" onClick={() => onDelete("note", i)}>
                      Delete
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-inline">No notes.</div>
            )}
          </section>
        )}

        {activeTab === "tasks" && (
          <section className="drawer-section">
            <div className="drawer-section-title">
              <h3>Tasks &amp; Delegation</h3>
              <button type="button" className="link" onClick={() => onAdd("task")}>
                + Assign task
              </button>
            </div>
            {caseData.tasks.length ? (
              caseData.tasks.map((task, i) => (
                <div className="case-task" key={task.id}>
                  <button
                    type="button"
                    className="task-check"
                    title="Click to advance status"
                    onClick={() => onAdvanceTaskStatus(i)}
                  >
                    {task.status === "Done" ? "✓" : ""}
                  </button>
                  <div>
                    <b>{task.title}</b>
                    <small>
                      {task.assignee} · {task.assigneeRole} · Due {displayDate(task.dueDate)}
                    </small>
                  </div>
                  <span className={`badge ${toneForTaskStatus(task.status)}`}>{task.status}</span>
                  <span className="mini-actions">
                    <button type="button" onClick={() => onEdit("task", i)}>
                      Edit
                    </button>
                    <button type="button" className="danger-action" onClick={() => onDelete("task", i)}>
                      Delete
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-inline">No tasks assigned yet.</div>
            )}
          </section>
        )}

        {activeTab === "documents" && (
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
                    <button type="button" className="danger-action" onClick={() => onDelete("document", i)}>
                      Delete
                    </button>
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
