"use client";

import { createContext, useContext, useState } from "react";
import { CURRENT_USER } from "@/data/team";

const DraftReviewContext = createContext(null);

export const REVIEW_STATUSES = ["Sent", "Opened", "Under Review", "Changes Requested", "Changes Received", "Approved", "Rejected", "Expired"];

function newId() {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Review requests are real, in-memory records (same Context pattern as
// every other module) — statuses only ever move through explicit user
// action (this app has no inbound-email/open-tracking infra to detect
// "Opened" automatically, so that transition is manual too, not faked).
export function DraftReviewProvider({ children }) {
  const [reviewRequests, setReviewRequests] = useState([]);

  function createReviewRequest(payload) {
    const request = {
      id: newId(),
      draftId: payload.draftId,
      versionId: payload.versionId,
      caseNo: payload.caseNo || null,
      senderName: CURRENT_USER.name,
      recipients: payload.recipients,
      cc: payload.cc || [],
      bcc: payload.bcc || [],
      subject: payload.subject,
      message: payload.message || "",
      format: payload.format,
      deadline: payload.deadline || null,
      instructions: payload.instructions || "",
      allowComments: !!payload.allowComments,
      allowTrackChanges: !!payload.allowTrackChanges,
      allowEditing: !!payload.allowEditing,
      requireApproval: !!payload.requireApproval,
      status: "Sent",
      sentAt: new Date().toISOString(),
    };
    setReviewRequests((prev) => [request, ...prev]);
    return request;
  }

  function updateReviewStatus(id, status) {
    setReviewRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function recordImportedVersion(id) {
    updateReviewStatus(id, "Changes Received");
  }

  return (
    <DraftReviewContext.Provider value={{ reviewRequests, createReviewRequest, updateReviewStatus, recordImportedVersion }}>
      {children}
    </DraftReviewContext.Provider>
  );
}

export function useDraftReview() {
  const ctx = useContext(DraftReviewContext);
  if (!ctx) throw new Error("useDraftReview must be used within a DraftReviewProvider");
  return ctx;
}
