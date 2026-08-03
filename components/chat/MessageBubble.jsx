"use client";

import { useState } from "react";
import { CURRENT_USER } from "@/data/team";
import { useAttachments } from "./AttachmentsContext";
import { canDeleteMessage } from "./permissions";
import { formatFileSize } from "@/data/attachments";
import AttachFileMenu from "./AttachFileMenu";
import AttachmentPreviewModal from "./AttachmentPreviewModal";

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function statusTicks(status) {
  if (status === "seen") return "✓✓";
  if (status === "delivered") return "✓✓";
  return "✓";
}

function renderText(text) {
  const parts = text.split(/(@[A-Za-z.]+(?:\s[A-Za-z.]+)?|https?:\/\/\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) return <span className="mention" key={i}>{part}</span>;
    if (part.startsWith("http")) {
      return (
        <a href={part} key={i} target="_blank" rel="noopener noreferrer" className="chat-link">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const PREVIEWABLE = ["image", "video", "audio", "pdf"];

function AttachmentChip({ attachment, conversations }) {
  const [previewing, setPreviewing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!attachment) return null;
  const canPreview = PREVIEWABLE.includes(attachment.mimeCategory);

  function handleOpen(e) {
    e.preventDefault();
    if (canPreview) setPreviewing(true);
  }

  return (
    <div className="msg-attachment-wrap">
      {attachment.mimeCategory === "image" && attachment.objectUrl ? (
        <a href={attachment.objectUrl} onClick={handleOpen} className="msg-attachment-image">
          <img src={attachment.objectUrl} alt={attachment.name} />
        </a>
      ) : (
        <a href={attachment.objectUrl || "#"} download={!canPreview ? attachment.name : undefined} onClick={handleOpen} className="msg-attachment-file">
          <span className="msg-attachment-icon">📎</span>
          <span className="msg-attachment-meta">
            <strong>{attachment.name}</strong>
            <small>
              {attachment.mimeCategory.toUpperCase()} · {formatFileSize(attachment.size)}
            </small>
          </span>
        </a>
      )}
      <button type="button" className="msg-attachment-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
        ⋮
      </button>
      {menuOpen && <AttachFileMenu attachment={attachment} conversations={conversations} onClose={() => setMenuOpen(false)} />}
      {previewing && <AttachmentPreviewModal attachment={attachment} onClose={() => setPreviewing(false)} />}
    </div>
  );
}

export default function MessageBubble({
  message,
  showSenderName,
  internalNote,
  replyToMessage,
  conversations,
  onReply,
  onForward,
  onTogglePin,
  onToggleStar,
  onEdit,
  onDelete,
  onContextMenu,
}) {
  const { attachments } = useAttachments();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);

  const isOwn = message.senderName === CURRENT_USER.name;
  const isPinned = message.pinnedBy.includes(CURRENT_USER.name);
  const isStarred = message.starredBy.includes(CURRENT_USER.name);
  const canDelete = canDeleteMessage(message);
  const msgAttachments = message.attachmentIds.map((id) => attachments.find((a) => a.id === id)).filter(Boolean);

  function submitEdit() {
    if (draft.trim()) onEdit(message.id, draft.trim());
    setEditing(false);
  }

  return (
    <div
      className={`chat-message${isOwn ? " own" : ""}${isPinned ? " pinned" : ""}`}
      onContextMenu={(e) => {
        if (!message.deleted && onContextMenu) {
          e.preventDefault();
          onContextMenu(e, message);
        }
      }}
    >
      <div className="chat-bubble">
        {showSenderName && !isOwn && <div className="msg-sender">{message.senderName}</div>}
        {message.forwardedFromId && <div className="msg-flag">↪ Forwarded</div>}
        {isPinned && <div className="msg-flag">📌 Pinned</div>}
        {replyToMessage && (
          <div className="msg-reply-preview">
            <strong>{replyToMessage.senderName}</strong>
            <span>{replyToMessage.deleted ? "This message was deleted" : replyToMessage.text || "Attachment"}</span>
          </div>
        )}

        {message.deleted ? (
          <div className="msg-text deleted">This message was deleted</div>
        ) : editing ? (
          <div className="msg-edit-row">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
            <button type="button" className="btn btn-soft" onClick={submitEdit}>
              Save
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            {message.text && <div className="msg-text">{renderText(message.text)}</div>}
            {msgAttachments.length > 0 && (
              <div className="msg-attachments">
                {msgAttachments.map((a) => (
                  <AttachmentChip attachment={a} conversations={conversations} key={a.id} />
                ))}
              </div>
            )}
          </>
        )}

        <div className="msg-meta">
          {internalNote && <span className="msg-internal-note">{internalNote}</span>}
          {message.edited && <span>edited</span>}
          <span>{timeLabel(message.createdAt)}</span>
          {isOwn && <span className="msg-status">{statusTicks(message.status)}</span>}
        </div>

        {!message.deleted && (
          <div className="msg-actions">
            <button type="button" title="Reply" onClick={() => onReply(message)}>
              ↩
            </button>
            <button type="button" title="Forward" onClick={() => onForward(message)}>
              ↪
            </button>
            <button type="button" title="Star" className={isStarred ? "active" : ""} onClick={() => onToggleStar(message.id)}>
              ★
            </button>
            <button type="button" title="Pin" className={isPinned ? "active" : ""} onClick={() => onTogglePin(message.id)}>
              📌
            </button>
            {isOwn && (
              <button type="button" title="Edit" onClick={() => setEditing(true)}>
                ✎
              </button>
            )}
            {canDelete && (
              <button type="button" title="Delete" className="danger-action" onClick={() => onDelete(message.id)}>
                🗑
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
