"use client";

import { createContext, useContext, useState } from "react";
import { CURRENT_USER } from "@/data/team";
import { initialAttachments, categoryForFile } from "@/data/attachments";

const AttachmentsContext = createContext(null);

function newId() {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// The Document Library's single source of truth (see data/attachments.js).
// Files never leave the browser — there's no storage backend in this app —
// so "uploading" a file just wraps it in a session-local object URL
// (URL.createObjectURL), the same honesty level as the Case Diary's
// existing filename-only docs[] tracking.
export function AttachmentsProvider({ children }) {
  const [attachments, setAttachments] = useState(initialAttachments);

  function addAttachment(file, meta = {}) {
    const entry = {
      id: newId(),
      name: file.name || "Untitled",
      mimeCategory: categoryForFile(file),
      size: file.size || 0,
      objectUrl: typeof URL !== "undefined" && file instanceof Blob ? URL.createObjectURL(file) : null,
      uploadedBy: CURRENT_USER.name,
      uploadedAt: new Date().toISOString(),
      sourceConversationId: meta.sourceConversationId || null,
      sourceMessageId: meta.sourceMessageId || null,
      category: meta.category || null,
      description: meta.description || "",
      tags: meta.tags || [],
      linkedCaseNo: meta.linkedCaseNo || null,
      linkedClientName: meta.linkedClientName || null,
      linkedTaskId: meta.linkedTaskId || null,
      linkedAppointmentId: meta.linkedAppointmentId || null,
      linkedDraftSlug: meta.linkedDraftSlug || null,
    };
    setAttachments((prev) => [entry, ...prev]);
    return entry;
  }

  function updateAttachment(id, changes) {
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }

  function linkAttachment(id, field, value) {
    updateAttachment(id, { [field]: value });
  }

  function deleteAttachment(id) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <AttachmentsContext.Provider value={{ attachments, addAttachment, updateAttachment, linkAttachment, deleteAttachment }}>
      {children}
    </AttachmentsContext.Provider>
  );
}

export function useAttachments() {
  const ctx = useContext(AttachmentsContext);
  if (!ctx) throw new Error("useAttachments must be used within an AttachmentsProvider");
  return ctx;
}
