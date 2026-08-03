"use client";

import { useRef, useState } from "react";
import { CURRENT_USER, TEAM_MEMBERS } from "@/data/team";
import { useChat } from "./ChatContext";
import { useAttachments } from "./AttachmentsContext";
import { formatFileSize } from "@/data/attachments";
import EmojiPicker from "./EmojiPicker";
import MediaCaptureModal from "./MediaCaptureModal";

export default function MessageComposer({ conversationId, replyTo, onCancelReply, pendingIds, addFiles, removePending, clearPending }) {
  const { sendMessage } = useChat();
  const { attachments } = useAttachments();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [captureMode, setCaptureMode] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const pendingAttachments = pendingIds.map((id) => attachments.find((a) => a.id === id)).filter(Boolean);

  function handleCapture(blob, filename) {
    const file = new File([blob], filename, { type: blob.type });
    addFiles([file]);
    setCaptureMode(null);
    setShowAttachMenu(false);
  }

  function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items.filter((it) => it.kind === "file").map((it) => it.getAsFile()).filter(Boolean);
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  }

  function handleTextChange(e) {
    const value = e.target.value;
    setText(value);
    const match = value.match(/@([A-Za-z.]*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function insertMention(name) {
    setText((prev) => prev.replace(/@([A-Za-z.]*)$/, `@${name} `));
    setMentionQuery(null);
  }

  function handleSend() {
    if (!text.trim() && pendingIds.length === 0) return;
    const mentions = TEAM_MEMBERS.filter((m) => text.includes(`@${m.name}`)).map((m) => m.name);
    sendMessage(conversationId, {
      text: text.trim(),
      attachmentIds: pendingIds,
      replyToId: replyTo ? replyTo.id : null,
      mentions,
    });
    setText("");
    clearPending();
    onCancelReply();
  }

  function shareContact() {
    sendMessage(conversationId, { text: `📇 Contact: ${CURRENT_USER.name} — ${CURRENT_USER.role}` });
    setShowAttachMenu(false);
  }

  function shareLocation() {
    sendMessage(conversationId, { text: "📍 Location shared (no maps integration in this workspace)." });
    setShowAttachMenu(false);
  }

  const mentionMatches =
    mentionQuery !== null ? TEAM_MEMBERS.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())) : [];

  return (
    <div className="chat-composer">
      {replyTo && (
        <div className="composer-reply-banner">
          <div>
            <strong>Replying to {replyTo.senderName}</strong>
            <span>{replyTo.deleted ? "This message was deleted" : replyTo.text || "Attachment"}</span>
          </div>
          <button type="button" onClick={onCancelReply}>×</button>
        </div>
      )}

      {pendingAttachments.length > 0 && (
        <div className="composer-pending-row">
          {pendingAttachments.map((a) => (
            <div className="composer-pending-chip" key={a.id}>
              {a.mimeCategory === "image" && a.objectUrl ? (
                <img src={a.objectUrl} alt={a.name} />
              ) : (
                <span className="msg-attachment-icon">📎</span>
              )}
              <span>{a.name}</span>
              <small>{formatFileSize(a.size)}</small>
              <button type="button" onClick={() => removePending(a.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="composer-row">
        <div className="composer-attach-wrap">
          <button type="button" className="icon-btn" title="Attach" onClick={() => setShowAttachMenu((s) => !s)}>
            📎
          </button>
          {showAttachMenu && (
            <div className="composer-attach-menu">
              <button type="button" onClick={() => fileInputRef.current?.click()}>🖼 Photo / Video</button>
              <button type="button" onClick={() => docInputRef.current?.click()}>📄 Document</button>
              <button type="button" onClick={() => setCaptureMode("photo")}>📷 Camera</button>
              <button type="button" onClick={() => setCaptureMode("video")}>🎥 Record Video</button>
              <button type="button" onClick={() => setCaptureMode("audio")}>🎙 Voice Note</button>
              <button type="button" onClick={shareContact}>👤 Contact</button>
              <button type="button" onClick={shareLocation}>📍 Location</button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files.length) addFiles(e.target.files);
              e.target.value = "";
              setShowAttachMenu(false);
            }}
          />
          <input
            ref={docInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files.length) addFiles(e.target.files);
              e.target.value = "";
              setShowAttachMenu(false);
            }}
          />
        </div>

        <div className="composer-input-wrap">
          <input
            type="text"
            placeholder="Type a message…"
            value={text}
            onChange={handleTextChange}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          {mentionMatches.length > 0 && (
            <div className="mention-dropdown">
              {mentionMatches.map((m) => (
                <button type="button" key={m.id} onClick={() => insertMention(m.name)}>
                  {m.name} <small>{m.role}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="composer-emoji-wrap">
          <button type="button" className="icon-btn" title="Emoji" onClick={() => setShowEmoji((s) => !s)}>
            😊
          </button>
          {showEmoji && (
            <EmojiPicker
              onPick={(emoji) => setText((t) => t + emoji)}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        <button type="button" className="btn composer-send-btn" onClick={handleSend}>
          Send
        </button>
      </div>

      {captureMode && <MediaCaptureModal mode={captureMode} onCapture={handleCapture} onClose={() => setCaptureMode(null)} />}
    </div>
  );
}
