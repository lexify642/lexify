"use client";

import { useChat } from "./ChatContext";
import { useAttachments } from "./AttachmentsContext";
import { messagesFor } from "./conversationUtils";
import { formatFileSize } from "@/data/attachments";

// Read-only "what the client actually sees" view — every staff message
// renders as coming from "LEXIFY" only, never the individual advocate/staff
// name, satisfying the identity-masking requirement even though this app
// has no separate client-facing login to enforce it server-side.
export default function ClientChatPreviewModal({ conversation, onClose }) {
  const { messages } = useChat();
  const { attachments } = useAttachments();
  const list = messagesFor(conversation.id, messages);

  return (
    <div className="case-modal-backdrop show" onClick={onClose}>
      <div className="case-modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Preview as client — {conversation.clientName}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="empty-inline" style={{ marginBottom: 14 }}>
            This is exactly what {conversation.clientName} sees — every reply appears from &quot;LEXIFY&quot;, never the
            individual advocate or staff member who wrote it.
          </div>
          <div className="chat-message-list client-preview-list">
            {list.length === 0 && <div className="empty-inline">No messages yet.</div>}
            {list.map((m) => {
              const msgAttachments = m.attachmentIds.map((id) => attachments.find((a) => a.id === id)).filter(Boolean);
              return (
                <div className="chat-message own" key={m.id}>
                  <div className="chat-bubble">
                    <div className="msg-sender">LEXIFY</div>
                    {m.deleted ? (
                      <div className="msg-text deleted">This message was deleted</div>
                    ) : (
                      <>
                        {m.text && <div className="msg-text">{m.text}</div>}
                        {msgAttachments.length > 0 && (
                          <div className="msg-attachments">
                            {msgAttachments.map((a) => (
                              <div className="msg-attachment-file" key={a.id}>
                                <span className="msg-attachment-icon">📎</span>
                                <span className="msg-attachment-meta">
                                  <strong>{a.name}</strong>
                                  <small>{formatFileSize(a.size)}</small>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <div className="msg-meta">
                      <span>{new Date(m.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
