import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import TaskListWorkspace from "@/components/tasks/TaskListWorkspace";

export default function TasksPage() {
  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <Suspense fallback={<div className="page">Loading…</div>}>
        <TaskListWorkspace />
      </Suspense>
    </AppShell>
  );
}
