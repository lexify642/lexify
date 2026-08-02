"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { displayDate } from "./utils";
import { toneForTaskStatus } from "@/data/tasks";
import { useTasks } from "@/components/tasks/TasksContext";
import TaskModal from "@/components/tasks/TaskModal";

const TABS = [
  { key: "client", label: "Client Details" },
  { key: "hearing", label: "Upcoming Hearing" },
  { key: "previousDates", label: "Previous Dates" },
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks" },
  { key: "documents", label: "Linked Drafts & Documents" },
];

const TASK_GROUPS = [
  { key: "pending", label: "Pending Tasks", match: (status) => status === "Pending" },
  { key: "inProgress", label: "In Progress Tasks", match: (status) => status === "In Progress" || status === "Waiting for Review" },
  { key: "completed", label: "Completed Tasks", match: (status) => status === "Completed" },
];

export default function CaseOverview({ caseData, onAdd, onEdit, onDelete, onViewDocument, onEditCase, initialTab }) {
  const [activeTab, setActiveTab] = useState(TABS.some((t) => t.key === initialTab) ? initialTab : TABS[0].key);
  const [expandedId, setExpandedId] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const { tasks, addTask } = useTasks();

  const caseTasks = useMemo(() => tasks.filter((t) => t.caseNo === caseData?.no), [tasks, caseData?.no]);

  if (!caseData) return null;

  function handleAddTask(data) {
    addTask(data);
    setTaskModalOpen(false);
  }

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
              <h3>Tasks</h3>
              <button type="button" className="link" onClick={() => setTaskModalOpen(true)}>
                + Assign task
              </button>
            </div>
            {caseTasks.length ? (
              <div className="case-task-groups">
                {TASK_GROUPS.map((group) => {
                  const groupTasks = caseTasks.filter((t) => group.match(t.status));
                  return (
                    <div className="case-task-group" key={group.key}>
                      <h4>
                        {group.label} <span className="case-task-group-count">{groupTasks.length}</span>
                      </h4>
                      {groupTasks.length ? (
                        groupTasks.map((task) => (
                          <Link href={`/tasks/${task.id}`} className="case-task" key={task.id}>
                            <div>
                              <b>{task.title}</b>
                              <small>
                                {task.assignedToName} · {task.assignedToRole} · Due {displayDate(task.dueDate)}
                              </small>
                            </div>
                            <span className={`badge ${toneForTaskStatus(task.status)}`}>{task.status}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="empty-inline">None.</div>
                      )}
                    </div>
                  );
                })}
              </div>
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

      <TaskModal open={taskModalOpen} presetCaseNo={caseData.no} onClose={() => setTaskModalOpen(false)} onSubmit={handleAddTask} />
    </>
  );
}
