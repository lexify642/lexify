import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import TaskListWorkspace from "@/components/tasks/TaskListWorkspace";

export default function TasksPage() {
  return (
    <AppShell>
      <Topbar />
      <Suspense fallback={<div className="page">Loading…</div>}>
        <TaskListWorkspace />
      </Suspense>
    </AppShell>
  );
}
