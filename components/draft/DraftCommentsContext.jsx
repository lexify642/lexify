"use client";

import { createContext, useContext, useState } from "react";
import { CURRENT_USER } from "@/data/team";

const DraftCommentsContext = createContext(null);

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Comment threads keyed by the id embedded in the document's own `comment`
// mark (see editor/extensions.js CommentMark) — the anchor travels with the
// text through edits, this table just holds the conversation around it.
// Same in-memory Context pattern as every other module in the app.
export function DraftCommentsProvider({ children }) {
  const [threads, setThreads] = useState({});

  function addComment(draftId, quotedText, body) {
    const commentId = newId("comment");
    const thread = {
      id: commentId,
      draftId,
      quotedText,
      status: "Open",
      author: CURRENT_USER.name,
      createdAt: nowIso(),
      replies: [{ id: newId("reply"), author: CURRENT_USER.name, body, createdAt: nowIso() }],
    };
    setThreads((prev) => ({ ...prev, [commentId]: thread }));
    return commentId;
  }

  function replyToComment(commentId, body) {
    setThreads((prev) => {
      const thread = prev[commentId];
      if (!thread) return prev;
      const reply = { id: newId("reply"), author: CURRENT_USER.name, body, createdAt: nowIso() };
      return { ...prev, [commentId]: { ...thread, replies: [...thread.replies, reply] } };
    });
  }

  function resolveComment(commentId) {
    setThreads((prev) => (prev[commentId] ? { ...prev, [commentId]: { ...prev[commentId], status: "Resolved" } } : prev));
  }

  function reopenComment(commentId) {
    setThreads((prev) => (prev[commentId] ? { ...prev, [commentId]: { ...prev[commentId], status: "Open" } } : prev));
  }

  function deleteComment(commentId) {
    setThreads((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
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
