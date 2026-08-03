"use client";

import Link from "next/link";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { formatFileSize } from "@/data/attachments";

export default function RecentDocumentsCard({ limit = 6 }) {
  const { attachments } = useAttachments();

  const items = [...attachments].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, limit);

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">Recent Documents</h2>
        <Link className="link" href="/documents">
          Open Document Library →
        </Link>
      </div>
      {items.length ? (
        items.map((a) => (
          <div className="list-item" key={a.id}>
            <div className="item-main">
              <strong>{a.name}</strong>
              <span>
                {a.linkedCaseNo ? `Case ${a.linkedCaseNo} · ` : ""}Uploaded by {a.uploadedBy} · {formatFileSize(a.size)}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-inline">No documents uploaded yet. Files shared in the Communication Hub will appear here.</div>
      )}
    </section>
  );
}
