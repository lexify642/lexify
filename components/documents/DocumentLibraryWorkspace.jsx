"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useChat } from "@/components/chat/ChatContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { buildConversations } from "@/components/chat/conversationUtils";
import { formatFileSize, MIME_CATEGORIES } from "@/data/attachments";
import AttachFileMenu from "@/components/chat/AttachFileMenu";

export default function DocumentLibraryWorkspace() {
  const { cases } = useCases();
  const { tasks } = useTasks();
  const { groups, directConversations, clientChatAssignments } = useChat();
  const { attachments } = useAttachments();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState(searchParams.get("client") || "");
  const [caseFilter, setCaseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [uploaderFilter, setUploaderFilter] = useState("");
  const highlightId = searchParams.get("highlight");

  const conversations = useMemo(
    () => buildConversations({ cases, tasks, groups, directConversations, clientChatAssignments }),
    [cases, tasks, groups, directConversations, clientChatAssignments]
  );

  useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(`doc-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  const clientNames = useMemo(() => Array.from(new Set(attachments.map((a) => a.linkedClientName).filter(Boolean))).sort(), [attachments]);
  const uploaderNames = useMemo(() => Array.from(new Set(attachments.map((a) => a.uploadedBy).filter(Boolean))).sort(), [attachments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return attachments.filter((a) => {
      if (term && !a.name.toLowerCase().includes(term) && !(a.tags || []).some((t) => t.toLowerCase().includes(term))) return false;
      if (clientFilter && a.linkedClientName !== clientFilter) return false;
      if (caseFilter && a.linkedCaseNo !== caseFilter) return false;
      if (typeFilter && a.mimeCategory !== typeFilter) return false;
      if (uploaderFilter && a.uploadedBy !== uploaderFilter) return false;
      return true;
    });
  }, [attachments, search, clientFilter, caseFilter, typeFilter, uploaderFilter]);

  function caseLabelFor(caseNo) {
    const c = cases.find((cc) => cc.no === caseNo);
    return c ? `${c.number} — ${c.parties}` : null;
  }

  function conversationLabelFor(conversationId) {
    return conversations.find((c) => c.id === conversationId)?.title || null;
  }

  return (
    <div className="page">
      <h1 className="page-title">Document Library</h1>
      <p className="page-subtitle page-subtitle-long">
        Every file uploaded anywhere in the Communication Hub — chats, Case Discussion Rooms, Client Chats — appears here once.
        Nothing is duplicated: this is the same record you see attached in the source chat, case, or client file.
      </p>

      <div className="library-controls">
        <div className="search">
          <span>⌕</span>
          <input placeholder="Search by document name or tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
          <option value="">All clients</option>
          {clientNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={caseFilter} onChange={(e) => setCaseFilter(e.target.value)}>
          <option value="">All cases</option>
          {cases.map((c) => (
            <option key={c.no} value={c.no}>{c.number}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {MIME_CATEGORIES.map((t) => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>
        <select value={uploaderFilter} onChange={(e) => setUploaderFilter(e.target.value)}>
          <option value="">All uploaders</option>
          {uploaderNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="library-summary">
        {filtered.length} of {attachments.length} documents
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Client</th>
              <th>Case</th>
              <th>Source chat</th>
              <th>Uploaded by</th>
              <th>Date</th>
              <th>Size</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} id={`doc-${a.id}`} className={highlightId === a.id ? "highlighted-row" : ""}>
                <td>
                  <strong>{a.name}</strong>
                </td>
                <td>{a.mimeCategory.toUpperCase()}</td>
                <td>{a.linkedClientName || "—"}</td>
                <td>{caseLabelFor(a.linkedCaseNo) || "—"}</td>
                <td>{conversationLabelFor(a.sourceConversationId) || "—"}</td>
                <td>{a.uploadedBy}</td>
                <td>{new Date(a.uploadedAt).toLocaleDateString("en-IN")}</td>
                <td>{formatFileSize(a.size)}</td>
                <td style={{ position: "relative" }}>
                  <AttachRowMenu attachment={a} conversations={conversations} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-inline">
                  No documents match these filters yet. Files you share in any chat will appear here automatically.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttachRowMenu({ attachment, conversations }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <button type="button" className="msg-attachment-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
        ⋮
      </button>
      {menuOpen && <AttachFileMenu attachment={attachment} conversations={conversations} onClose={() => setMenuOpen(false)} />}
    </>
  );
}
