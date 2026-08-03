"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useCases } from "@/components/cases/CasesContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { TODAY } from "@/data/cases";
import { buildCalendarEvents, filterEvents, groupEventsByDate, toISODate, EVENT_META, EVENT_TYPES } from "./eventAggregation";
import DayEventsPanel from "./DayEventsPanel";
import AddEventModal from "./AddEventModal";
import MiniCalendar from "./MiniCalendar";
import SmartRemindersCard from "@/components/intelligence/SmartRemindersCard";

const VIEW_OPTIONS = [
  ["dayGridMonth", "Month"],
  ["timeGridWeek", "Week"],
  ["timeGridDay", "Day"],
];

const TODAY_DATE = new Date(`${TODAY}T00:00:00`);
const TODAY_ISO = toISODate(TODAY_DATE);

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
  const { tasks } = useTasks();
  const calendarRef = useRef(null);

  const [view, setView] = useState("dayGridMonth");
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState({ case: true, appointment: true, task: true, deadline: true });
  const [panelDate, setPanelDate] = useState(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(TODAY_DATE);
  const [selectedDate, setSelectedDate] = useState(null);

  const allEvents = useMemo(() => buildCalendarEvents({ cases, appointments, tasks }), [cases, appointments, tasks]);
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

  // Single source of truth for month sync: every navigation on the main
  // calendar (prev/next/today/view switch/gotoDate) fires datesSet, which
  // updates currentDate — the mini calendar always just renders that month,
  // so the two never drift independently of each other.
  function handleDatesSet(arg) {
    setTitle(arg.view.title);
    setCurrentDate(arg.view.currentStart);
  }

  function handleDateClick(info) {
    const dateStr = toISODate(info.date);
    setSelectedDate(dateStr);
    setPanelDate(dateStr);
  }

  function handleEventClick(info) {
    info.jsEvent.preventDefault();
    router.push(info.event.extendedProps.href);
  }

  function toggleType(type) {
    setTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  function handleMiniSelectDate(dateStr) {
    setSelectedDate(dateStr);
    setPanelDate(dateStr);
    calendarRef.current?.getApi().gotoDate(dateStr);
  }

  function handleMiniNavigate(direction) {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    calendarRef.current?.getApi().gotoDate(next);
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

      <div className="calendar-layout">
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
              initialDate={TODAY}
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

        <MiniCalendar
          currentDate={currentDate}
          selectedDate={selectedDate}
          todayISO={TODAY_ISO}
          hasEvents={(dateStr) => eventsByDate.has(dateStr)}
          onSelectDate={handleMiniSelectDate}
          onNavigate={handleMiniNavigate}
        />
      </div>

      <SmartRemindersCard />

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
