"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "./ChatContext";
import { useAttachments } from "./AttachmentsContext";
import { lastMessageFor, messagesFor } from "./conversationUtils";
import { canReassignClientChat } from "./permissions";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import ForwardMessageModal from "./ForwardMessageModal";
import ReassignClientChatModal from "./ReassignClientChatModal";
import ClientChatPreviewModal from "./ClientChatPreviewModal";
import MessageContextMenu from "./MessageContextMenu";

function dateLabel(iso) {
  const d = new Date(iso);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return "Today";
  if (d.toDateString() === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function headerSubtitle(conversation, online, typingBy, lastReplyName) {
  const typing = typingBy[conversation.id];
  if (typing) return `${typing} is typing…`;
  if (conversation.kind === "direct") return online[conversation.otherName] ? "Online" : "Offline";
  if (conversation.kind === "group") return `${conversation.memberNames.length} members`;
  if (conversation.kind === "case") return `Case discussion room · ${conversation.caseNumber}`;
  if (conversation.kind === "client") {
    const handled = conversation.assignment
      ? `Handled By: ${conversation.assignment.assignedToName} (${conversation.assignment.assignedToRole})`
      : "Unassigned — no team member handling this chat yet";
    return lastReplyName ? `${handled} · Last Replied By: ${lastReplyName}` : handled;
  }
  return "";
}

export default function ConversationView({ conversation, allConversations, onBack, rightPanelOpen, onToggleRightPanel }) {
  const { messages, typingBy, online, markRead, togglePin, toggleStar, editMessage, deleteMessage, forwardMessage } = useChat();
  const { addAttachment, deleteAttachment } = useAttachments();
  const [replyTo, setReplyTo] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null);
  const [pendingIds, setPendingIds] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [previewingAsClient, setPreviewingAsClient] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const list = useMemo(() => messagesFor(conversation.id, messages), [conversation.id, messages]);
  const lastReply = conversation.kind === "client" ? lastMessageFor(conversation.id, messages) : null;

  useEffect(() => {
    markRead(conversation.id);
    setReplyTo(null);
    setPendingIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  function addFiles(fileList) {
    const ids = Array.from(fileList).map((file) => addAttachment(file, { sourceConversationId: conversation.id }).id);
    setPendingIds((prev) => [...prev, ...ids]);
  }

  function removePending(id) {
    deleteAttachment(id);
    setPendingIds((prev) => prev.filter((p) => p !== id));
  }

  function clearPending() {
    setPendingIds([]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  const isClientView = conversation.kind === "client";
  const showSenderName = conversation.kind === "group" || conversation.kind === "case";
  const shareTargets = allConversations.filter((c) => c.id !== conversation.id);

  let lastRenderedDate = null;

  return (
    <div
      className={`chat-conversation${isDragging ? " dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="chat-conversation-header">
        <button type="button" className="chat-back-btn" onClick={onBack} aria-label="Back to chat list">
          ←
        </button>
        <div className="avatar chat-avatar">{conversation.title.slice(0, 2).toUpperCase()}</div>
        <div className="chat-conversation-title">
          <strong>{conversation.title}</strong>
          <span>{headerSubtitle(conversation, online, typingBy, lastReply?.senderName)}</span>
        </div>
        {conversation.kind === "client" && (
          <div className="chat-header-actions">
            {canReassignClientChat() && (
              <button type="button" className="btn btn-outline" onClick={() => setReassigning(true)}>
                Reassign
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={() => setPreviewingAsClient(true)}>
              Preview as Client
            </button>
          </div>
        )}
        <button type="button" className="icon-btn" onClick={onToggleRightPanel} title="Chat info">
          {rightPanelOpen ? "▶" : "ⓘ"}
        </button>
      </div>

      {isDragging && <div className="chat-drop-overlay">Drop files to attach to this chat</div>}

      <div className="chat-message-list">
        {list.length === 0 && <div className="empty-inline">No messages yet. Say hello 👋</div>}
        {list.map((m) => {
          const showDate = dateLabel(m.createdAt) !== lastRenderedDate;
          lastRenderedDate = dateLabel(m.createdAt);
          const replyToMessage = m.replyToId ? messages.find((mm) => mm.id === m.replyToId) : null;
          return (
            <div key={m.id}>
              {showDate && <div className="chat-date-separator"><span>{dateLabel(m.createdAt)}</span></div>}
              <MessageBubble
                message={m}
                showSenderName={showSenderName}
                internalNote={isClientView && !m.deleted ? `Sent By: ${m.senderName}` : null}
                replyToMessage={replyToMessage}
                conversations={shareTargets}
                onReply={setReplyTo}
                onForward={setForwardTarget}
                onTogglePin={togglePin}
                onToggleStar={toggleStar}
                onEdit={editMessage}
                onDelete={deleteMessage}
                onContextMenu={(e, msg) => setContextMenu({ message: msg, position: { x: e.clientX, y: e.clientY } })}
              />
            </div>
          );
        })}
      </div>

      <MessageComposer
        conversationId={conversation.id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        pendingIds={pendingIds}
        addFiles={addFiles}
        removePending={removePending}
        clearPending={clearPending}
      />

      {forwardTarget && (
        <ForwardMessageModal
          message={forwardTarget}
          conversations={shareTargets}
          onForward={(targetId) => forwardMessage(forwardTarget.id, targetId)}
          onClose={() => setForwardTarget(null)}
        />
      )}

      {reassigning && <ReassignClientChatModal conversation={conversation} onClose={() => setReassigning(false)} />}
      {previewingAsClient && (
        <ClientChatPreviewModal conversation={conversation} onClose={() => setPreviewingAsClient(false)} />
      )}
      {contextMenu && (
        <MessageContextMenu
          message={contextMenu.message}
          conversation={conversation}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
