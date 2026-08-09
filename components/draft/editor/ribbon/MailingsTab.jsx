"use client";

import { useState } from "react";
import SendForReviewModal from "../modals/SendForReviewModal";
import MailMergeDialog from "../modals/MailMergeDialog";
import RecipientListModal from "../modals/RecipientListModal";

export default function MailingsTab({ editor, draft }) {
  const [openModal, setOpenModal] = useState(null);

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group ribbon-group-grow">
        <div className="ribbon-group-body ribbon-group-body-wrap">
          <button type="button" className="ribbon-btn" onClick={() => setOpenModal({ kind: "send", format: "editable", approval: false })}>
            Create Email
          </button>
          <button type="button" className="ribbon-btn" onClick={() => setOpenModal({ kind: "send", format: "pdf", approval: true })}>
            Send Draft for Review
          </button>
          <button type="button" className="ribbon-btn" onClick={() => setOpenModal({ kind: "send", format: "pdf", approval: false })}>
            Send as PDF
          </button>
          <button type="button" className="ribbon-btn" onClick={() => setOpenModal({ kind: "send", format: "editable", approval: false })}>
            Send Editable Draft
          </button>
          <button type="button" className="ribbon-btn" onClick={() => setOpenModal({ kind: "send", format: "both", approval: true })}>
            Send for Approval
          </button>
        </div>
        <div className="ribbon-group-label">Send</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={() => setOpenModal({ kind: "merge" })}>
            Mail Merge
          </button>
          <button type="button" className="ribbon-btn" onClick={() => setOpenModal({ kind: "recipients" })}>
            Recipient List
          </button>
        </div>
        <div className="ribbon-group-label">Mail Merge</div>
      </div>

      {openModal?.kind === "send" && (
        <SendForReviewModal
          draft={draft}
          initialFormat={openModal.format}
          initialRequireApproval={openModal.approval}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal?.kind === "merge" && <MailMergeDialog draft={draft} editor={editor} onClose={() => setOpenModal(null)} />}
      {openModal?.kind === "recipients" && <RecipientListModal onClose={() => setOpenModal(null)} />}
    </div>
  );
}
