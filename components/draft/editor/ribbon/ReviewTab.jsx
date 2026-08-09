"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDraftComments } from "../../DraftCommentsContext";
import { useDraftReview } from "../../DraftReviewContext";
import SendForReviewModal from "../modals/SendForReviewModal";
import ImportUpdatedDraftModal from "../modals/ImportUpdatedDraftModal";
import VersionHistoryPanel from "../modals/VersionHistoryPanel";
import { canSendForReview } from "../../permissions";

export default function ReviewTab({ draft, activePanel, onTogglePanel }) {
  const router = useRouter();
  const { commentsForDraft } = useDraftComments();
  const { reviewRequests } = useDraftReview();
  const [openModal, setOpenModal] = useState(null);

  const openComments = commentsForDraft(draft.id).filter((t) => t.status === "Open").length;
  const draftReviews = reviewRequests.filter((r) => r.draftId === draft.id);
  const pendingReviews = draftReviews.filter((r) => !["Approved", "Rejected"].includes(r.status)).length;

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group ribbon-group-grow">
        <div className="ribbon-group-body">
          {canSendForReview() && (
            <>
              <button type="button" className="ribbon-btn" onClick={() => setOpenModal("send")}>
                Send for Review
              </button>
              <button type="button" className="ribbon-btn" onClick={() => setOpenModal("import")}>
                Import Updated Draft
              </button>
            </>
          )}
          {pendingReviews > 0 && <span className="badge orange">{pendingReviews} pending</span>}
        </div>
        <div className="ribbon-group-label">Review Workflow</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={() => setOpenModal("versions")}>
            Version History
          </button>
          <button type="button" className="ribbon-btn" onClick={() => router.push("/draft/reviews")}>
            Review Dashboard
          </button>
        </div>
        <div className="ribbon-group-label">Track Changes</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className={`ribbon-btn${activePanel === "comments" ? " active" : ""}`} onClick={() => onTogglePanel("comments")}>
            Comments{openComments > 0 ? ` (${openComments})` : ""}
          </button>
        </div>
        <div className="ribbon-group-label">Comments</div>
      </div>

      {openModal === "send" && <SendForReviewModal draft={draft} onClose={() => setOpenModal(null)} />}
      {openModal === "import" && <ImportUpdatedDraftModal draft={draft} onClose={() => setOpenModal(null)} />}
      {openModal === "versions" && <VersionHistoryPanel draft={draft} onClose={() => setOpenModal(null)} />}
    </div>
  );
}
