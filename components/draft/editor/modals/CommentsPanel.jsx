"use client";

import { useState } from "react";
import { useDraftComments } from "../../DraftCommentsContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { canDeleteComment } from "../../permissions";

// Real comment threads anchored to the document's own `comment` mark
// (editor/extensions.js CommentMark) — clicking a thread here scrolls to
// and highlights its anchor in the live document.
export default function CommentsPanel({ draft, editor, onClose }) {
  const { commentsForDraft, replyToComment, resolveComment, reopenComment, deleteComment } = useDraftComments();
  const currentUser = useCurrentUser();
  const [replyDrafts, setReplyDrafts] = useState({});

  const threads = commentsForDraft(draft.id);

  function scrollToComment(commentId) {
    const el = editor?.view?.dom?.querySelector(`[data-comment-id="${commentId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("doc-comment-focused");
      setTimeout(() => el.classList.remove("doc-comment-focused"), 1200);
    }
  }

  function submitReply(threadId) {
    const body = (replyDrafts[threadId] || "").trim();
    if (!body) return;
    replyToComment(threadId, body);
    setReplyDrafts((prev) => ({ ...prev, [threadId]: "" }));
  }

  return (
    <aside className="card comments-panel">
      <div className="comments-panel-head">
        <h3>Comments ({threads.length})</h3>
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>
      </div>
      {threads.length === 0 && <div className="empty-inline">No comments yet. Select text and use Insert → Add Comment.</div>}
      {threads.map((thread) => (
        <div key={thread.id} className={`comment-thread${thread.status === "Resolved" ? " resolved" : ""}`}>
          <button type="button" className="comment-quote" onClick={() => scrollToComment(thread.id)}>
            &ldquo;{thread.quotedText.length > 90 ? `${thread.quotedText.slice(0, 90)}…` : thread.quotedText}&rdquo;
          </button>
          <div className="comment-replies">
            {thread.replies.map((reply) => (
              <div key={reply.id} className="comment-reply">
                <b>{reply.author}</b>
                <span className="comment-reply-time">{new Date(reply.createdAt).toLocaleString("en-IN")}</span>
                <p>{reply.body}</p>
              </div>
            ))}
          </div>
          <div className="comment-actions">
            <input
              className="comment-reply-input"
              placeholder="Reply…"
              value={replyDrafts[thread.id] || ""}
              onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && submitReply(thread.id)}
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={() => submitReply(thread.id)}>
              Reply
            </button>
            {thread.status === "Resolved" ? (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => reopenComment(thread.id)}>
                Reopen
              </button>
            ) : (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => resolveComment(thread.id)}>
                Resolve
              </button>
            )}
            {canDeleteComment(thread, currentUser) && (
              <button
                type="button"
                className="btn btn-outline btn-sm btn-danger"
                onClick={() => {
                  editor?.chain().focus().extendMarkRange("comment").unsetComment().run();
                  deleteComment(thread.id);
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </aside>
  );
}
