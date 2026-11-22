"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";

const StaffDirectoryContext = createContext(null);

// Real active-profile roster for assignee pickers (Task/Appointment forms),
// replacing the hardcoded TEAM_MEMBERS list from data/team.js — so a user
// an admin invites in Phase 1's Admin → Users is actually assignable, not
// just able to log in.
export function StaffDirectoryProvider({ children }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/staff")
      .then(({ data }) => {
        if (!cancelled) setStaff(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <StaffDirectoryContext.Provider value={{ staff, loading }}>{children}</StaffDirectoryContext.Provider>;
}

export function useStaffDirectory() {
  const ctx = useContext(StaffDirectoryContext);
  if (!ctx) throw new Error("useStaffDirectory must be used within a StaffDirectoryProvider");
  return ctx;
}
