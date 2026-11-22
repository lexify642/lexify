"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { useCases } from "@/components/cases/CasesContext";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import { displayDate } from "@/components/cases/utils";
import { toneForEventStatus, toneForPriority } from "@/data/appointments";

export default function AppointmentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { appointments, updateAppointment, deleteAppointment } = useAppointments();
  const { cases } = useCases();
  const [editOpen, setEditOpen] = useState(false);

  const appointment = appointments.find((a) => a.id === id);
  const linkedCase = appointment?.caseNo ? cases.find((c) => c.no === appointment.caseNo) : null;
  const clientName = linkedCase ? linkedCase.client?.name : appointment?.clientName;

  function handleDelete() {
    if (!window.confirm("Delete this appointment?")) return;
    deleteAppointment(id);
    router.push("/calendar");
  }

  return (
    <AppShell>
      <Topbar />
      <div className="page">
        <div className="heading-row">
          <div>
            <p className="eyebrow">APPOINTMENT</p>
            <h1 className="page-title">{appointment?.title ?? "Appointment not found"}</h1>
            {appointment && <p className="page-subtitle">{appointment.eventType}</p>}
          </div>
          {appointment && (
            <div className="drawer-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditOpen(true)}>
                ✎ Edit
              </button>
              <button type="button" className="btn btn-outline danger-action" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>

        {appointment ? (
          <section className="card">
            <div className="event-badge-row">
              <span className={`badge ${toneForEventStatus(appointment.status)}`}>{appointment.status}</span>
              <span className={`badge ${toneForPriority(appointment.priority)}`}>{appointment.priority} priority</span>
            </div>

            <div className="matter-meta">
              <span>
                <b>{displayDate(appointment.date)}</b>
                {appointment.time}
              </span>
              <span>
                <b>{appointment.location || "—"}</b>
                Location
              </span>
              <span>
                <b>{appointment.eventType}</b>
                Event type
              </span>
              <span>
                <b>{appointment.assignedToName ? `${appointment.assignedToName} (${appointment.assignedToRole})` : "Unassigned"}</b>
                Assigned to
              </span>
              <span>
                <b>{appointment.reminder}{appointment.reminder === "Custom" && appointment.customReminderMinutes ? ` (${appointment.customReminderMinutes} min)` : ""}</b>
                Reminder
              </span>
              {clientName && (
                <span>
                  <b>{clientName}</b>
                  Client name
                </span>
              )}
            </div>

            {linkedCase && (
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <h3>Linked case</h3>
                </div>
                <div className="client-card">
                  <b>{linkedCase.parties}</b>
                  <span>{linkedCase.number} · {linkedCase.court}</span>
                  <span>Judge: {linkedCase.judge} · Stage: {linkedCase.stage}</span>
                  <Link className="link" href={`/cases/${linkedCase.no}`}>
                    View case →
                  </Link>
                </div>
              </div>
            )}

            <div className="drawer-section">
              <div className="drawer-section-title">
                <h3>Notes</h3>
              </div>
              {appointment.notes ? <div className="case-note">{appointment.notes}</div> : <div className="empty-inline">No additional notes.</div>}
            </div>
          </section>
        ) : (
          <div className="empty-inline">No appointment found for id {id}.</div>
        )}
      </div>

      <AppointmentModal
        open={editOpen}
        initialValues={appointment}
        onClose={() => setEditOpen(false)}
        onSubmit={(data) => {
          updateAppointment(id, data);
          setEditOpen(false);
        }}
      />
    </AppShell>
  );
}
