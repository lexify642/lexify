"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDrafts } from "./DraftsContext";
import { useDraftReview, REVIEW_STATUSES } from "./DraftReviewContext";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending Reviews", statuses: ["Sent", "Opened", "Under Review"] },
  { key: "changesRequested", label: "Changes Requested", statuses: ["Changes Requested"] },
  { key: "changesReceived", label: "Changes Received", statuses: ["Changes Received"] },
  { key: "approved", label: "Approved", statuses: ["Approved"] },
  { key: "rejected", label: "Rejected", statuses: ["Rejected"] },
];

const STATUS_TONE = {
  Sent: "blue",
  Opened: "blue",
  "Under Review": "orange",
  "Changes Requested": "orange",
  "Changes Received": "orange",
  Approved: "green",
  Rejected: "red",
  Expired: "red",
};

// Review requests are only ever created by CURRENT_USER (this app has one
// signed-in user, no separate reviewer login) — "Sent for Review" and
// "Received Reviews" from the spec collapse into the same real list here,
// organized by status instead of a fake sender/recipient split.
export default function ReviewDashboard() {
  const router = useRouter();
  const { drafts, setActiveDraftId } = useDrafts();
  const { reviewRequests, updateReviewStatus } = useDraftReview();
  const [filter, setFilter] = useState("all");

  const activeFilter = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const rows = useMemo(() => {
    const list = activeFilter.statuses ? reviewRequests.filter((r) => activeFilter.statuses.includes(r.status)) : reviewRequests;
    return [...list].sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  }, [reviewRequests, activeFilter]);

  function openDraft(draftId) {
    setActiveDraftId(draftId);
    router.push("/draft");
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Review Dashboard</h1>
          <p className="page-subtitle">Every draft sent for review, tracked by status.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={() => router.push("/draft")}>
            ← Back to Draft Editor
          </button>
        </div>
      </div>

      <div className="filter-row" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`btn btn-sm ${filter === f.key ? "" : "btn-outline"}`} onClick={() => setFilter(f.key)}>
            {f.label}
            {f.key !== "all" && ` (${reviewRequests.filter((r) => f.statuses.includes(r.status)).length})`}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Document</th>
              <th>Version</th>
              <th>Reviewer</th>
              <th>Sent</th>
              <th>Deadline</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const draft = drafts.find((d) => d.id === r.draftId);
              const version = draft?.versions.find((v) => v.id === r.versionId);
              return (
                <tr key={r.id} className="clause-row-clickable" onClick={() => draft && openDraft(draft.id)}>
                  <td>{r.caseNo || "—"}</td>
                  <td>
                    <strong>{draft?.title || "Draft"}</strong>
                  </td>
                  <td>{version?.label || "—"}</td>
                  <td>{r.recipients[0]?.name || r.recipients[0]?.email}</td>
                  <td>{new Date(r.sentAt).toLocaleDateString("en-IN")}</td>
                  <td>{r.deadline || "—"}</td>
                  <td>
                    <span className={`badge ${STATUS_TONE[r.status] || "blue"}`}>{r.status}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={r.status}
                      onChange={(e) => updateReviewStatus(r.id, e.target.value)}
                      style={{ fontSize: 12, padding: "4px 6px" }}
                    >
                      {REVIEW_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-inline">
                  No review requests {filter !== "all" ? `in "${activeFilter.label}"` : "yet"}. Use Draft Editor → Review → Send for Review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
