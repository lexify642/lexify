"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/auth/AuthProvider";

const DraftCommentsContext = createContext(null);

function nowIso() {
  return new Date().toISOString();
}

function newUuid() {
  return crypto.randomUUID();
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

// Comment threads keyed by the id embedded in the document's own `comment`
// mark (see editor/extensions.js CommentMark) — backed by Supabase
// (app/api/draft-comments/*) instead of in-memory state. addComment() still
// returns the new thread's id synchronously (crypto.randomUUID(), sent to
// the server as part of the create payload) since InsertTab.jsx sets it as
// the mark's attribute the instant the comment is created, before any
// network round trip could complete.
export function DraftCommentsProvider({ children }) {
  const currentUser = useCurrentUser();
  const [threads, setThreads] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/draft-comments")
      .then((data) => {
        if (!cancelled) setThreads(data);
      })
      .catch((err) => console.error("[DraftCommentsContext] initial load failed", err));
    return () => {
      cancelled = true;
    };
  }, []);

  function addComment(draftId, quotedText, body) {
    const commentId = newUuid();
    const thread = {
      id: commentId,
      draftId,
      quotedText,
      status: "Open",
      author: currentUser.name,
      createdAt: nowIso(),
      replies: [{ id: newUuid(), author: currentUser.name, body, createdAt: nowIso() }],
    };
    setThreads((prev) => ({ ...prev, [commentId]: thread }));

    fetchJson(`/api/drafts/${draftId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: commentId, quotedText, body }),
    }).catch((err) => console.error("[DraftCommentsContext] addComment persist failed", err));

    return commentId;
  }

  function replyToComment(commentId, body) {
    setThreads((prev) => {
      const thread = prev[commentId];
      if (!thread) return prev;
      const reply = { id: newUuid(), author: currentUser.name, body, createdAt: nowIso() };
      return { ...prev, [commentId]: { ...thread, replies: [...thread.replies, reply] } };
    });

    fetchJson(`/api/draft-comments/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }).catch((err) => console.error("[DraftCommentsContext] replyToComment persist failed", err));
  }

  function setStatus(commentId, status) {
    setThreads((prev) => (prev[commentId] ? { ...prev, [commentId]: { ...prev[commentId], status } } : prev));
    fetchJson(`/api/draft-comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.error("[DraftCommentsContext] status update failed", err));
  }

  function resolveComment(commentId) {
    setStatus(commentId, "Resolved");
  }

  function reopenComment(commentId) {
    setStatus(commentId, "Open");
  }

  function deleteComment(commentId) {
    setThreads((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
    fetchJson(`/api/draft-comments/${commentId}`, { method: "DELETE" }).catch((err) =>
      console.error("[DraftCommentsContext] deleteComment persist failed", err)
    );
  }

  function commentsForDraft(draftId) {
    return Object.values(threads)
      .filter((t) => t.draftId === draftId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return (
    <DraftCommentsContext.Provider
      value={{ threads, addComment, replyToComment, resolveComment, reopenComment, deleteComment, commentsForDraft }}
    >
      {children}
    </DraftCommentsContext.Provider>
  );
}

export function useDraftComments() {
  const ctx = useContext(DraftCommentsContext);
  if (!ctx) throw new Error("useDraftComments must be used within a DraftCommentsProvider");
  return ctx;
}
