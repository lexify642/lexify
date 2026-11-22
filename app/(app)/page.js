"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import CaseModal from "@/components/cases/CaseModal";
import TaskModal from "@/components/tasks/TaskModal";
import { useCases } from "@/components/cases/CasesContext";
import { useCaseActions } from "@/components/cases/useCaseActions";
import { useTasks } from "@/components/tasks/TasksContext";
import { canUpdateStatus } from "@/components/tasks/permissions";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { useChat } from "@/components/chat/ChatContext";
import { useStaffDirectory } from "@/components/staff/StaffDirectoryContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { displayDate } from "@/components/cases/utils";
import { computeDashboard, searchWorkspace, localISODate } from "@/components/dashboard/dashboardData";
import { daysAgo } from "@/components/intelligence/shared";

// Read the clock on the client only (the server may sit in another time
// zone), and roll over at local midnight so "today" never goes stale.
function useNow() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    let timer;
    function tick() {
      const current = new Date();
      setNow(current);
      const nextMidnight = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 5);
      timer = setTimeout(tick, nextMidnight - current);
    }
    tick();
    return () => clearTimeout(timer);
  }, []);
  return now;
}

function greetingFor(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function dueLabel(task, today) {
  const late = daysAgo(task.dueDate, today);
  if (late > 0) return `${plural(late, "day")} overdue`;
  return task.dueTime ? `Due today, ${task.dueTime}` : "Due today";
}

function daysLeftLabel(daysLeft) {
  if (daysLeft < 0) return `${plural(-daysLeft, "day")} late`;
  if (daysLeft === 0) return "Today";
  return `${plural(daysLeft, "day")} left`;
}

function daysLeftTone(daysLeft) {
  if (daysLeft <= 2) return "red";
  if (daysLeft <= 7) return "orange";
  return "green";
}

function Panel({ title, count, linkHref, linkLabel, children }) {
  return (
    <section className="dash-card">
      <div className="dash-card-head">
        <h2>
          {title}
          {typeof count === "number" && <span className="dash-count-chip">{count}</span>}
        </h2>
        <Link className="dash-link" href={linkHref}>
          {linkLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="dash-empty">{children}</p>;
}

export default function DashboardPage() {
  const now = useNow();
  const today = now ? localISODate(now) : null;
  const currentUser = useCurrentUser();

  const { cases, loading: casesLoading } = useCases();
  const { tasks, addTask, updateTaskStatus, loading: tasksLoading } = useTasks();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { messages, loading: chatLoading } = useChat();
  const { staff, loading: staffLoading } = useStaffDirectory();
  const staffNames = useMemo(() => [currentUser.name, ...staff.map((p) => p.full_name)], [staff, currentUser.name]);
  const loading = !today || casesLoading || tasksLoading || appointmentsLoading || chatLoading || staffLoading;

  const data = useMemo(
    () => (today ? computeDashboard({ cases, tasks, appointments, messages, staffNames }, today) : null),
    [cases, tasks, appointments, messages, staffNames, today]
  );

  const [query, setQuery] = useState("");
  const results = useMemo(() => searchWorkspace({ cases, tasks }, query), [cases, tasks, query]);

  const { modal, openModal, closeModal, initialValues, handleModalSubmit, toast: caseToast } = useCaseActions(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  function showToast(next) {
    clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function completeTask(task) {
    showToast({ message: `Marked “${task.title}” as done.`, undo: { id: task.id, status: task.status } });
    updateTaskStatus(task.id, "Completed", "Marked done from the dashboard.");
  }

  function undoComplete({ id, status }) {
    setToast(null);
    updateTaskStatus(id, status, "Reopened from the dashboard.");
  }

  const caseByNo = useMemo(() => new Map(cases.map((c) => [c.no, c])), [cases]);
  const taskRows = data ? [...data.overdueTasks, ...data.dueTodayTasks] : [];

  const tiles = [
    { key: "hearings", label: "Hearings today", value: data?.counts.hearingsToday, href: "/calendar" },
    { key: "overdue", label: "Tasks overdue", value: data?.counts.tasksOverdue, href: "/tasks?due=overdue", alert: true },
    { key: "today", label: "Due today", value: data?.counts.dueToday, href: "/tasks?due=today" },
    { key: "clients", label: "Clients waiting for reply", value: data?.counts.clientsWaiting, href: "/chat" },
  ];

  return (
    <AppShell>
      <Topbar />
      <div className="page dash">
        <header className="dash-header">
          <div className="dash-greeting">
            <h1>{now ? `${greetingFor(now)}, ${currentUser.name.split(" ")[0]}` : " "}</h1>
            <p>
              {now
                ? now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : " "}
            </p>
          </div>

          <div className="dash-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search cases, parties, clients, tasks…"
              aria-label="Search cases, parties, clients and tasks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            />
            {query.trim().length >= 2 && (
              <div className="dash-search-results" role="listbox">
                {results.length ? (
                  results.map((r) => (
                    <Link key={r.key} href={r.href} className="dash-search-hit" role="option" aria-selected="false">
                      <span className="dash-kind">{r.kind}</span>
                      <span className="dash-hit-main">
                        <strong>{r.title}</strong>
                        {r.meta && <small>{r.meta}</small>}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="dash-empty">No matches for “{query.trim()}”.</p>
                )}
              </div>
            )}
          </div>

          <div className="dash-actions">
            <button type="button" className="dash-btn" onClick={() => openModal("case")}>
              + Add case
            </button>
            <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setTaskModalOpen(true)}>
              + New task
            </button>
          </div>
        </header>

        <section className="dash-tiles" aria-label="Today at a glance">
          {tiles.map((t) => (
            <Link key={t.key} href={t.href} className={`dash-tile${t.alert && t.value > 0 ? " is-alert" : ""}`}>
              <b>{loading ? "–" : t.value}</b>
              <span>{t.label}</span>
            </Link>
          ))}
        </section>

        <div className="dash-columns">
          <div className="dash-col">
            <Panel title="Today's hearings" count={loading ? undefined : data.hearingsToday.length} linkHref="/calendar" linkLabel="Calendar">
              {loading ? (
                <Empty>Loading…</Empty>
              ) : data.hearingsToday.length ? (
                <ul className="dash-list">
                  {data.hearingsToday.map((h) => (
                    <li key={h.caseNo}>
                      <Link href={h.href} className="dash-hearing">
                        <span className="dash-time">{h.time || "—"}</span>
                        <span className="dash-row-main">
                          <strong>{h.parties}</strong>
                          <small>
                            {[h.number, h.court].filter(Boolean).join(" · ")}
                          </small>
                          <small>
                            {h.room || "Court room —"} · Item {h.itemNo || "—"}
                          </small>
                        </span>
                        {h.stage && <span className="dash-pill">{h.stage}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No hearings listed for today.</Empty>
              )}
            </Panel>

            <Panel title="Overdue & due today" count={loading ? undefined : taskRows.length} linkHref="/tasks" linkLabel="All tasks">
              {loading ? (
                <Empty>Loading…</Empty>
              ) : taskRows.length ? (
                <ul className="dash-list">
                  {taskRows.map((t) => {
                    const allowed = canUpdateStatus(t, currentUser);
                    const overdue = t.dueDate < today;
                    const linkedCase = t.caseNo ? caseByNo.get(t.caseNo) : null;
                    return (
                      <li key={t.id} className="dash-task">
                        <input
                          type="checkbox"
                          className="dash-check"
                          checked={false}
                          disabled={!allowed}
                          onChange={() => completeTask(t)}
                          aria-label={`Mark “${t.title}” as done`}
                          title={allowed ? "Mark as done" : "Only the assignee or a senior advocate can complete this task"}
                        />
                        <Link href={`/tasks/${t.id}`} className="dash-row-main">
                          <strong>{t.title}</strong>
                          <small>
                            {[linkedCase?.number || t.clientName, t.assignedToName].filter(Boolean).join(" · ")}
                          </small>
                        </Link>
                        <span className={`dash-pill ${overdue ? "red" : "orange"}`}>{dueLabel(t, today)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty>Nothing overdue or due today.</Empty>
              )}
            </Panel>
          </div>

          <div className="dash-col">
            <Panel title="Clients waiting for a reply" count={loading ? undefined : data.clientsWaiting.length} linkHref="/chat" linkLabel="Messages">
              {loading ? (
                <Empty>Loading…</Empty>
              ) : data.clientsWaiting.length ? (
                <ul className="dash-list">
                  {data.clientsWaiting.map((c) => (
                    <li key={c.clientName}>
                      <Link href={c.href} className="dash-row">
                        <span className="dash-row-main">
                          <strong>{c.clientName}</strong>
                          <small className="dash-clip">{c.preview}</small>
                        </span>
                        <span className={`dash-pill ${c.waitingDays >= 2 ? "red" : "orange"}`}>
                          {c.waitingDays > 0 ? `${plural(c.waitingDays, "day")}` : "Today"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No client is waiting on a reply.</Empty>
              )}
            </Panel>

            <Panel title="Filing & limitation deadlines" count={loading ? undefined : data.deadlines.length} linkHref="/calendar" linkLabel="Calendar">
              {loading ? (
                <Empty>Loading…</Empty>
              ) : data.deadlines.length ? (
                <ul className="dash-list">
                  {data.deadlines.map((d) => (
                    <li key={d.id}>
                      <Link href={d.href} className="dash-row">
                        <span className="dash-row-main">
                          <strong>{d.title}</strong>
                          <small>
                            {[d.kind, d.caseLabel, displayDate(d.date)].filter(Boolean).join(" · ")}
                          </small>
                        </span>
                        <span className={`dash-pill ${daysLeftTone(d.daysLeft)}`}>{daysLeftLabel(d.daysLeft)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No filing or limitation dates in the next 30 days.</Empty>
              )}
            </Panel>

            <Panel title="New matters not assigned" count={loading ? undefined : data.unassignedMatters.length} linkHref="/cases" linkLabel="All cases">
              {loading ? (
                <Empty>Loading…</Empty>
              ) : data.unassignedMatters.length ? (
                <ul className="dash-list">
                  {data.unassignedMatters.map((m) => (
                    <li key={m.caseNo}>
                      <Link href={m.href} className="dash-row">
                        <span className="dash-row-main">
                          <strong>{m.parties}</strong>
                          <small>{[m.number, m.court].filter(Boolean).join(" · ")}</small>
                        </span>
                        <span className="dash-pill">Assign</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Every open matter has an advocate.</Empty>
              )}
            </Panel>
          </div>
        </div>
      </div>

      <CaseModal modal={modal} initialValues={initialValues} onClose={closeModal} onSubmit={handleModalSubmit} />
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={(task) => {
          addTask(task);
          setTaskModalOpen(false);
        }}
      />

      <div className={`toast${toast || caseToast.visible ? " show" : ""} dash-toast`} role="status">
        {toast ? (
          <>
            {toast.message}
            {toast.undo && (
              <button type="button" onClick={() => undoComplete(toast.undo)}>
                Undo
              </button>
            )}
          </>
        ) : (
          caseToast.message
        )}
      </div>
    </AppShell>
  );
}
