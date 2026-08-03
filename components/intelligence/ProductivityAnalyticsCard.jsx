"use client";

import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { computeProductivityToday } from "./productivity";

export default function ProductivityAnalyticsCard() {
  const { cases } = useCases();
  const { tasks } = useTasks();
  const { appointments } = useAppointments();
  const { attachments } = useAttachments();

  const p = computeProductivityToday({ cases, tasks, appointments, attachments });

  const tiles = [
    { label: "Tasks Completed Today", value: p.tasksCompletedToday },
    { label: "Hearings Today", value: p.hearingsAttendedToday },
    { label: "Documents Uploaded", value: p.documentsUploadedToday },
    { label: "Research Attached", value: p.researchAttachedToday },
    { label: "Drafts Completed", value: p.draftsCreatedToday },
    { label: "Client Meetings", value: p.clientMeetingsToday },
  ];

  return (
    <section className="card" style={{ gridColumn: "1/-1" }}>
      <div className="section-head">
        <h2 className="section-title">Productivity Analytics</h2>
        <span className="badge green">{p.productivityPercent}% Productive</span>
      </div>
      <div className="task-stat-tiles">
        {tiles.map((t) => (
          <div className="task-stat-tile" key={t.label}>
            <b>{t.value}</b>
            {t.label}
          </div>
        ))}
      </div>
    </section>
  );
}
