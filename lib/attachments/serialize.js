import "server-only";

// `objectUrl` held a browser-session-only blob: URL before this migration —
// every consumer (MessageBubble, MessageComposer, AttachFileMenu,
// DocumentLibraryWorkspace, ChatRightPanel) just uses it as a plain <img
// src>/<a href>, so a real (signed, time-limited) Storage URL slots into
// the exact same field with zero changes needed in any of them.
export function serializeAttachmentRow(row, objectUrl, extra = {}) {
  return {
    id: row.id,
    name: row.name,
    mimeCategory: row.mime_category,
    size: row.size,
    objectUrl: objectUrl || null,
    uploadedBy: row.uploaded_by_name,
    uploadedAt: row.uploaded_at,
    sourceConversationId: row.source_conversation_id,
    sourceMessageId: row.source_message_id,
    category: row.category,
    description: row.description || "",
    tags: row.tags || [],
    linkedCaseNo: extra.linkedCaseNo ?? null,
    linkedClientName: row.linked_client_name,
    linkedTaskId: row.linked_task_id,
    linkedAppointmentId: row.linked_appointment_id,
    linkedDraftSlug: row.linked_draft_slug,
  };
}
