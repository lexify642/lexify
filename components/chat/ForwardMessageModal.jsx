"use client";

import { useState } from "react";

export default function ForwardMessageModal({ message, conversations, onForward, onClose }) {
  const [query, setQuery] = useState("");
  const [sentTo, setSentTo] = useState([]);

  const term = query.trim().toLowerCase();
  const filtered = term ? conversations.filter((c) => c.title.toLowerCase().includes(term)) : conversations;

  function handleForward(target) {
    onForward(target.id);
    setSentTo((prev) => [...prev, target.id]);
  }

  return (
    <div className="case-modal-backdrop show" onClick={onClose}>
      <div className="case-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Forward message</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="msg-reply-preview" style={{ marginBottom: 14 }}>
            <strong>{message.senderName}</strong>
            <span>{message.deleted ? "This message was deleted" : message.text || "Attachment"}</span>
          </div>
          <div className="search" style={{ width: "100%", marginBottom: 12 }}>
            <span>⌕</span>
            <input placeholder="Search chats…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="forward-target-list">
            {filtered.map((c) => (
              <div className="forward-target-row" key={c.id}>
                <span>{c.title}</span>
                <button
                  type="button"
                  className={`btn ${sentTo.includes(c.id) ? "btn-soft" : "btn-outline"}`}
                  onClick={() => handleForward(c)}
                  disabled={sentTo.includes(c.id)}
                >
                  {sentTo.includes(c.id) ? "Sent" : "Forward"}
                </button>
              </div>
            ))}
            {filtered.length === 0 && <div className="empty-inline">No matching chats.</div>}
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
