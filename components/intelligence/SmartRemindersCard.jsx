"use client";

import Link from "next/link";
import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { computeSmartReminders } from "./reminders";

// Reused as-is on Dashboard, Calendar, and Tasks — same card, same data,
// wherever it's dropped in.
export default function SmartRemindersCard({ limit = 8 }) {
  const { cases } = useCases();
  const { tasks } = useTasks();
  const { appointments } = useAppointments();
  const { attachments } = useAttachments();

  const items = computeSmartReminders({ cases, tasks, appointments, attachments }).slice(0, limit);

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">Smart Reminders</h2>
      </div>
      {items.length ? (
        items.map((item) => (
          <Link className="list-item" href={item.href} key={item.id}>
            <div className="stat-icon blue">◷</div>
            <div className="item-main">
              <strong>{item.label}</strong>
            </div>
          </Link>
        ))
      ) : (
        <div className="empty-inline">No reminders right now.</div>
      )}
    </section>
  );
}
