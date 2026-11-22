import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import TaskDetailsWorkspace from "@/components/tasks/TaskDetailsWorkspace";

export default function TaskDetailsPage() {
  return (
    <AppShell>
      <Topbar />
      <TaskDetailsWorkspace />
    </AppShell>
  );
}
