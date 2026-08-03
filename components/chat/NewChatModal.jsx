"use client";

import { useState } from "react";
import { CURRENT_USER, TEAM_MEMBERS } from "@/data/team";
import { useChat } from "./ChatContext";

export default function NewChatModal({ onClose, onCreated }) {
  const { startDirectChat, createGroup } = useChat();
  const [tab, setTab] = useState("direct");
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState([]);

  const candidates = TEAM_MEMBERS.filter((m) => m.name !== CURRENT_USER.name);

  function toggleMember(name) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function handleStartDirect(name) {
    const id = startDirectChat(name);
    onCreated(id);
  }

  function handleCreateGroup() {
    if (!groupName.trim() || selected.length === 0) return;
    const entry = createGroup(groupName.trim(), selected);
    onCreated(entry.id);
  }

  return (
    <div className="case-modal-backdrop show" onClick={onClose}>
      <div className="case-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>New chat</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="workspace-tabs" style={{ marginBottom: 16 }}>
            <a className={tab === "direct" ? "active" : ""} onClick={() => setTab("direct")}>Direct message</a>
            <a className={tab === "group" ? "active" : ""} onClick={() => setTab("group")}>New group</a>
          </div>

          {tab === "direct" ? (
            <div className="new-chat-member-list">
              {candidates.map((m) => (
                <div className="new-chat-member-row" key={m.id}>
                  <div>
                    <strong>{m.name}</strong>
                    <span>{m.role}</span>
                  </div>
                  <button type="button" className="btn btn-outline" onClick={() => handleStartDirect(m.name)}>
                    Chat
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <label>
                Group name
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Appeals Task Force" />
              </label>
              <div className="new-chat-member-list" style={{ marginTop: 12 }}>
                {candidates.map((m) => (
                  <label className="new-chat-member-row checkbox-row" key={m.id}>
                    <input type="checkbox" checked={selected.includes(m.name)} onChange={() => toggleMember(m.name)} />
                    <div>
                      <strong>{m.name}</strong>
                      <span>{m.role}</span>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        {tab === "group" && (
          <div className="modal-foot">
            <button type="button" className="btn" onClick={handleCreateGroup} disabled={!groupName.trim() || !selected.length}>
              Create group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
