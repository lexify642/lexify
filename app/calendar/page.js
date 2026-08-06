"use client";

import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";

// FullCalendar doesn't support server-side rendering, so it must be loaded
// client-only to avoid breaking the production build's static prerendering.
const CalendarWorkspace = dynamic(() => import("@/components/calendar/CalendarWorkspace"), {
  ssr: false,
  loading: () => <div className="page">Loading calendar…</div>,
});

export default function CalendarPage() {
  return (
    <AppShell>
      <Topbar />
      <CalendarWorkspace />
    </AppShell>
  );
}
