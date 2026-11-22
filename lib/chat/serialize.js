import "server-only";

export function serializeMessage(row) {
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

export function serializeGroup(row) {
  return { id: row.id, name: row.name, memberNames: row.member_names || [] };
}

export function serializeDirectConversation(row) {
  return { id: row.id, memberNames: row.member_names || [] };
}
