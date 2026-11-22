"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { categoryForFile } from "@/data/attachments";

const AttachmentsContext = createContext(null);

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

function tempId() {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// The Document Library's single source of truth (see app/api/attachments/*
// + supabase/migrations/0003_chat_documents.sql). Files now actually land
// in Supabase Storage (private `firm-files` bucket, signed URLs) instead of
// a browser-session-only blob: URL — `objectUrl` stays the field name every
// consumer already reads, just populated with a real URL now.
//
// addAttachment() is async (unlike every other mutation in this app's
// Context layer) because its one caller, ConversationView.jsx's addFiles(),
// needs the *real* attachment id before it can be referenced in a message's
// attachmentIds — a temp-id-then-swap here would risk a message being sent
// with an id that never resolves to a real row.
export function AttachmentsProvider({ children }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useCurrentUser();

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/attachments")
      .then((data) => {
        if (!cancelled) setAttachments(data);
      })
      .catch((err) => console.error("[AttachmentsContext] initial load failed", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addAttachment(file, meta = {}) {
    const optimisticId = tempId();
    const optimisticEntry = {
      id: optimisticId,
      name: file.name || "Untitled",
      mimeCategory: categoryForFile(file),
      size: file.size || 0,
      objectUrl: typeof URL !== "undefined" && file instanceof Blob ? URL.createObjectURL(file) : null,
      uploadedBy: currentUser.name,
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
      uploading: true,
    };
    setAttachments((prev) => [optimisticEntry, ...prev]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (meta.sourceConversationId) formData.append("sourceConversationId", meta.sourceConversationId);
      if (meta.sourceMessageId) formData.append("sourceMessageId", meta.sourceMessageId);
      if (meta.category) formData.append("category", meta.category);
      if (meta.description) formData.append("description", meta.description);
      if (meta.tags?.length) formData.append("tags", meta.tags.join(","));
      if (meta.linkedCaseNo) formData.append("linkedCaseNo", meta.linkedCaseNo);
      if (meta.linkedClientName) formData.append("linkedClientName", meta.linkedClientName);
      if (meta.linkedTaskId) formData.append("linkedTaskId", meta.linkedTaskId);
      if (meta.linkedAppointmentId) formData.append("linkedAppointmentId", meta.linkedAppointmentId);
      if (meta.linkedDraftSlug) formData.append("linkedDraftSlug", meta.linkedDraftSlug);

      const created = await fetchJson("/api/attachments", { method: "POST", body: formData });
      setAttachments((prev) => prev.map((a) => (a.id === optimisticId ? created : a)));
      return created;
    } catch (err) {
      setAttachments((prev) => prev.filter((a) => a.id !== optimisticId));
      throw err;
    }
  }

  function updateAttachment(id, changes) {
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
    fetchJson(`/api/attachments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) }).catch(
      (err) => console.error("[AttachmentsContext] update failed", err)
    );
  }

  function linkAttachment(id, field, value) {
    updateAttachment(id, { [field]: value });
  }

  function deleteAttachment(id) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    fetchJson(`/api/attachments/${id}`, { method: "DELETE" }).catch((err) => console.error("[AttachmentsContext] delete failed", err));
  }

  return (
    <AttachmentsContext.Provider value={{ attachments, addAttachment, updateAttachment, linkAttachment, deleteAttachment, loading }}>
      {children}
    </AttachmentsContext.Provider>
  );
}

export function useAttachments() {
  const ctx = useContext(AttachmentsContext);
  if (!ctx) throw new Error("useAttachments must be used within an AttachmentsProvider");
  return ctx;
}
