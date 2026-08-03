"use client";

import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { CURRENT_USER } from "@/data/team";
import { computeDailyBrief } from "./dailyBrief";

export default function DailyBriefCard() {
  const { cases, auditLog } = useCases();
  const { tasks } = useTasks();
  const { appointments } = useAppointments();
  const { attachments } = useAttachments();

  const brief = computeDailyBrief({ cases, tasks, appointments, attachments, auditLog, currentUser: CURRENT_USER });
  const c = brief.counts;

  return (
    <section className="card daily-brief-card animate-appear">
      <h2 className="section-title">{brief.greeting}</h2>
      <p className="page-subtitle" style={{ margin: "6px 0 14px" }}>
        Today you have:
      </p>
      <ul className="case-health-list">
        <li>• {c.hearingsToday} Hearing{c.hearingsToday === 1 ? "" : "s"}</li>
        <li>• {c.clientMeetingsToday} Client Meeting{c.clientMeetingsToday === 1 ? "" : "s"}</li>
        <li>• {c.pendingTasks} Pending Task{c.pendingTasks === 1 ? "" : "s"}</li>
        <li>• {c.filingsDueToday} Filing{c.filingsDueToday === 1 ? "" : "s"} Due Today</li>
        <li>• {c.docsAwaitingReview} Document{c.docsAwaitingReview === 1 ? "" : "s"} Awaiting Review</li>
      </ul>
      {brief.priorityAlerts.length > 0 && (
        <>
          <h4 style={{ margin: "18px 0 8px", fontSize: 13, color: "var(--muted)" }}>Priority Alerts</h4>
          <ul className="case-health-list issues">
            {brief.priorityAlerts.map((a, i) => (
              <li key={i}>• {a}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
