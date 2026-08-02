"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTasks } from "./TasksContext";
import { useCases } from "@/components/cases/CasesContext";
import TaskModal from "./TaskModal";
import { TASK_STATUSES, PRIORITY_OPTIONS, toneForTaskStatus, toneForPriority, dueCategory } from "@/data/tasks";
import { TEAM_MEMBERS } from "@/data/team";
import { displayDate } from "@/components/cases/utils";

const DUE_FILTER_LABELS = { today: "Due Today", overdue: "Overdue", upcoming: "Upcoming", completed: "Recently Completed" };

export default function TaskListWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, addTask } = useTasks();
  const { cases } = useCases();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [caseFilter, setCaseFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dueFilter, setDueFilter] = useState(searchParams.get("due") || "");
  const [sortDir, setSortDir] = useState("asc");
  const [addOpen, setAddOpen] = useState(false);

  const rows = useMemo(() => {
    return tasks.map((t) => {
      const linkedCase = t.caseNo ? cases.find((c) => c.no === t.caseNo) : null;
      return { ...t, caseNumber: linkedCase?.number ?? "", clientNameResolved: linkedCase?.client?.name || t.clientName || "" };
    });
  }, [tasks, cases]);

  const clientOptions = useMemo(() => {
    const names = new Set(rows.map((r) => r.clientNameResolved).filter(Boolean));
    return Array.from(names).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = rows.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter && t.assignedToName !== assigneeFilter) return false;
      if (caseFilter && t.caseNo !== caseFilter) return false;
      if (clientFilter && t.clientNameResolved !== clientFilter) return false;
      if (dueFilter === "completed" && t.status !== "Completed") return false;
      if (["today", "overdue", "upcoming"].includes(dueFilter) && dueCategory(t) !== dueFilter) return false;
      if (term) {
        const haystack = `${t.title} ${t.caseNumber} ${t.clientNameResolved} ${t.assignedToName} ${t.assignedByName}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      const cmp = (a.dueDate || "").localeCompare(b.dueDate || "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, search, statusFilter, priorityFilter, assigneeFilter, caseFilter, clientFilter, dueFilter, sortDir]);

  function handleAddTask(data) {
    addTask(data);
    setAddOpen(false);
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">TASK MANAGEMENT</p>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Every task across the Case Diary and Calendar, in one place.</p>
        </div>
        <button className="btn" onClick={() => setAddOpen(true)}>
          + New Task
        </button>
      </div>

      <section className="card">
        <div className="library-controls task-filter-row">
          <div className="search">
            <span>⌕</span>
            <input
              placeholder="Search by title, case number, client, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="">All Statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Filter by priority">
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} aria-label="Filter by assigned person">
            <option value="">All Assignees</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <select value={caseFilter} onChange={(e) => setCaseFilter(e.target.value)} aria-label="Filter by case">
            <option value="">All Cases</option>
            {cases.map((c) => (
              <option key={c.no} value={c.no}>
                {c.number}
              </option>
            ))}
          </select>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} aria-label="Filter by client">
            <option value="">All Clients</option>
            {clientOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-outline" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
            Due Date {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
        {dueFilter && (
          <p className="library-summary">
            <span className="badge blue">{DUE_FILTER_LABELS[dueFilter] ?? dueFilter}</span>{" "}
            <button type="button" className="link" onClick={() => setDueFilter("")}>
              Clear ×
            </button>
          </p>
        )}
        <p className="library-summary">
          Showing {filtered.length} of {tasks.length} tasks.
        </p>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Case Number</th>
                <th>Client Name</th>
                <th>Assigned By</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr className="case-row" tabIndex={0} key={t.id} onClick={() => router.push(`/tasks/${t.id}`)}>
                  <td>
                    <strong>{t.title}</strong>
                  </td>
                  <td>{t.caseNumber || "—"}</td>
                  <td>{t.clientNameResolved || "—"}</td>
                  <td>{t.assignedByName}</td>
                  <td>{t.assignedToName}</td>
                  <td>
                    <span className={`badge ${toneForPriority(t.priority)}`}>{t.priority}</span>
                  </td>
                  <td>{t.dueDate ? displayDate(t.dueDate) : "—"}</td>
                  <td>
                    <span className={`badge ${toneForTaskStatus(t.status)}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="no-cases">
            <b>No tasks found</b>
            <span>Try a different search or clear your filters.</span>
          </div>
        )}
      </section>

      <TaskModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddTask} />
    </div>
  );
}
