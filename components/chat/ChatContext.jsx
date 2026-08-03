"use client";

import { createContext, useContext, useRef, useState } from "react";
import { CURRENT_USER } from "@/data/team";
import { INITIAL_GROUPS, INITIAL_MESSAGES, INITIAL_ONLINE } from "@/data/conversations";

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

// Single in-memory store for the whole Communication Hub, same convention as
// every other module this session (CasesContext/TasksContext/etc.) — resets
// on reload, one hardcoded session identity (CURRENT_USER). Delivered/seen
// ticks and the "X is typing…" indicator are timeout-driven, session-local
// simulations — there's no second real user or realtime backend behind
// them, so they're illustrative UI behavior only, not a real presence system.
export function ChatProvider({ children }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [directConversations, setDirectConversations] = useState([]);
  const [clientChatAssignments, setClientChatAssignments] = useState({
    "Chevron Inc.": { assignedToName: "R. Sharma", assignedToRole: "Junior Advocate" },
    "ABC Corp.": { assignedToName: "K. Verma", assignedToRole: "Junior Advocate" },
  });
  const [online] = useState(INITIAL_ONLINE);
  const [typingBy, setTypingBy] = useState({});
  const [readState, setReadState] = useState({});
  const typingTimers = useRef({});

  function otherParticipant(conversationId) {
    const dm = directConversations.find((c) => c.id === conversationId);
    if (dm) return dm.memberNames.find((n) => n !== CURRENT_USER.name) || null;
    const group = groups.find((g) => g.id === conversationId);
    if (group) return group.memberNames.find((n) => n !== CURRENT_USER.name) || null;
    return null;
  }

  function updateMessageStatus(id, status) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  function startDirectChat(otherName) {
    const id = directConversationId(CURRENT_USER.name, otherName);
    setDirectConversations((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, { id, memberNames: [CURRENT_USER.name, otherName] }]));
    return id;
  }

  function createGroup(name, memberNames) {
    const entry = { id: newId("group"), name, memberNames: Array.from(new Set([CURRENT_USER.name, ...memberNames])) };
    setGroups((prev) => [...prev, entry]);
    return entry;
  }

  function sendMessage(conversationId, data) {
    const entry = {
      id: newId("msg"),
      conversationId,
      senderName: CURRENT_USER.name,
      senderRole: CURRENT_USER.role,
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

    setTimeout(() => updateMessageStatus(entry.id, "delivered"), 900);
    setTimeout(() => updateMessageStatus(entry.id, "seen"), 2200);

    const other = otherParticipant(conversationId);
    if (other) {
      clearTimeout(typingTimers.current[conversationId]);
      const showTimer = setTimeout(() => setTypingBy((prev) => ({ ...prev, [conversationId]: other })), 1200);
      typingTimers.current[conversationId] = setTimeout(() => {
        setTypingBy((prev) => ({ ...prev, [conversationId]: null }));
      }, 3400);
      typingTimers.current[`${conversationId}-show`] = showTimer;
    }
    return entry;
  }

  function editMessage(id, text) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text, edited: true } : m)));
  }

  function deleteMessage(id) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted: true, text: "", attachmentIds: [] } : m)));
  }

  function togglePin(id) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const already = m.pinnedBy.includes(CURRENT_USER.name);
        return { ...m, pinnedBy: already ? m.pinnedBy.filter((n) => n !== CURRENT_USER.name) : [...m.pinnedBy, CURRENT_USER.name] };
      })
    );
  }

  function toggleStar(id) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const already = m.starredBy.includes(CURRENT_USER.name);
        return { ...m, starredBy: already ? m.starredBy.filter((n) => n !== CURRENT_USER.name) : [...m.starredBy, CURRENT_USER.name] };
      })
    );
  }

  function forwardMessage(originalId, toConversationId) {
    const original = messages.find((m) => m.id === originalId);
    if (!original) return null;
    return sendMessage(toConversationId, { text: original.text, attachmentIds: original.attachmentIds, forwardedFromId: originalId });
  }

  function reassignClientChat(clientName, memberName, memberRole) {
    setClientChatAssignments((prev) => ({ ...prev, [clientName]: { assignedToName: memberName, assignedToRole: memberRole } }));
  }

  function markRead(conversationId) {
    setReadState((prev) => ({ ...prev, [conversationId]: new Date().toISOString() }));
  }

  const value = {
    messages,
    groups,
    directConversations,
    clientChatAssignments,
    online,
    typingBy,
    readState,
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
