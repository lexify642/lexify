"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const ChatContext = createContext(null);

export function directConversationId(nameA, nameB) {
  return `dm-${[nameA, nameB].sort().join("__")}`;
}

export function caseConversationId(caseNo) {
  return `case-${caseNo}`;
}

export function clientConversationId(clientName) {
  return `client-${clientName}`;
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    // Name the request and status when the server didn't send its own
    // message (e.g. a crash page or an empty 4xx/5xx), so the console says
    // which call failed instead of a bare "Something went wrong."
    const method = options?.method || "GET";
    throw new Error(payload?.error?.message || `${method} ${url} failed (${res.status} ${res.statusText || "no JSON body"}).`);
  }
  return payload.data;
}

// Mirrors lib/chat/serialize.js's serializeMessage — duplicated (not
// imported) because that module is `server-only` and this runs in the
// browser, receiving raw postgres_changes payloads over the realtime
// websocket rather than an API response.
function messageFromRealtimeRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    text: row.text || "",
    attachmentIds: row.attachment_ids || [],
    replyToId: row.reply_to_id,
    forwardedFromId: row.forwarded_from_id,
    edited: row.edited,
    deleted: row.deleted,
    pinnedBy: row.pinned_by || [],
    starredBy: row.starred_by || [],
    mentions: row.mentions || [],
    createdAt: row.created_at,
    status: row.status,
  };
}

