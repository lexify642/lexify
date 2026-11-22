"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AppointmentsContext = createContext(null);

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

// Backed by Supabase (app/api/appointments/*) instead of the old
// useState(initialAppointments) seed — same convention as CasesContext/
// TasksContext. Every method keeps its exact original signature, so the
// Calendar, the appointment details page, and AddEventModal all keep
// working unmodified.
export function AppointmentsProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/appointments")
      .then((data) => {
        if (!cancelled) setAppointments(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function addAppointment(data) {
    const tempId = `appt-${Date.now()}`;
    const entry = { id: tempId, ...data };
    setAppointments((prev) => [entry, ...prev]);

    fetchJson("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then((created) => {
        setAppointments((prev) => prev.map((a) => (a.id === tempId ? created : a)));
      })
      .catch((err) => console.error("[AppointmentsContext] create failed", err));

    return entry;
  }

  function updateAppointment(id, data) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    fetchJson(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((err) => console.error("[AppointmentsContext] update failed", err));
  }

  function deleteAppointment(id) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    fetchJson(`/api/appointments/${id}`, { method: "DELETE" }).catch((err) => console.error("[AppointmentsContext] delete failed", err));
  }

  return (
    <AppointmentsContext.Provider value={{ appointments, setAppointments, addAppointment, updateAppointment, deleteAppointment, loading, error }}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used within an AppointmentsProvider");
  return ctx;
}
