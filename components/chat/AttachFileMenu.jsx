"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENT_USER } from "@/data/team";
import { canManageChat } from "./permissions";
import { useAttachments } from "./AttachmentsContext";
import AttachmentPreviewModal from "./AttachmentPreviewModal";
import LinkAttachmentModal from "./LinkAttachmentModal";
import ShareAttachmentModal from "./ShareAttachmentModal";

// Per-attachment action menu — every "Save to X"/"Attach to X" action just
// sets a linkedX field on this one Attachments record (see
// components/chat/AttachmentsContext.jsx); nothing here ever copies the file.
export default function AttachFileMenu({ attachment, conversations, onClose }) {
  const { deleteAttachment } = useAttachments();
  const ref = useRef(null);
  const [preview, setPreview] = useState(false);
  const [linkMode, setLinkMode] = useState(null);
  const [sharing, setSharing] = useState(false);

  const showDropdown = !preview && !linkMode && !sharing;

  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, onClose]);

  const canDelete = canManageChat() || attachment.uploadedBy === CURRENT_USER.name;

  function copyLink() {
    const url = `${window.location.origin}/documents?highlight=${attachment.id}`;
    navigator.clipboard?.writeText(url);
    onClose();
  }

  function handleDelete() {
    deleteAttachment(attachment.id);
    onClose();
  }

  return (
    <>
      {showDropdown && (
        <div className="attach-file-menu" ref={ref}>
          <button type="button" onClick={() => setPreview(true)}>View</button>
          <a href={attachment.objectUrl || "#"} download={attachment.name} onClick={onClose}>
            Download
          </a>
          <button type="button" onClick={() => setLinkMode("client")}>Save to Client</button>
          <button type="button" onClick={() => setLinkMode("case")}>Save to Case</button>
          <a href={`/documents?highlight=${attachment.id}`}>Save to Documents Library</a>
          <button type="button" onClick={() => setLinkMode("calendar")}>Attach to Calendar Event</button>
          <button type="button" onClick={() => setLinkMode("task")}>Attach to Task</button>
          <button type="button" onClick={() => setLinkMode("draft")}>Attach to Legal Draft</button>
          <button type="button" onClick={() => setSharing(true)}>Share to another Chat</button>
          <button type="button" onClick={copyLink}>Copy Link</button>
          {canDelete && (
            <button type="button" className="danger-action" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      )}

      {preview && (
        <AttachmentPreviewModal
          attachment={attachment}
          onClose={() => {
            setPreview(false);
            onClose();
          }}
        />
      )}
      {linkMode && (
        <LinkAttachmentModal
          attachment={attachment}
          mode={linkMode}
          onClose={() => {
            setLinkMode(null);
            onClose();
          }}
        />
      )}
      {sharing && (
        <ShareAttachmentModal
          attachment={attachment}
          conversations={conversations}
          onClose={() => {
            setSharing(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