// Backed by Supabase (app/api/chat/*) instead of the old useState(seed) —
// Case Discussion Rooms and Client Chats stay virtual/derived from matters
// (see conversationUtils.js), only Groups/DMs/Messages are real rows now.
// Every exported method keeps its original signature and optimistic-local-
// update behavior, so ChatWorkspace, ConversationView, MessageComposer,
// MessageBubble, ChatSidebarList, etc. all keep working unmodified. A
// realtime subscription on `messages` (see 0003_chat_documents.sql's
// `alter publication supabase_realtime add table messages`) merges in
// other users' messages live, without a page reload.
export function ChatProvider({ children }) {
  const currentUser = useCurrentUser();
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [directConversations, setDirectConversations] = useState([]);
  const [clientChatAssignments, setClientChatAssignments] = useState({});
  const [online] = useState({});
  const [typingBy, setTypingBy] = useState({});
  const [readState, setReadState] = useState({});
  const [loading, setLoading] = useState(true);
  const typingTimers = useRef({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchJson("/api/chat/messages"),
      fetchJson("/api/chat/groups"),
      fetchJson("/api/chat/direct"),
      fetchJson("/api/chat/client-assignments"),
      fetchJson("/api/chat/read"),
    ])
      .then(([msgs, grps, dms, assignments, reads]) => {
        if (cancelled) return;
        setMessages(msgs);
        setGroups(grps);
        setDirectConversations(dms);
        setClientChatAssignments(assignments);
        setReadState(reads);
      })
      .catch((err) => console.error("[ChatContext] initial load failed", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const incoming = messageFromRealtimeRow(payload.new);
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const incoming = messageFromRealtimeRow(payload.new);
        setMessages((prev) => prev.map((m) => (m.id === incoming.id ? incoming : m)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function otherParticipant(conversationId) {
    const dm = directConversations.find((c) => c.id === conversationId);
    if (dm) return dm.memberNames.find((n) => n !== currentUser.name) || null;
    const group = groups.find((g) => g.id === conversationId);
    if (group) return group.memberNames.find((n) => n !== currentUser.name) || null;
    return null;
  }

  function updateMessageStatus(id, status) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  function startDirectChat(otherName) {
    const id = directConversationId(currentUser.name, otherName);
    const memberNames = [currentUser.name, otherName];
    setDirectConversations((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, { id, memberNames }]));

    fetchJson("/api/chat/direct", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, memberNames }) }).catch(
      (err) => console.error("[ChatContext] startDirectChat failed", err)
    );

    return id;
  }

  // Async (unlike every other mutation here) — NewChatModal navigates to
  // the new group by id right after calling this, and a group's id is
  // server-generated (no deterministic-id trick like DMs have), so the
  // real id has to be known before that navigation happens.
  async function createGroup(name, memberNames) {
    const created = await fetchJson("/api/chat/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, memberNames }),
    });
    setGroups((prev) => [...prev, created]);
    return created;
  }

  function sendMessage(conversationId, data) {
    const tempId = newId("msg");
    const entry = {
      id: tempId,
      conversationId,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: data.text || "",
      attachmentIds: data.attachmentIds || [],
      replyToId: data.replyToId || null,
      forwardedFromId: data.forwardedFromId || null,
      edited: false,
      deleted: false,
      pinnedBy: [],
      starredBy: [],
      mentions: data.mentions || [],
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    setMessages((prev) => [...prev, entry]);

    setTimeout(() => updateMessageStatus(tempId, "delivered"), 900);
    setTimeout(() => updateMessageStatus(tempId, "seen"), 2200);

    const other = otherParticipant(conversationId);
    if (other) {
      clearTimeout(typingTimers.current[conversationId]);
      const showTimer = setTimeout(() => setTypingBy((prev) => ({ ...prev, [conversationId]: other })), 1200);
      typingTimers.current[conversationId] = setTimeout(() => {
        setTypingBy((prev) => ({ ...prev, [conversationId]: null }));
      }, 3400);
      typingTimers.current[`${conversationId}-show`] = showTimer;
    }

    fetchJson("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        text: entry.text,
        attachmentIds: entry.attachmentIds,
        replyToId: entry.replyToId,
        forwardedFromId: entry.forwardedFromId,
        mentions: entry.mentions,
      }),
    })
      .then((created) => {
        // The realtime INSERT for this same row may already have arrived
        // and been ignored (temp id doesn't match) — this replace is what
        // actually reconciles it, keyed on the temp id we generated above.
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...created, status: m.status } : m)));
      })
      .catch((err) => console.error("[ChatContext] sendMessage failed", err));

    return entry;
  }

  function patchMessage(id, updates, localUpdater) {
    setMessages((prev) => prev.map((m) => (m.id === id ? localUpdater(m) : m)));
    fetchJson(`/api/chat/messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) }).catch(
      (err) => console.error("[ChatContext] message update failed", err)
    );
  }

  function editMessage(id, text) {
    patchMessage(id, { text, edited: true }, (m) => ({ ...m, text, edited: true }));
  }

  function deleteMessage(id) {
    patchMessage(id, { deleted: true, text: "", attachmentIds: [] }, (m) => ({ ...m, deleted: true, text: "", attachmentIds: [] }));
  }

  function togglePin(id) {
    const message = messages.find((m) => m.id === id);
    if (!message) return;
    const already = message.pinnedBy.includes(currentUser.name);
    const pinnedBy = already ? message.pinnedBy.filter((n) => n !== currentUser.name) : [...message.pinnedBy, currentUser.name];
    patchMessage(id, { pinnedBy }, (m) => ({ ...m, pinnedBy }));
  }

  function toggleStar(id) {
    const message = messages.find((m) => m.id === id);
    if (!message) return;
    const already = message.starredBy.includes(currentUser.name);
    const starredBy = already ? message.starredBy.filter((n) => n !== currentUser.name) : [...message.starredBy, currentUser.name];
    patchMessage(id, { starredBy }, (m) => ({ ...m, starredBy }));
  }

  function forwardMessage(originalId, toConversationId) {
    const original = messages.find((m) => m.id === originalId);
    if (!original) return null;
    return sendMessage(toConversationId, { text: original.text, attachmentIds: original.attachmentIds, forwardedFromId: originalId });
  }

  function reassignClientChat(clientName, memberName, memberRole) {
    setClientChatAssignments((prev) => ({ ...prev, [clientName]: { assignedToName: memberName, assignedToRole: memberRole } }));
    fetchJson("/api/chat/client-assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName, assignedToName: memberName, assignedToRole: memberRole }),
    }).catch((err) => console.error("[ChatContext] reassignClientChat failed", err));
  }

  function markRead(conversationId) {
    setReadState((prev) => ({ ...prev, [conversationId]: new Date().toISOString() }));
    fetchJson("/api/chat/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId }) }).catch(
      (err) => console.error("[ChatContext] markRead failed", err)
    );
  }

  const value = {
    messages,
    groups,
    directConversations,
    clientChatAssignments,
    online,
    typingBy,
    readState,
    loading,
    startDirectChat,
    createGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePin,
    toggleStar,
    forwardMessage,
    reassignClientChat,
    markRead,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
