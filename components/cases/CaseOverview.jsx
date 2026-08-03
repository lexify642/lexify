"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { displayDate } from "./utils";
import { toneForTaskStatus } from "@/data/tasks";
import { useTasks } from "@/components/tasks/TasksContext";
import { useCases } from "@/components/cases/CasesContext";
import { useChat, caseConversationId } from "@/components/chat/ChatContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { buildConversations } from "@/components/chat/conversationUtils";
import { canAccessCaseRoom } from "@/components/chat/permissions";
import { formatFileSize } from "@/data/attachments";
import AttachFileMenu from "@/components/chat/AttachFileMenu";
import TaskModal from "@/components/tasks/TaskModal";
import CaseHealthBadge from "@/components/intelligence/CaseHealthBadge";
import CaseInsightsPanel from "./CaseInsightsPanel";

const TABS = [
  { key: "client", label: "Client Details" },
  { key: "hearing", label: "Upcoming Hearing" },
  { key: "previousDates", label: "Previous Dates" },
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks" },
  { key: "documents", label: "Linked Drafts & Documents" },
  { key: "insights", label: "Insights" },
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
  const { cases } = useCases();
  const { groups, directConversations, clientChatAssignments } = useChat();
  const { attachments } = useAttachments();

  const caseTasks = useMemo(() => tasks.filter((t) => t.caseNo === caseData?.no), [tasks, caseData?.no]);
  const linkedAttachments = useMemo(() => attachments.filter((a) => a.linkedCaseNo === caseData?.no), [attachments, caseData?.no]);
  const conversations = useMemo(
    () => buildConversations({ cases, tasks, groups, directConversations, clientChatAssignments }),
    [cases, tasks, groups, directConversations, clientChatAssignments]
  );

  if (!caseData) return null;

  const hasDiscussionRoom = canAccessCaseRoom(caseData, tasks);

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
        <CaseHealthBadge caseData={caseData} showLevel />
        {hasDiscussionRoom && (
          <Link className="btn btn-outline" href={`/chat?c=${caseConversationId(caseData.no)}`}>
            💬 Discussion Room
          </Link>
        )}
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

            <div className="drawer-section-title" style={{ marginTop: 22 }}>
              <h3>Shared from Communication Hub</h3>
              {hasDiscussionRoom && (
                <Link className="link" href={`/chat?c=${caseConversationId(caseData.no)}`}>
                  Open Discussion Room →
                </Link>
              )}
            </div>
            {linkedAttachments.length ? (
              <div className="case-linked-attachments">
                {linkedAttachments.map((a) => (
                  <div className="chat-linked-row shared-doc-row" key={a.id}>
                    <a href={a.objectUrl || "#"} download={a.name} className="shared-doc-link">
                      <strong>{a.name}</strong>
                      <span>
                        {a.mimeCategory.toUpperCase()} · {formatFileSize(a.size)} · {a.category || "Uncategorized"} · Uploaded by{" "}
                        {a.uploadedBy}
                      </span>
                    </a>
                    <AttachFileMenuButton attachment={a} conversations={conversations} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-inline">
                No files saved from the Communication Hub yet — use "Save to Case" or "Attach to Case" on any chat attachment.
              </div>
            )}
          </section>
        )}

        {activeTab === "insights" && <CaseInsightsPanel caseData={caseData} caseTasks={caseTasks} hasDiscussionRoom={hasDiscussionRoom} />}
      </div>

      <TaskModal open={taskModalOpen} presetCaseNo={caseData.no} onClose={() => setTaskModalOpen(false)} onSubmit={handleAddTask} />
    </>
  );
}

function AttachFileMenuButton({ attachment, conversations }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <button type="button" className="msg-attachment-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
        ⋮
      </button>
      {menuOpen && <AttachFileMenu attachment={attachment} conversations={conversations} onClose={() => setMenuOpen(false)} />}
    </>
  );
}
