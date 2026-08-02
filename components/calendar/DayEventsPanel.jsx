"use client";

import Link from "next/link";
import { EVENT_META } from "./eventAggregation";

function formatPanelDate(dateStr) {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DayEventsPanel({ open, date, events, onClose }) {
  if (!open) return null;

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal calendar-day-panel">
        <div className="modal-head">
          <div>
            <p className="eyebrow">SCHEDULE</p>
            <h2>{formatPanelDate(date)}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {events.length ? (
            <div className="calendar-day-event-list">
              {events.map((event) => {
                const meta = EVENT_META[event.type];
                const Icon = meta.Icon;
                return (
                  <Link className="calendar-day-event-row" href={event.href} key={event.id} onClick={onClose}>
                    <span className="calendar-day-event-icon" style={{ background: meta.hex }}>
                      <Icon size={15} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="calendar-day-event-main">
                      <strong>{event.title}</strong>
                      <small>
                        {meta.label}
                        {event.time ? ` · ${event.time}` : ""}
                        {event.subtitle ? ` · ${event.subtitle}` : ""}
                      </small>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-inline">No cases, appointments, tasks, or deadlines scheduled.</div>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
