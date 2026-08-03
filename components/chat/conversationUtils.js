// Pure helpers that assemble ONE unified conversation list for the sidebar
// out of four different sources — seeded/created Groups and Direct chats
// live in ChatContext state, while Case Discussion Rooms and Client Chats
// are derived on the fly from data/cases.js (via clientDirectory.js) so
// there's exactly one record of "this case/client exists" anywhere.
import { CURRENT_USER } from "@/data/team";
import { buildClientDirectory } from "@/components/cases/clientDirectory";
import { caseConversationId, clientConversationId } from "./ChatContext";
import { canAccessCaseRoom } from "./permissions";

export function buildConversations({ cases, tasks, groups, directConversations, clientChatAssignments }) {
  const list = [];

  groups.forEach((g) => {
    list.push({ id: g.id, kind: "group", title: g.name, memberNames: g.memberNames });
  });

  directConversations.forEach((d) => {
    const other = d.memberNames.find((n) => n !== CURRENT_USER.name) || d.memberNames[0];
    list.push({ id: d.id, kind: "direct", title: other, memberNames: d.memberNames, otherName: other });
  });

  buildClientDirectory(cases).forEach((client) => {
    list.push({
      id: clientConversationId(client.name),
      kind: "client",
      title: client.name,
      clientName: client.name,
      phone: client.phone,
      address: client.address,
      matters: client.matters,
      assignment: clientChatAssignments[client.name] || null,
    });
  });

  cases.forEach((c) => {
    if (!canAccessCaseRoom(c, tasks)) return;
    list.push({
      id: caseConversationId(c.no),
      kind: "case",
      title: c.parties,
      caseNo: c.no,
      caseNumber: c.number,
      court: c.court,
      caseData: c,
    });
  });

  return list;
}

export function messagesFor(conversationId, messages) {
  return messages.filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function lastMessageFor(conversationId, messages) {
  const list = messagesFor(conversationId, messages);
  return list.length ? list[list.length - 1] : null;
}

export function unreadCountFor(conversationId, messages, readState) {
  const lastRead = readState[conversationId];
  return messages.filter(
    (m) =>
      m.conversationId === conversationId &&
      m.senderName !== CURRENT_USER.name &&
      (!lastRead || m.createdAt > lastRead)
  ).length;
}

export function messagePreview(message) {
  if (!message) return "No messages yet";
  if (message.deleted) return "This message was deleted";
  if (message.text) return message.text;
  if (message.attachmentIds?.length) return "📎 Attachment";
  return "";
}

export function sortConversations(list, messages) {
  return [...list].sort((a, b) => {
    const la = lastMessageFor(a.id, messages);
    const lb = lastMessageFor(b.id, messages);
    if (la && lb) return lb.createdAt.localeCompare(la.createdAt);
    if (la) return -1;
    if (lb) return 1;
    return a.title.localeCompare(b.title);
  });
}

export function matchesSearch(conversation, messages, term) {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  if (conversation.title.toLowerCase().includes(q)) return true;
  return messagesFor(conversation.id, messages).some((m) => (m.text || "").toLowerCase().includes(q));
}
