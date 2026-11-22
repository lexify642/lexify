"use client";

import { createContext, useContext, useEffect, useState } from "react";

const DraftReviewContext = createContext(null);

export const REVIEW_STATUSES = ["Sent", "Opened", "Under Review", "Changes Requested", "Changes Received", "Approved", "Rejected", "Expired"];

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

// Review requests are real rows now (app/api/draft-review-requests/*).
// createReviewRequest() is async (unlike most of this app's mutators) and
// posts straight to /api/draft-review/send — that route sends the actual
// email AND persists this record in the same request, fixing the trust gap
// the audit found (previously the email-send and the DB write were two
// separate calls, so a dropped connection between them meant an email could
// go out with no record it ever existed). SendForReviewModal.jsx calls this
// directly now instead of doing its own fetch.
export function DraftReviewProvider({ children }) {
  const [reviewRequests, setReviewRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/draft-review-requests")
      .then((data) => {
        if (!cancelled) setReviewRequests(data);
      })
      .catch((err) => console.error("[DraftReviewContext] initial load failed", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createReviewRequest(payload) {
    const created = await fetchJson("/api/draft-review/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setReviewRequests((prev) => [created, ...prev]);
    return created;
  }

  function updateReviewStatus(id, status) {
    setReviewRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    fetchJson(`/api/draft-review-requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.error("[DraftReviewContext] status update failed", err));
  }

  function recordImportedVersion(id) {
    updateReviewStatus(id, "Changes Received");
  }

  return (
    <DraftReviewContext.Provider value={{ reviewRequests, createReviewRequest, updateReviewStatus, recordImportedVersion, loading }}>
      {children}
    </DraftReviewContext.Provider>
  );
}

export function useDraftReview() {
  const ctx = useContext(DraftReviewContext);
  if (!ctx) throw new Error("useDraftReview must be used within a DraftReviewProvider");
  return ctx;
}
