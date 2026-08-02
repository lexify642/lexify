"use client";

import { createContext, useContext, useState } from "react";
import { initialTasks } from "@/data/tasks";
import { CURRENT_USER } from "@/data/team";

const TasksContext = createContext(null);

function nowTimestamp() {
  return new Date().toISOString();
}

// Shared, in-memory (no backend) session store for the Task Management
// module — same pattern as CasesContext/AppointmentsContext. This is the
// single source of truth for tasks: the Case Diary's Tasks tab, the
// Calendar's task events, and the Dashboard's task widgets all read from
// (and mutate through) this context instead of keeping their own copies.
export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(initialTasks);

  function addTask(data) {
    const entry = {
      id: `task-${Date.now()}`,
      comments: [],
      attachments: [],
      activity: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowTimestamp(),
          user: CURRENT_USER.name,
          statusTo: "Pending",
          note: "Task created and assigned.",
        },
      ],
      status: "Pending",
      ...data,
    };
    setTasks((prev) => [entry, ...prev]);
    return entry;
  }

  function updateTask(id, data) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTaskStatus(id, newStatus, note) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const entry = { id: `act-${Date.now()}`, timestamp: nowTimestamp(), user: CURRENT_USER.name, statusTo: newStatus, note: note || "" };
        return { ...t, status: newStatus, activity: [entry, ...t.activity] };
      })
    );
  }

  function addComment(id, text) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const comment = { id: `cmt-${Date.now()}`, user: CURRENT_USER.name, timestamp: nowTimestamp(), text };
        return { ...t, comments: [comment, ...t.comments] };
      })
    );
  }

  function addAttachment(id, filename) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const attachment = { id: `att-${Date.now()}`, name: filename };
        return { ...t, attachments: [...t.attachments, attachment] };
      })
    );
  }

  return (
    <TasksContext.Provider value={{ tasks, setTasks, addTask, updateTask, deleteTask, updateTaskStatus, addComment, addAttachment }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within a TasksProvider");
  return ctx;
}
