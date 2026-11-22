import "server-only";

// Reassembles a drafts row (+ its draft_versions) into the exact shape
// DraftsContext.jsx has always held in memory — every consumer (the editor
// itself, VersionHistoryPanel, CompareVersionsModal, pdfExport/wordExport)
// keeps working unchanged.
export function serializeDraft(row, { versions = [], matterDisplayNo = null } = {}) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    linkedCaseNo: matterDisplayNo,
    clientName: row.client_name || "",
    description: row.description || "",
    versions: versions
      .slice()
      .sort((a, b) => a.number - b.number)
      .map(serializeVersion),
    activeVersionId: row.active_version_id,
    headerHtml: row.header_html || "",
    footerHtml: row.footer_html || "",
    layout: row.layout || {},
    design: row.design || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function serializeVersion(row) {
  return {
    id: row.id,
    number: row.number,
    label: row.label,
    contentJson: row.content_json,
    contentText: row.content_text,
    createdAt: row.created_at,
    createdBy: row.created_by_name,
    action: row.action,
    status: row.status,
  };
}

export function serializeCommentThread(row, replies = []) {
  return {
    id: row.id,
    draftId: row.draft_id,
    quotedText: row.quoted_text,
    status: row.status,
    author: row.author_name,
    createdAt: row.created_at,
    replies: replies
      .slice()
      .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))
      .map((r) => ({ id: r.id, author: r.author_name, body: r.body, createdAt: r.created_at })),
  };
}

export function serializeReviewRequest(row, { matterDisplayNo = null } = {}) {
  return {
    id: row.id,
    draftId: row.draft_id,
    versionId: row.version_id,
    caseNo: matterDisplayNo,
    senderName: row.sender_name,
    recipients: row.recipients || [],
    cc: row.cc || [],
    bcc: row.bcc || [],
    subject: row.subject,
    message: row.message || "",
    format: row.format,
    deadline: row.deadline,
    instructions: row.instructions || "",
    allowComments: row.allow_comments,
    allowTrackChanges: row.allow_track_changes,
    allowEditing: row.allow_editing,
    requireApproval: row.require_approval,
    status: row.status,
    sentAt: row.sent_at,
  };
}

export function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row[key]) ?? [];
    list.push(row);
    map.set(row[key], list);
  }
  return map;
}
