"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useCases } from "@/components/cases/CasesContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { buildCalendarEvents, filterEvents, groupEventsByDate, EVENT_META, EVENT_TYPES } from "./eventAggregation";
import DayEventsPanel from "./DayEventsPanel";
import AddEventModal from "./AddEventModal";

const VIEW_OPTIONS = [
  ["dayGridMonth", "Month"],
  ["timeGridWeek", "Week"],
  ["timeGridDay", "Day"],
];

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function renderEventContent(arg) {
  const meta = EVENT_META[arg.event.extendedProps.type];
  const Icon = meta.Icon;
  return (
    <div className="calendar-event-pill">
      <span className="calendar-event-dot" style={{ background: meta.hex }} />
      <Icon size={11} strokeWidth={2.4} aria-hidden="true" />
      <span className="calendar-event-pill-title">{arg.event.title}</span>
    </div>
  );
}

export default function CalendarWorkspace() {
  const router = useRouter();
  const { cases } = useCases();
  const { appointments } = useAppointments();
  const calendarRef = useRef(null);

  const [view, setView] = useState("dayGridMonth");
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState({ case: true, appointment: true, task: true, deadline: true });
  const [panelDate, setPanelDate] = useState(null);
  const [addEventOpen, setAddEventOpen] = useState(false);

  const allEvents = useMemo(() => buildCalendarEvents({ cases, appointments }), [cases, appointments]);
  const visibleEvents = useMemo(() => filterEvents(allEvents, { types, search }), [allEvents, types, search]);
  const eventsByDate = useMemo(() => groupEventsByDate(visibleEvents), [visibleEvents]);

  const fcEvents = useMemo(
    () =>
      visibleEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        allDay: !e.time,
        extendedProps: { type: e.type, href: e.href },
      })),
    [visibleEvents]
  );

  function hasEvents(date) {
    return eventsByDate.has(toISODate(date));
  }

  function dayCellHighlightClassNames(arg) {
    return hasEvents(arg.date) ? ["lexify-day-has-events"] : [];
  }

  // Week/Day views show a specific date per header column, so highlighting
  // there is meaningful; Month view's header row is just weekday names
  // (Mon/Tue/...) with no single date, so it's skipped to avoid a
  // misleading highlight.
  function dayHeaderHighlightClassNames(arg) {
    if (arg.view.type === "dayGridMonth") return [];
    return hasEvents(arg.date) ? ["lexify-day-has-events"] : [];
  }

  function changeView(nextView) {
    calendarRef.current?.getApi().changeView(nextView);
    setView(nextView);
  }

  function goToday() {
    calendarRef.current?.getApi().today();
  }

  function goPrev() {
    calendarRef.current?.getApi().prev();
  }

  function goNext() {
    calendarRef.current?.getApi().next();
  }

  function handleDatesSet(arg) {
    setTitle(arg.view.title);
  }

  function handleDateClick(info) {
    setPanelDate(toISODate(info.date));
  }

  function handleEventClick(info) {
    info.jsEvent.preventDefault();
    router.push(info.event.extendedProps.href);
  }

  function toggleType(type) {
    setTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">SCHEDULE</p>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Cases, appointments, tasks, and deadlines in one place.</p>
        </div>
        <button type="button" className="btn" onClick={() => setAddEventOpen(true)}>
          + Add Event
        </button>
      </div>

      <section className="card calendar-card">
        <div className="calendar-toolbar">
          <div className="calendar-toolbar-left">
            <button type="button" className="btn btn-outline" onClick={goToday}>
              Today
            </button>
            <button type="button" className="calendar-nav-btn" onClick={goPrev} aria-label="Previous">
              ‹
            </button>
            <button type="button" className="calendar-nav-btn" onClick={goNext} aria-label="Next">
              ›
            </button>
            <h2 className="calendar-title">{title}</h2>
          </div>
          <div className="calendar-view-switch">
            {VIEW_OPTIONS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={`calendar-view-btn${view === v ? " active" : ""}`}
                onClick={() => changeView(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="calendar-controls-row">
          <div className="search calendar-search">
            <span>⌕</span>
            <input
              placeholder="Search by case number, client, party, or event title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="calendar-filters">
            {EVENT_TYPES.map((type) => {
              const meta = EVENT_META[type];
              const Icon = meta.Icon;
              const active = types[type];
              return (
                <button
                  key={type}
                  type="button"
                  className={`calendar-filter-chip${active ? " active" : ""}`}
                  style={active ? { borderColor: meta.hex, color: meta.hex, background: `${meta.hex}17` } : undefined}
                  onClick={() => toggleType(type)}
                >
                  <Icon size={13} strokeWidth={2.2} aria-hidden="true" /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lexify-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            height="auto"
            events={fcEvents}
            eventContent={renderEventContent}
            dayCellClassNames={dayCellHighlightClassNames}
            dayHeaderClassNames={dayHeaderHighlightClassNames}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            firstDay={1}
          />
        </div>
      </section>

      <DayEventsPanel
        open={!!panelDate}
        date={panelDate}
        events={panelDate ? eventsByDate.get(panelDate) || [] : []}
        onClose={() => setPanelDate(null)}
      />

      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />
    </div>
  );
}
