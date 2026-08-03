// Communication Hub seed data. Case Discussion Rooms and Client Chats are
// NOT seeded here — they're derived at render time from data/cases.js and
// components/cases/clientDirectory.js (see components/chat/ChatContext.jsx),
// so there is exactly one record of "this case/client exists" anywhere.
export const EMOJI_SET = ["😀", "😂", "😍", "👍", "🙏", "🎉", "😢", "😡", "👏", "🔥", "✅", "❌", "📌", "⚖️", "📄", "💬"];

export const ATTACHMENT_CATEGORIES = ["Pleading", "Evidence", "Correspondence", "Contract", "Court Order", "Research", "Invoice", "Other"];

export const INITIAL_GROUPS = [
  { id: "group-litigation", name: "Litigation Team", memberNames: ["John Anderson", "R. Sharma", "K. Verma"] },
  { id: "group-corporate", name: "Corporate Team", memberNames: ["John Anderson", "K. Verma"] },
  { id: "group-research", name: "Research Team", memberNames: ["R. Sharma", "P. Iyer"] },
  { id: "group-partners", name: "Partners", memberNames: ["John Anderson"] },
  { id: "group-finance", name: "Finance", memberNames: ["S. Nair", "P. Iyer"] },
  { id: "group-hr", name: "HR", memberNames: ["S. Nair"] },
];

// A member's own session is always "online"; the rest are a fixed demo
// snapshot — there's no presence backend to report real online/offline
// state from.
export const INITIAL_ONLINE = {
  "John Anderson": true,
  "R. Sharma": true,
  "K. Verma": false,
  "P. Iyer": true,
  "S. Nair": false,
};

function msg(id, conversationId, senderName, text, createdAt, extra = {}) {
  return {
    id,
    conversationId,
    senderName,
    senderRole: undefined,
    text,
    attachmentIds: [],
    replyToId: null,
    forwardedFromId: null,
    edited: false,
    deleted: false,
    pinnedBy: [],
    starredBy: [],
    mentions: [],
    createdAt,
    status: "seen",
    ...extra,
  };
}

export const INITIAL_MESSAGES = [
  msg("seed-1", "group-litigation", "John Anderson", "Team, the Chevron writ petition hearing got moved up. Please review the compilation before Thursday.", "2026-07-20T10:05:00"),
  msg("seed-2", "group-litigation", "R. Sharma", "On it — annexures are almost done, will share the draft tonight.", "2026-07-20T10:12:00"),
  msg("seed-3", "group-litigation", "K. Verma", "Noted, I'll go through the written brief for ABC Corp in parallel.", "2026-07-20T10:14:00"),
  msg("seed-4", "group-partners", "John Anderson", "Reminder: partner meeting moved to Friday 4pm.", "2026-07-21T09:00:00", { pinnedBy: ["John Anderson"] }),
  msg("seed-5", "group-research", "P. Iyer", "Uploading the collected witness affidavits shortly.", "2026-06-14T16:00:00"),
];
