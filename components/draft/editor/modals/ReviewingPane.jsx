"use client";

import { useEditorState } from "@tiptap/react";
import { useDraftComments } from "../../DraftCommentsContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { canAcceptRejectChanges } from "../../permissions";
import { collectChanges } from "../trackChanges";

function when(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Review → Reviewing Pane: every tracked change and open comment in the
// document, in order, with Accept/Reject per change.
export default function ReviewingPane({ draft, editor, onClose }) {
  const { commentsForDraft } = useDraftComments();
  const currentUser = useCurrentUser();
  const canDecide = canAcceptRejectChanges(currentUser);
  const changes = useEditorState({ editor, selector: ({ editor: ed }) => (ed ? collectChanges(ed.state.doc) : []) }) || [];
  const openComments = commentsForDraft(draft.id).filter((t) => t.status === "Open");

  function select(change) {
    editor.chain().focus().setTextSelection({ from: change.from, to: change.to }).scrollIntoView().run();
  }

  return (
    <aside className="card comments-panel reviewing-pane" aria-label="Reviewing pane">
      <div className="comments-panel-head">
        <h3>Revisions ({changes.length})</h3>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close reviewing pane">
          ×
        </button>
      </div>
      {canDecide && changes.length > 0 && (
        <div className="reviewing-actions">
          <button type="button" className="btn btn-outline" onClick={() => editor.chain().focus().acceptChanges().run()}>
            Accept all
          </button>
          <button type="button" className="btn btn-outline" onClick={() => editor.chain().focus().rejectChanges().run()}>
            Reject all
          </button>
        </div>
      )}
      {changes.length === 0 && <p className="empty-inline">No tracked changes. Turn on Review → Track Changes to record edits as suggestions.</p>}
      <ul className="reviewing-list">
        {changes.map((c) => (
          <li key={`${c.type}-${c.from}`} className={`reviewing-item ${c.type}`}>
            <button type="button" className="reviewing-item-main" onClick={() => select(c)}>
              <strong>
                {c.author || "Someone"} {c.type === "insertion" ? "inserted" : "deleted"}
              </strong>
              <span className="reviewing-text">“{c.text.length > 120 ? `${c.text.slice(0, 120)}…` : c.text}”</span>
              <small>{when(c.date)}</small>
            </button>
            {canDecide && (
              <span className="reviewing-item-actions">
                <button type="button" className="link" onClick={() => editor.chain().focus().acceptChanges({ from: c.from, to: c.to }).run()}>
                  Accept
                </button>
                <button type="button" className="link danger-link" onClick={() => editor.chain().focus().rejectChanges({ from: c.from, to: c.to }).run()}>
                  Reject
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {openComments.length > 0 && (
        <>
          <h4 className="reviewing-subhead">Open comments ({openComments.length})</h4>
          <ul className="reviewing-list">
            {openComments.map((t) => (
              <li key={t.id} className="reviewing-item comment">
                <button
                  type="button"
                  className="reviewing-item-main"
                  onClick={() => editor.view.dom.querySelector(`[data-comment-id="${t.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                >
                  <strong>{t.author || "Comment"}</strong>
                  <span className="reviewing-text">{t.replies?.[0]?.body || t.quotedText}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
