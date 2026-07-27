"use client";

import { useState } from "react";
import Link from "next/link";
import { displayDate } from "./utils";

export default function CaseOverview({ caseData, onAdd, onEdit, onDelete, onViewDocument, onEditCase, showCaseDetailsLink = true }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!caseData) return null;

  return (
    <>
      <div className="drawer-actions">
        <button type="button" className="btn btn-outline" onClick={onEditCase}>
          ✎ Edit Case
        </button>
      </div>

      <div className="matter-meta">
        <span>
          <b>{caseData.court}</b>
          {caseData.city} · {caseData.room}
        </span>
        <span>
          <b>{caseData.judge}</b>
          Presiding judge
        </span>
        <span>
          <b>{caseData.stage}</b>
          Current stage
        </span>
      </div>

      <section className="drawer-section">
        <div className="drawer-section-title">
          <h3>Client details</h3>
          {!caseData.client && (
            <button type="button" className="link" onClick={() => onAdd("client")}>
              + Add client
            </button>
          )}
        </div>
        {caseData.client ? (
          <div className="client-card">
            <b>{caseData.client.name}</b>
            <span>{caseData.client.phone}</span>
            <span>{caseData.client.address}</span>
          </div>
        ) : (
          <div className="empty-inline">No client linked.</div>
        )}
      </section>

      <section className="drawer-section">
        <div className="drawer-section-title">
          <h3>Upcoming hearing</h3>
          <button type="button" className="link" onClick={() => onAdd("nextDate")}>
            + Next Date
          </button>
        </div>
        <div className="hearing-highlight">
          <b>
            {displayDate(caseData.date)} · {caseData.time}
          </b>
          <span>
            {caseData.court}, {caseData.room}
          </span>
        </div>
      </section>

      <section className="drawer-section">
        <div className="drawer-section-title">
          <h3>Previous Dates</h3>
          <button type="button" className="link" onClick={() => onAdd("previousDate")}>
            + Add previous date
          </button>
        </div>
        {caseData.previousDates.length ? (
          <div className="previous-date-list">
            {caseData.previousDates.map((pd) => {
              const expanded = expandedId === pd.id;
              return (
                <article className="previous-date-card" key={pd.id}>
                  <button
                    type="button"
                    className="previous-date-head"
                    onClick={() => setExpandedId(expanded ? null : pd.id)}
                    aria-expanded={expanded}
                  >
                    <div>
                      <b>{pd.date}</b>
                      <span className="previous-date-meta">
                        {pd.court} · {pd.stage}
                      </span>
                    </div>
                    <span className="previous-date-expand">{expanded ? "▾" : "▸"}</span>
                  </button>
                  <div className="previous-date-meta">
                    <b>Purpose:</b> {pd.purpose}
                  </div>
                  <div className="previous-date-meta">
                    <b>Outcome:</b> {pd.outcome}
                  </div>
                  <div className="previous-date-meta">
                    {pd.advocate} · Updated {pd.updatedAt}
                  </div>
                  {expanded && <div className="previous-date-full-notes">{pd.fullNotes}</div>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-inline">No previous dates recorded.</div>
        )}
      </section>

      <section className="drawer-section">
        <div className="drawer-section-title">
          <h3>Notes</h3>
          <button type="button" className="link" onClick={() => onAdd("note")}>
            + Add note
          </button>
        </div>
        {caseData.notes.length ? (
          caseData.notes.map((note, i) => (
            <div className="case-note" key={note.id}>
              <div>
                <time>{note.date}</time>
                <p>{note.text}</p>
              </div>
              <span className="mini-actions">
                <button type="button" onClick={() => onEdit("note", i)}>
                  Edit
                </button>
                <button type="button" className="danger-action" onClick={() => onDelete("note", i)}>
                  Delete
                </button>
              </span>
            </div>
          ))
        ) : (
          <div className="empty-inline">No notes.</div>
        )}
      </section>

      <section className="drawer-section">
        <div className="drawer-section-title">
          <h3>Linked drafts &amp; documents</h3>
          <button type="button" className="link" onClick={() => onAdd("document")}>
            + Add document
          </button>
        </div>
        <div className="document-chips">
          {caseData.docs.map((doc, i) => (
            <span key={i}>
              ▧ {doc}
              <span className="mini-actions">
                <button type="button" onClick={() => onViewDocument(doc)}>
                  View
                </button>
                <button type="button" onClick={() => onEdit("document", i)}>
                  Edit
                </button>
                <button type="button" className="danger-action" onClick={() => onDelete("document", i)}>
                  Delete
                </button>
              </span>
            </span>
          ))}
        </div>
        {showCaseDetailsLink && (
          <Link href={`/cases/${caseData.no}`} className="btn btn-block case-details-btn">
            ▤ Case Details
          </Link>
        )}
      </section>
    </>
  );
}
