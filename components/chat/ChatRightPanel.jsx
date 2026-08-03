"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTasks } from "@/components/tasks/TasksContext";
import { useChat } from "./ChatContext";
import { useAttachments } from "./AttachmentsContext";
import { formatFileSize } from "@/data/attachments";
import AttachFileMenu from "./AttachFileMenu";

const UNAVAILABLE_ACTIONS = [
  { label: "Notes", reason: "No standalone Notes module exists in this workspace yet." },
  { label: "Invoices", reason: "No billing module exists in this workspace yet." },
  { label: "Payments", reason: "No billing module exists in this workspace yet." },
];

const URL_PATTERN = /https?:\/\/\S+/g;

function QuickActions({ clientName }) {
  const encoded = encodeURIComponent(clientName);
  return (
    <div className="chat-quick-actions">
      <Link href={`/clients?name=${encoded}`} className="btn btn-outline">Open Client</Link>
      <Link href="/cases" className="btn btn-outline">Open Cases</Link>
      <Link href={`/documents?client=${encoded}`} className="btn btn-outline">Open Documents</Link>
      <Link href="/calendar" className="btn btn-outline">Open Calendar</Link>
      <Link href="/tasks" className="btn btn-outline">Open Tasks</Link>
      {UNAVAILABLE_ACTIONS.map((a) => (
        <button type="button" key={a.label} className="btn btn-outline" disabled title={a.reason}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

function SharedDocRow({ attachment, conversations }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="chat-linked-row shared-doc-row">
      <a href={attachment.objectUrl || "#"} download={attachment.name} className="shared-doc-link">
        <strong>{attachment.name}</strong>
        <span>
          {attachment.mimeCategory.toUpperCase()} · {formatFileSize(attachment.size)}
        </span>
      </a>
      <button type="button" className="msg-attachment-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
        ⋮
      </button>
      {menuOpen && <AttachFileMenu attachment={attachment} conversations={conversations} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

function SharedMediaThumb({ attachment, conversations }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="chat-shared-media-thumb-wrap">
      <a href={attachment.objectUrl || "#"} target="_blank" rel="noopener noreferrer" className="chat-shared-media-thumb">
        {attachment.mimeCategory === "image" ? <img src={attachment.objectUrl} alt={attachment.name} /> : <span>🎞</span>}
      </a>
      <button type="button" className="msg-attachment-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
        ⋮
      </button>
      {menuOpen && <AttachFileMenu attachment={attachment} conversations={conversations} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

export default function ChatRightPanel({ conversation, conversations, onClose }) {
  const { tasks } = useTasks();
  const { messages } = useChat();
  const { attachments } = useAttachments();

  const shared = useMemo(() => attachments.filter((a) => a.sourceConversationId === conversation.id), [attachments, conversation.id]);
  const sharedMedia = shared.filter((a) => a.mimeCategory === "image" || a.mimeCategory === "video");
  const sharedDocs = shared.filter((a) => !["image", "video"].includes(a.mimeCategory));
  const linkedTasks = conversation.kind === "case" ? tasks.filter((t) => t.caseNo === conversation.caseNo) : [];

  const sharedLinks = useMemo(() => {
    const urls = [];
    messages
      .filter((m) => m.conversationId === conversation.id && m.text)
      .forEach((m) => {
        const found = m.text.match(URL_PATTERN);
        if (found) urls.push(...found);
      });
    return Array.from(new Set(urls));
  }, [messages, conversation.id]);

  return (
    <div className="chat-right-panel">
      <div className="chat-right-head">
        <h3>Chat info</h3>
        <button type="button" className="modal-close" onClick={onClose}>×</button>
      </div>

      <div className="chat-right-scroll">
        {conversation.kind === "client" && (
          <div className="chat-right-section">
            <h4>Client details</h4>
            <div className="client-card">
              <b>{conversation.clientName}</b>
              <span>{conversation.phone || "No phone on file"}</span>
              <span>{conversation.address || "No address on file"}</span>
            </div>
            <QuickActions clientName={conversation.clientName} />
          </div>
        )}

        {conversation.kind === "client" && conversation.matters?.length > 0 && (
          <div className="chat-right-section">
            <h4>Linked cases</h4>
            {conversation.matters.map((m) => (
              <Link href={`/cases/${m.caseNo}`} key={m.caseNo} className="chat-linked-row">
                <strong>{m.number}</strong>
                <span>{m.parties}</span>
              </Link>
            ))}
          </div>
        )}

        {conversation.kind === "case" && (
          <div className="chat-right-section">
            <h4>Linked case</h4>
            <Link href={`/cases/${conversation.caseNo}`} className="chat-linked-row">
              <strong>{conversation.caseNumber}</strong>
              <span>{conversation.title} · {conversation.court}</span>
            </Link>
          </div>
        )}

        {conversation.kind === "case" && (
          <div className="chat-right-section">
            <h4>Linked tasks ({linkedTasks.length})</h4>
            {linkedTasks.length === 0 && <div className="empty-inline">No tasks linked to this case yet.</div>}
            {linkedTasks.map((t) => (
              <Link href={`/tasks/${t.id}`} key={t.id} className="chat-linked-row">
                <strong>{t.title}</strong>
                <span>{t.assignedToName} · due {t.dueDate}</span>
              </Link>
            ))}
          </div>
        )}

        {(conversation.kind === "group" || conversation.kind === "case") && (
          <div className="chat-right-section">
            <h4>Assigned members</h4>
            <div className="chat-member-chips">
              {(conversation.memberNames || []).map((n) => (
                <span key={n} className="badge grey">{n}</span>
              ))}
            </div>
          </div>
        )}

        <div className="chat-right-section">
          <h4>Shared media ({sharedMedia.length})</h4>
          {sharedMedia.length === 0 && <div className="empty-inline">No photos or videos shared yet.</div>}
          <div className="chat-shared-media-grid">
            {sharedMedia.map((a) => (
              <SharedMediaThumb attachment={a} conversations={conversations} key={a.id} />
            ))}
          </div>
        </div>

        <div className="chat-right-section">
          <h4>Shared documents ({sharedDocs.length})</h4>
          {sharedDocs.length === 0 && <div className="empty-inline">No documents shared yet.</div>}
          {sharedDocs.map((a) => (
            <SharedDocRow attachment={a} conversations={conversations} key={a.id} />
          ))}
        </div>

        <div className="chat-right-section">
          <h4>Shared links ({sharedLinks.length})</h4>
          {sharedLinks.length === 0 && <div className="empty-inline">No links shared yet.</div>}
          {sharedLinks.map((url) => (
            <a href={url} target="_blank" rel="noopener noreferrer" key={url} className="chat-linked-row">
              <span>{url}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
