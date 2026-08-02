"use client";

import { toISODate } from "./eventAggregation";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Monday-first 6-week grid for the given month, matching the main
// calendar's firstDay={1} so the two stay visually aligned.
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function MiniCalendar({ currentDate, selectedDate, todayISO, hasEvents, onSelectDate, onNavigate }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = buildMonthGrid(year, month);
  const label = currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <aside className="mini-calendar">
      <div className="mini-cal-head">
        <b>{label}</b>
        <div className="mini-cal-nav">
          <button type="button" onClick={() => onNavigate(-1)} aria-label="Previous month">
            ‹
          </button>
          <button type="button" onClick={() => onNavigate(1)} aria-label="Next month">
            ›
          </button>
        </div>
      </div>
      <div className="mini-cal-weekdays">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mini-cal-grid">
        {days.map((d) => {
          const dateStr = toISODate(d);
          const classNames = [
            "mini-cal-day",
            d.getMonth() !== month && "muted",
            hasEvents(dateStr) && "has-events",
            dateStr === todayISO && "today",
            dateStr === selectedDate && "selected",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button type="button" key={dateStr} className={classNames} onClick={() => onSelectDate(dateStr)}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
