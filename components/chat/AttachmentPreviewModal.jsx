"use client";

import { useState } from "react";
import { formatFileSize } from "@/data/attachments";

// Real preview for what the browser can genuinely render client-side
// (images, video, audio, PDF). Word/Excel/PowerPoint get the same honest
// "preview not available — download to view" fallback already used by the
// Legal Drafts module, rather than faking an Office renderer.
export default function AttachmentPreviewModal({ attachment, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [speed, setSpeed] = useState(1);

  const isOfficeFormat = ["word", "excel", "powerpoint"].includes(attachment.mimeCategory);

  return (
    <div className="case-modal-backdrop show" onClick={onClose}>
      <div className="case-modal wide attachment-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{attachment.name}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {attachment.mimeCategory === "image" && (
            <>
              <div className="attachment-image-stage">
                <img
                  src={attachment.objectUrl}
                  alt={attachment.name}
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                />
              </div>
              <div className="attachment-preview-controls">
                <button type="button" className="icon-btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>−</button>
                <span>{Math.round(zoom * 100)}%</span>
                <button type="button" className="icon-btn" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>+</button>
                <button type="button" className="icon-btn" onClick={() => setRotation((r) => r - 90)}>⟲</button>
                <button type="button" className="icon-btn" onClick={() => setRotation((r) => r + 90)}>⟳</button>
              </div>
            </>
          )}

          {attachment.mimeCategory === "video" && (
            <video src={attachment.objectUrl} controls className="attachment-video-player" />
          )}

          {attachment.mimeCategory === "audio" && (
            <div className="attachment-audio-player">
              <audio
                src={attachment.objectUrl}
                controls
                ref={(el) => {
                  if (el) el.playbackRate = speed;
                }}
              />
              <div className="attachment-preview-controls">
                <span>Speed</span>
                {[0.5, 1, 1.5, 2].map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`btn ${speed === s ? "btn-soft" : "btn-outline"}`}
                    onClick={(e) => {
                      setSpeed(s);
                      const audio = e.currentTarget.closest(".attachment-audio-player").querySelector("audio");
                      if (audio) audio.playbackRate = s;
                    }}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {attachment.mimeCategory === "pdf" && (
            <iframe src={attachment.objectUrl} title={attachment.name} className="attachment-pdf-frame" />
          )}

          {isOfficeFormat && (
            <div className="empty-inline">
              Preview not available for {attachment.mimeCategory.toUpperCase()} files in this workspace — download to view in
              Word/Excel/PowerPoint.
            </div>
          )}

          {attachment.mimeCategory === "zip" && (
            <div className="empty-inline">Archive files can't be previewed — download to extract.</div>
          )}

          <div className="attachment-meta-row">
            <span>{formatFileSize(attachment.size)}</span>
            <span>Uploaded by {attachment.uploadedBy}</span>
            <span>{new Date(attachment.uploadedAt).toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="modal-foot">
          <a href={attachment.objectUrl || "#"} download={attachment.name} className="btn">
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
