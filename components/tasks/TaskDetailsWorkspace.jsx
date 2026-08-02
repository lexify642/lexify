"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTasks } from "./TasksContext";
import { useCases } from "@/components/cases/CasesContext";
import TaskModal from "./TaskModal";
import { canManageTask, canUpdateStatus } from "./permissions";
import { TASK_STATUSES, toneForTaskStatus, toneForPriority } from "@/data/tasks";
import { displayDate } from "@/components/cases/utils";

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatActivityDate(ts) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TaskDetailsWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const { tasks, updateTask, deleteTask, updateTaskStatus, addComment, addAttachment } = useTasks();
  const { cases } = useCases();
  const [editOpen, setEditOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [commentText, setCommentText] = useState("");

  const task = tasks.find((t) => t.id === id);
  const linkedCase = task?.caseNo ? cases.find((c) => c.no === task.caseNo) : null;
  const clientName = linkedCase?.client?.name || task?.clientName;

  if (!task) {
    return (
      <div className="page">
        <div className="empty-inline">No task found for id {id}.</div>
      </div>
    );
  }

  const manage = canManageTask();
  const updatable = canUpdateStatus(task);

  function handleDelete() {
    if (!window.confirm("Delete this task?")) return;
    deleteTask(id);
    router.push("/tasks");
  }

  function confirmStatusChange() {
    if (!statusDraft || statusDraft === task.status) return;
    updateTaskStatus(id, statusDraft, statusNote.trim());
    setStatusDraft("");
    setStatusNote("");
  }

  function handleAddComment() {
    if (!commentText.trim()) return;
    addComment(id, commentText.trim());
    setCommentText("");
  }

  function handleAttach(event) {
    const files = Array.from(event.target.files || []);
    files.forEach((f) => addAttachment(id, f.name));
    event.target.value = "";
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">TASK</p>
          <h1 className="page-title">{task.title}</h1>
          <p className="page-subtitle">{task.description || "No description provided."}</p>
        </div>
        {manage && (
          <div className="drawer-actions">
            <button type="button" className="btn btn-outline" onClick={() => setEditOpen(true)}>
              ✎ Edit
            </button>
            <button type="button" className="btn btn-outline danger-action" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>

      <section className="card">
        <div className="event-badge-row">
          <span className={`badge ${toneForTaskStatus(task.status)}`}>{task.status}</span>
          <span className={`badge ${toneForPriority(task.priority)}`}>{task.priority} priority</span>
        </div>

        <div className="matter-meta">
          <span>
            <b>
              {displayDate(task.dueDate)}
              {task.dueTime ? ` · ${task.dueTime}` : ""}
            </b>
            Due date
          </span>
          <span>
            <b>
              {task.assignedByName} ({task.assignedByRole})
            </b>
            Assigned by
          </span>
          <span>
            <b>
              {task.assignedToName} ({task.assignedToRole})
            </b>
            Assigned to
          </span>
          <span>
            <b>{formatTimestamp(task.assignedAt)}</b>
            Assignment date &amp; time
          </span>
          <span>
            <b>
              {task.reminder}
              {task.reminder === "Custom" && task.customReminderMinutes ? ` (${task.customReminderMinutes} min)` : ""}
            </b>
            Reminder
          </span>
          {clientName && (
            <span>
              <b>{clientName}</b>
              Client name
            </span>
          )}
        </div>

        {linkedCase && (
          <div className="drawer-section">
            <div className="drawer-section-title">
              <h3>Linked case</h3>
            </div>
            <div className="client-card">
              <b>{linkedCase.parties}</b>
              <span>
                {linkedCase.number} · {linkedCase.court}
              </span>
              <Link className="link" href={`/cases/${linkedCase.no}`}>
                View case →
              </Link>
            </div>
          </div>
        )}

        {task.notes && (
          <div className="drawer-section">
            <div className="drawer-section-title">
              <h3>Notes</h3>
            </div>
            <div className="case-note">{task.notes}</div>
          </div>
        )}

        <div className="drawer-section">
          <div className="drawer-section-title">
            <h3>Status</h3>
          </div>
          {updatable ? (
            <div className="task-status-control">
              <select value={statusDraft || task.status} onChange={(e) => setStatusDraft(e.target.value)}>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {statusDraft && statusDraft !== task.status && (
                <>
                  <textarea
                    placeholder="Add an update note explaining the progress..."
                    rows={3}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                  <button type="button" className="btn" onClick={confirmStatusChange}>
                    Update status
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="empty-inline">Only {task.assignedToName} or an admin can update this task's status.</div>
          )}
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">
            <h3>Activity history</h3>
          </div>
          {task.activity.length ? (
            <div className="task-activity-list">
              {task.activity.map((a) => (
                <div className="task-activity-item" key={a.id}>
                  <time>{formatActivityDate(a.timestamp)}</time>
                  <b>Status changed to {a.statusTo}</b>
                  {a.note && (
                    <>
                      <span className="task-activity-label">Note:</span>
                      <p>{a.note}</p>
                    </>
                  )}
                  <small>{a.user}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-inline">No activity yet.</div>
          )}
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">
            <h3>Comments</h3>
          </div>
          <div className="task-comment-form">
            <textarea placeholder="Add a comment..." rows={2} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <button type="button" className="btn btn-outline" onClick={handleAddComment}>
              Post comment
            </button>
          </div>
          {task.comments.length ? (
            task.comments.map((c) => (
              <div className="case-note" key={c.id}>
                <div>
                  <time>{formatTimestamp(c.timestamp)}</time>
                  <p>
                    <b>{c.user}:</b> {c.text}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-inline">No comments yet.</div>
          )}
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">
            <h3>Attachments</h3>
            {updatable && (
              <label className="link task-attach-label">
                + Add attachment
                <input type="file" multiple onChange={handleAttach} />
              </label>
            )}
          </div>
          {task.attachments.length ? (
            <div className="document-chips">
              {task.attachments.map((a) => (
                <span key={a.id}>▧ {a.name}</span>
              ))}
            </div>
          ) : (
            <div className="empty-inline">No attachments.</div>
          )}
        </div>
      </section>

      <TaskModal
        open={editOpen}
        defaultValues={task}
        onClose={() => setEditOpen(false)}
        onSubmit={(data) => {
          updateTask(id, data);
          setEditOpen(false);
        }}
      />
    </div>
  );
}
