"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/auth/AuthProvider";

const TasksContext = createContext(null);

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

function nowTimestamp() {
  return new Date().toISOString();
}

// Backed by Supabase (app/api/tasks/*) instead of the old
// useState(initialTasks) seed. Every exported method keeps its exact
// original signature/behavior (same optimistic local update as before), so
// TaskListWorkspace, TaskDetailsWorkspace, CaseDiary/CaseOverview's
// "+ Add Task", the Calendar's AddEventModal, and chat's
// MessageContextMenu all keep working unmodified — the only new behavior
// is a background persist call after each local update, reconciled once
// the server responds (e.g. swapping a temp id for the real one).
export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = useCurrentUser();

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/tasks")
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function addTask(data) {
    const tempId = `task-${Date.now()}`;
    const entry = {
      id: tempId,
      comments: [],
      attachments: data.attachments || [],
      activity: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowTimestamp(),
          user: data.assignedByName || currentUser.name,
          statusTo: "Pending",
          note: "Task created and assigned.",
        },
      ],
      status: "Pending",
      assignedAt: nowTimestamp(),
      ...data,
    };
    setTasks((prev) => [entry, ...prev]);

    fetchJson("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then((created) => {
        setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      })
      .catch((err) => console.error("[TasksContext] create failed", err));

    return entry;
  }

  function updateTask(id, data) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    fetchJson(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(
      (err) => console.error("[TasksContext] update failed", err)
    );
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    fetchJson(`/api/tasks/${id}`, { method: "DELETE" }).catch((err) => console.error("[TasksContext] delete failed", err));
  }

  function updateTaskStatus(id, newStatus, note) {
    const tempEntry = { id: `act-${Date.now()}`, timestamp: nowTimestamp(), user: currentUser.name, statusTo: newStatus, note: note || "" };
    setTasks((prev) => prev.map((t) => (t.id !== id ? t : { ...t, status: newStatus, activity: [tempEntry, ...t.activity] })));

    fetchJson(`/api/tasks/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, note: note || "" }),
    })
      .then(({ activity }) => {
        setTasks((prev) =>
          prev.map((t) => (t.id !== id ? t : { ...t, activity: [activity, ...t.activity.filter((a) => a.id !== tempEntry.id)] }))
        );
      })
      .catch((err) => console.error("[TasksContext] status update failed", err));
  }

  function addComment(id, text) {
    const tempComment = { id: `cmt-${Date.now()}`, user: currentUser.name, timestamp: nowTimestamp(), text };
    setTasks((prev) => prev.map((t) => (t.id !== id ? t : { ...t, comments: [tempComment, ...t.comments] })));

    fetchJson(`/api/tasks/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })
      .then((created) => {
        setTasks((prev) =>
          prev.map((t) => (t.id !== id ? t : { ...t, comments: [created, ...t.comments.filter((c) => c.id !== tempComment.id)] }))
        );
      })
      .catch((err) => console.error("[TasksContext] comment failed", err));
  }

  function addAttachment(id, filename) {
    const tempAttachment = { id: `att-${Date.now()}`, name: filename };
    setTasks((prev) => prev.map((t) => (t.id !== id ? t : { ...t, attachments: [...t.attachments, tempAttachment] })));

    fetchJson(`/api/tasks/${id}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: filename }),
    })
      .then((created) => {
        setTasks((prev) =>
          prev.map((t) => (t.id !== id ? t : { ...t, attachments: t.attachments.map((a) => (a.id === tempAttachment.id ? created : a)) }))
        );
      })
      .catch((err) => console.error("[TasksContext] attachment failed", err));
  }

  return (
    <TasksContext.Provider
      value={{ tasks, setTasks, addTask, updateTask, deleteTask, updateTaskStatus, addComment, addAttachment, loading, error }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within a TasksProvider");
  return ctx;
}
