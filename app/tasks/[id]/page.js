import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import TaskDetailsWorkspace from "@/components/tasks/TaskDetailsWorkspace";

export default function TaskDetailsPage() {
  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <TaskDetailsWorkspace />
    </AppShell>
  );
}
