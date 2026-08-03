"use client";

import { useState } from "react";
import { useChat } from "./ChatContext";

export default function ShareAttachmentModal({ attachment, conversations, onClose }) {
  const { sendMessage } = useChat();
  const [query, setQuery] = useState("");
  const [sentTo, setSentTo] = useState([]);

  const term = query.trim().toLowerCase();
  const filtered = term ? conversations.filter((c) => c.title.toLowerCase().includes(term)) : conversations;

  function handleShare(target) {
    sendMessage(target.id, { attachmentIds: [attachment.id] });
    setSentTo((prev) => [...prev, target.id]);
  }

  return (
    <div className="case-modal-backdrop show" onClick={onClose}>
      <div className="case-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Share to another chat</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="client-card" style={{ marginBottom: 14 }}>
            <b>{attachment.name}</b>
            <span>{attachment.mimeCategory.toUpperCase()}</span>
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
                  onClick={() => handleShare(c)}
                  disabled={sentTo.includes(c.id)}
                >
                  {sentTo.includes(c.id) ? "Sent" : "Share"}
                </button>
              </div>
            ))}
            {filtered.length === 0 && <div className="empty-inline">No matching chats.</div>}
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
