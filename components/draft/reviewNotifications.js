// Turns live review requests into notification-feed items — same
// purely-computed, session-local pattern as buildChatNotifications and
// computeSmartReminders (no push/backend infra exists in this app).
export function buildReviewNotifications(reviewRequests, drafts) {
  return reviewRequests
    .filter((r) => !["Approved", "Rejected"].includes(r.status))
    .map((r) => {
      const draft = drafts.find((d) => d.id === r.draftId);
      const recipient = r.recipients[0]?.name || r.recipients[0]?.email || "recipient";
      return {
        id: `review-${r.id}`,
        type: "reviewStatus",
        href: "/draft/reviews",
        message: `"${draft?.title || "Draft"}" — ${r.status} (sent to ${recipient})`,
        timestamp: r.sentAt,
      };
    });
}
