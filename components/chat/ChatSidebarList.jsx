"use client";

import { useMemo, useState } from "react";
import { lastMessageFor, matchesSearch, messagePreview, sortConversations, unreadCountFor } from "./conversationUtils";

const TABS = [
  { key: "all", label: "All" },
  { key: "group", label: "Internal" },
  { key: "client", label: "Clients" },
  { key: "case", label: "Case Rooms" },
];

function initials(title) {
  const words = title.replace(/\./g, "").split(" ").filter(Boolean);
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function timeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date().toDateString();
  if (d.toDateString() === today) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatSidebarList({ conversations, messages, readState, online, activeId, onSelect, onNewChat }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    let list = conversations;
    if (tab === "group") list = list.filter((c) => c.kind === "group" || c.kind === "direct");
    else if (tab !== "all") list = list.filter((c) => c.kind === tab);
    list = list.filter((c) => matchesSearch(c, messages, search));
    return sortConversations(list, messages);
  }, [conversations, messages, tab, search]);

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-head">
        <h2>Chats</h2>
        <button type="button" className="btn btn-soft" onClick={onNewChat}>
          + New
        </button>
      </div>
      <div className="search chat-search">
        <span>⌕</span>
        <input placeholder="Search chats and messages…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="chat-tabs">
        {TABS.map((t) => (
          <button type="button" key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="chat-list">
        {filtered.length === 0 && <div className="empty-inline">No chats found.</div>}
        {filtered.map((c) => {
          const last = lastMessageFor(c.id, messages);
          const unread = unreadCountFor(c.id, messages, readState);
          const isOnline = c.kind === "direct" && online[c.otherName];
          return (
            <button
              type="button"
              key={c.id}
              className={`chat-row${activeId === c.id ? " active" : ""}`}
              onClick={() => onSelect(c.id)}
            >
              <div className="chat-row-avatar">
                <div className="avatar chat-avatar">{initials(c.title)}</div>
                {isOnline && <span className="presence-dot online" />}
                {c.kind === "client" && <span className="chat-kind-flag" title="Client chat">C</span>}
                {c.kind === "case" && <span className="chat-kind-flag" title="Case discussion room">⚖</span>}
              </div>
              <div className="chat-row-main">
                <div className="chat-row-top">
                  <strong>{c.title}</strong>
                  <span className="chat-row-time">{timeLabel(last?.createdAt)}</span>
                </div>
                <div className="chat-row-bottom">
                  <span className="chat-row-preview">{messagePreview(last)}</span>
                  {unread > 0 && <span className="chat-unread-badge">{unread}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
