"use client";

import { useRef, useState } from "react";
import { useCases } from "./CasesContext";
import { displayDate, toneForStage } from "./utils";
import { TASK_STATUSES } from "@/data/team";

function getInitialValues(type, index, current) {
  if (index === null || index === undefined) return null;
  if (type === "client") return current?.client ?? null;
  if (type === "note") {
    const note = current.notes[index];
    return { date: "", text: note.text, isReminder: note.isReminder, dueDate: note.dueDate };
  }
  if (type === "document") return { name: current.docs[index] };
  if (type === "task") {
    const t = current.tasks[index];
    return { title: t.title, assignee: `${t.assignee} — ${t.assigneeRole}`, dueDate: t.dueDate, status: t.status };
  }
  return null;
}

// Shared note/document/client/previous-date CRUD for one case, plus the
// top-level "add a new case" flow — used by both the Case Analytics drawer and
// the full Case Details page so the logic isn't duplicated between them.
export function useCaseActions(caseNo) {
  const { cases, setCases, logCaseEdit } = useCases();
  const [modal, setModal] = useState(null);
  const [editCaseOpen, setEditCaseOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const toastTimer = useRef(null);

  const current = cases.find((c) => c.no === caseNo) ?? null;

  function showToast(message) {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }

  function openModal(type, index = null) {
    setModal({ type, index });
  }

  function closeModal() {
    setModal(null);
  }

  function handleModalSubmit(data) {
    const { type, index } = modal;

    if (type === "case" && index === null) {
      setCases((prev) => [
        ...prev,
        {
          no: String(prev.length + 1).padStart(2, "0"),
          ...data,
          tone: toneForStage(data.stage),
          activity: "Case created",
          previousDates: [],
          notes: [],
          tasks: [],
          docs: [],
          client: null,
        },
      ]);
      closeModal();
      showToast("Changes saved.");
      return;
    }

    setCases((prev) =>
      prev.map((c) => {
        if (c.no !== caseNo) return c;
        switch (type) {
          case "client":
            return { ...c, client: data };
          case "note": {
            const entry = {
              id: index === null ? `note-${Date.now()}` : c.notes[index].id,
              date: data.date ? displayDate(data.date) : "Today",
              text: data.text,
              isReminder: data.isReminder,
              dueDate: data.isReminder ? data.dueDate || null : null,
              completed: index === null ? false : c.notes[index].completed,
            };
            return {
              ...c,
              notes: index === null ? [entry, ...c.notes] : c.notes.map((n, i) => (i === index ? entry : n)),
            };
          }
          case "nextDate": {
            const prevEntry = {
              id: `pd-${Date.now()}`,
              date: c.date ? displayDate(c.date) : "Today",
              court: `${c.court}, ${c.city}`,
              stage: c.stage,
              purpose: "Hearing",
              outcome: data.outcome,
              advocate: "John Anderson",
              updatedAt: new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              fullNotes: data.outcome,
            };
            return {
              ...c,
              previousDates: [prevEntry, ...c.previousDates],
              date: data.nextDate,
              time: data.nextTime,
            };
          }
          case "previousDate": {
            const entry = {
              id: `pd-${Date.now()}`,
              date: data.date ? displayDate(data.date) : "Today",
              court: data.court,
              stage: data.stage,
              purpose: data.purpose,
              outcome: data.outcome,
              advocate: data.advocate,
              updatedAt: new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              fullNotes: data.fullNotes,
            };
            return { ...c, previousDates: [entry, ...c.previousDates] };
          }
          case "task": {
            const [assignee, assigneeRole] = data.assignee.split(" — ");
            const entry = {
              id: index === null ? `task-${Date.now()}` : c.tasks[index].id,
              title: data.title,
              assignee,
              assigneeRole,
              dueDate: data.dueDate,
              status: data.status || "Assigned",
              createdAt: index === null ? new Date().toISOString().slice(0, 10) : c.tasks[index].createdAt,
            };
            return {
              ...c,
              tasks: index === null ? [entry, ...c.tasks] : c.tasks.map((t, i) => (i === index ? entry : t)),
            };
          }
          case "document": {
            const name = data.file?.name || data.name;
            return {
              ...c,
              docs: index === null ? [...c.docs, name] : c.docs.map((d, i) => (i === index ? name : d)),
            };
          }
          default:
            return c;
        }
      })
    );
    closeModal();
    showToast("Changes saved.");
  }

  function handleDelete(type, index) {
    if (!window.confirm(`Delete this ${type}?`)) return;
    setCases((prev) =>
      prev.map((c) => {
        if (c.no !== caseNo) return c;
        if (type === "client") return { ...c, client: null };
        if (type === "note") return { ...c, notes: c.notes.filter((_, i) => i !== index) };
        if (type === "task") return { ...c, tasks: c.tasks.filter((_, i) => i !== index) };
        if (type === "document") return { ...c, docs: c.docs.filter((_, i) => i !== index) };
        return c;
      })
    );
    showToast(`${type} deleted.`);
  }

  function handleAdvanceTaskStatus(index) {
    setCases((prev) =>
      prev.map((c) => {
        if (c.no !== caseNo) return c;
        return {
          ...c,
          tasks: c.tasks.map((t, i) => {
            if (i !== index) return t;
            const next = TASK_STATUSES[(TASK_STATUSES.indexOf(t.status) + 1) % TASK_STATUSES.length];
            return { ...t, status: next };
          }),
        };
      })
    );
  }

  function handleViewDocument(name) {
    window.alert(`Previewing ${name}\n\nIn a connected application, the selected file opens in the document viewer.`);
  }

  function openEditCase() {
    setEditCaseOpen(true);
  }

  function closeEditCase() {
    setEditCaseOpen(false);
  }

  function handleSaveCaseDetails(topLevelUpdates, caseDetails, changes) {
    setCases((prev) =>
      prev.map((c) => {
        if (c.no !== caseNo) return c;
        const updated = { ...c, ...topLevelUpdates, caseDetails };
        if (topLevelUpdates.stage && topLevelUpdates.stage !== c.stage) updated.tone = toneForStage(topLevelUpdates.stage);
        return updated;
      })
    );
    logCaseEdit(caseNo, changes);
    closeEditCase();
    showToast("Case details updated.");
  }

  return {
    current,
    modal,
    openModal,
    closeModal,
    initialValues: modal ? getInitialValues(modal.type, modal.index, current) : null,
    handleModalSubmit,
    handleDelete,
    handleAdvanceTaskStatus,
    handleViewDocument,
    editCaseOpen,
    openEditCase,
    closeEditCase,
    handleSaveCaseDetails,
    toast,
  };
}
