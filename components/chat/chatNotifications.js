import { CURRENT_USER } from "@/data/team";
import { lastMessageFor } from "./conversationUtils";

// Same "recomputed fresh from live state every render" pattern as
// components/tasks/NotificationBell.jsx's buildNotifications — no
// append-only event log exists, so these are derived directly from the
// Chat/Attachments/Appointments stores rather than tracked separately.
export function buildChatNotifications({ messages, conversations, attachments, appointments }) {
  const items = [];
  const myConversations = conversations.filter((c) => {
    if (c.kind === "direct" || c.kind === "group") return (c.memberNames || []).includes(CURRENT_USER.name);
    return true; // client/case rooms are already access-filtered by buildConversations
  });
  const myConversationIds = new Set(myConversations.map((c) => c.id));

  myConversations.forEach((c) => {
    const last = lastMessageFor(c.id, messages);
    if (last && last.senderName !== CURRENT_USER.name && !last.deleted) {
      items.push({
        id: `chat-msg-${last.id}`,
        type: "message",
        href: `/chat?c=${c.id}`,
        message: `New message from ${last.senderName} in ${c.title}`,
        timestamp: last.createdAt,
      });
    }
  });

  messages
    .filter((m) => myConversationIds.has(m.conversationId) && m.mentions?.includes(CURRENT_USER.name) && m.senderName !== CURRENT_USER.name)
    .forEach((m) => {
      const conv = conversations.find((c) => c.id === m.conversationId);
      items.push({
        id: `chat-mention-${m.id}`,
        type: "mention",
        href: `/chat?c=${m.conversationId}`,
        message: `${m.senderName} mentioned you in ${conv?.title || "a chat"}`,
        timestamp: m.createdAt,
      });
    });

  attachments
    .filter((a) => a.uploadedBy !== CURRENT_USER.name)
    .forEach((a) => {
      items.push({
        id: `chat-doc-${a.id}`,
        type: "document",
        href: `/documents?highlight=${a.id}`,
        message: `${a.uploadedBy} uploaded "${a.name}"`,
        timestamp: a.uploadedAt,
      });
    });

  attachments
    .filter((a) => a.linkedCaseNo)
    .forEach((a) => {
      items.push({
        id: `chat-case-link-${a.id}`,
        type: "caseLinked",
        href: `/documents?highlight=${a.id}`,
        message: `"${a.name}" was linked to case ${a.linkedCaseNo}`,
        timestamp: a.uploadedAt,
      });
    });

  (appointments || [])
    .filter((a) => a.assignedToName === CURRENT_USER.name)
    .forEach((a) => {
      items.push({
        id: `appt-${a.id}`,
        type: "appointment",
        href: `/appointments/${a.id}`,
        message: `${a.eventType || "Event"} scheduled: "${a.title}" on ${a.date}`,
        timestamp: a.date,
      });
    });

  return items;
}
