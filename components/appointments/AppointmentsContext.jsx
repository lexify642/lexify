"use client";

import { createContext, useContext, useState } from "react";
import { initialAppointments } from "@/data/appointments";

const AppointmentsContext = createContext(null);

// Shared, in-memory (no backend) session store for appointments — same
// convention as CasesContext.jsx, so the Calendar, the appointment details
// page, and any future callers all see the same data.
export function AppointmentsProvider({ children }) {
  const [appointments, setAppointments] = useState(initialAppointments);

  function addAppointment(data) {
    const entry = { id: `appt-${Date.now()}`, ...data };
    setAppointments((prev) => [entry, ...prev]);
    return entry;
  }

  function updateAppointment(id, data) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }

  function deleteAppointment(id) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <AppointmentsContext.Provider value={{ appointments, setAppointments, addAppointment, updateAppointment, deleteAppointment }}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used within an AppointmentsProvider");
  return ctx;
}
