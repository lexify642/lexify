"use client";

import { useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { displayDate } from "@/components/cases/utils";
import { TODAY } from "@/data/cases";
import { CURRENT_USER } from "@/data/team";
import { toneForTaskStatus, toneForPriority, dueCategory, isRecentlyCompleted } from "@/data/tasks";

const STATS = [
  { icon: "▤", tone: "", number: 300, label: "Open Cases" },
  { icon: "!", tone: "red", number: 20, label: "High Priority" },
  { icon: "◷", tone: "orange", number: 58, label: "Upcoming Hearings" },
  { icon: "✓", tone: "green", number: 12, label: "Tasks Due Soon" },
];

const HEARINGS = [
  {
    day: "24",
    month: "JUL",
    title: "ABC Corp. vs. XYZ Ltd.",
    meta: "Supreme Court · Court Room 4 · 10:30 AM",
    badge: "Hearing",
    tone: "blue",
  },
  {
    day: "25",
    month: "JUL",
    title: "Mehta Industries vs. Union of India",
    meta: "Bombay High Court · Court Room 12 · 11:00 AM",
    badge: "Arguments",
    tone: "blue",
  },
  {
    day: "26",
    month: "JUL",
    title: "State vs. R. Khanna",
    meta: "Sessions Court · Court Room 7 · 02:15 PM",
    badge: "Evidence",
    tone: "orange",
  },
];

function reminderTone(dueDate) {
  const days = (new Date(`${dueDate}T00:00:00`) - new Date(`${TODAY}T00:00:00`)) / 86400000;
  if (days <= 1) return { icon: "!", tone: "red" };
  if (days <= 4) return { icon: "◷", tone: "orange" };
  return { icon: "✓", tone: "green" };
}

const RECENT_CASES = [
  {
    matter: "ABC Corp. vs. XYZ Ltd.",
    number: "CS/1245/2024",
    court: "Supreme Court",
    nextDate: "24 Jul 2026",
    stage: "Final Hearing",
    status: "Active",
  },
  {
    matter: "Chevron Inc. vs. State of California",
    number: "WP/890/2025",
    court: "High Court",
    nextDate: "29 Jul 2026",
    stage: "Notice",
    status: "Active",
  },
];

export default function DashboardPage() {
  const { cases, setCases } = useCases();
  const { tasks } = useTasks();

  const reminders = useMemo(() => {
    return cases
      .flatMap((c) =>
        c.notes
          .filter((n) => n.isReminder && !n.completed && n.dueDate)
          .map((n) => ({ caseNo: c.no, parties: c.parties, note: n }))
      )
      .sort((a, b) => a.note.dueDate.localeCompare(b.note.dueDate));
  }, [cases]);

  function markReminderDone(caseNo, noteId) {
    setCases((prev) =>
      prev.map((c) =>
        c.no !== caseNo ? c : { ...c, notes: c.notes.map((n) => (n.id === noteId ? { ...n, completed: true } : n)) }
      )
    );
  }

  const dueToday = useMemo(() => tasks.filter((t) => dueCategory(t) === "today"), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter((t) => dueCategory(t) === "overdue"), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((t) => dueCategory(t) === "upcoming"), [tasks]);
  const recentlyCompleted = useMemo(() => tasks.filter((t) => isRecentlyCompleted(t)), [tasks]);

  const assignedToMe = useMemo(
    () =>
      tasks
        .filter((t) => t.assignedToName === CURRENT_USER.name && t.status !== "Completed" && t.status !== "Cancelled")
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")),
    [tasks]
  );
  const assignedByMe = useMemo(
    () =>
      tasks
        .filter((t) => t.assignedByName === CURRENT_USER.name && t.status !== "Completed" && t.status !== "Cancelled")
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")),
    [tasks]
  );

  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Here is what is happening with your matters today.</p>
          </div>
          <button className="btn">+ File Case</button>
        </div>

        <section className="welcome animate-appear">
          <h2>Welcome John</h2>
          <p>Manage your practice, stay ahead of deadlines, and make every case count.</p>
        </section>

        <section className="stats-grid animate-appear delay-1">
          {STATS.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className={`stat-icon${stat.tone ? ` ${stat.tone}` : ""}`}>{stat.icon}</div>
              <div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </section>

        <div className="actions">
          <button className="action-btn">
            <b>+</b>File Case
          </button>
          <Link className="action-btn" href="/draft">
            <b>✦</b>Generate Notices
          </Link>
          <Link className="action-btn" href="/lexi-ai">
            <b>⌕</b>Legal Research
          </Link>
          <Link className="action-btn" href="/calculator">
            <b>₹</b>Calculate Court Fees
          </Link>
          <Link className="action-btn" href="/clients">
            <b>◈</b>Clients &amp; Conflict Check
          </Link>
        </div>

        <div className="dashboard-grid">
          <section className="card">
            <div className="section-head">
              <h2 className="section-title">Upcoming Hearings</h2>
              <Link className="link" href="/cases">
                View calendar →
              </Link>
            </div>
            {HEARINGS.map((hearing) => (
              <div className="list-item" key={hearing.title}>
                <div className="date-box">
                  {hearing.day}
                  <small>{hearing.month}</small>
                </div>
                <div className="item-main">
                  <strong>{hearing.title}</strong>
                  <span>{hearing.meta}</span>
                </div>
                <span className={`badge ${hearing.tone}`}>{hearing.badge}</span>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="section-head">
              <h2 className="section-title">Reminders</h2>
              <Link className="link" href="/cases">
                View all →
              </Link>
            </div>
            {reminders.length ? (
              reminders.map(({ caseNo, parties, note }) => {
                const { icon, tone } = reminderTone(note.dueDate);
                return (
                  <div className="list-item" key={note.id}>
                    <div className={`stat-icon ${tone}`}>{icon}</div>
                    <div className="item-main">
                      <strong>{note.text}</strong>
                      <span>
                        {parties} · Due {displayDate(note.dueDate)}
                      </span>
                    </div>
                    <button type="button" className="link" onClick={() => markReminderDone(caseNo, note.id)}>
                      Mark done
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="empty-inline">No reminders due. Mark a note as a reminder from any case to see it here.</div>
            )}
          </section>

          <section className="card" style={{ gridColumn: "1/-1" }}>
            <div className="section-head">
              <h2 className="section-title">Task Overview</h2>
              <Link className="link" href="/tasks">
                View all tasks →
              </Link>
            </div>
            <div className="task-stat-tiles">
              <Link className="task-stat-tile" href="/tasks?due=today">
                <b>{dueToday.length}</b>
                Due Today
              </Link>
              <Link className="task-stat-tile" href="/tasks?due=overdue">
                <b>{overdueTasks.length}</b>
                Overdue
              </Link>
              <Link className="task-stat-tile" href="/tasks?due=upcoming">
                <b>{upcomingTasks.length}</b>
                Upcoming
              </Link>
              <Link className="task-stat-tile" href="/tasks?due=completed">
                <b>{recentlyCompleted.length}</b>
                Recently Completed
              </Link>
            </div>
            <div className="task-overview-lists">
              <div>
                <h4>Assigned to Me</h4>
                {assignedToMe.length ? (
                  assignedToMe.slice(0, 5).map((t) => (
                    <div className="list-item" key={t.id}>
                      <div className="item-main">
                        <strong>{t.title}</strong>
                        <span>Due {displayDate(t.dueDate)}</span>
                      </div>
                      <span className={`badge ${toneForPriority(t.priority)}`}>{t.priority}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-inline">Nothing assigned to you right now.</div>
                )}
              </div>
              <div>
                <h4>Assigned by Me</h4>
                {assignedByMe.length ? (
                  assignedByMe.slice(0, 5).map((t) => (
                    <div className="list-item" key={t.id}>
                      <div className="item-main">
                        <strong>{t.title}</strong>
                        <span>
                          {t.assignedToName} · Due {displayDate(t.dueDate)}
                        </span>
                      </div>
                      <span className={`badge ${toneForTaskStatus(t.status)}`}>{t.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-inline">You haven't assigned any open tasks.</div>
                )}
              </div>
            </div>
          </section>

          <section className="card" style={{ gridColumn: "1/-1" }}>
            <div className="section-head">
              <h2 className="section-title">Recent Cases</h2>
              <Link className="link" href="/cases">
                View all cases →
              </Link>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Matter</th>
                    <th>Court</th>
                    <th>Next Date</th>
                    <th>Stage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_CASES.map((row) => (
                    <tr key={row.number}>
                      <td>
                        <strong>{row.matter}</strong>
                        <br />
                        <small>{row.number}</small>
                      </td>
                      <td>{row.court}</td>
                      <td>{row.nextDate}</td>
                      <td>{row.stage}</td>
                      <td>
                        <span className="badge green">{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
