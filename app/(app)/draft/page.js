import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import DraftEditorWorkspace from "@/components/draft/DraftEditorWorkspace";

export default function DraftPage() {
  return (
    <AppShell>
      <Topbar />
      <DraftEditorWorkspace />
    </AppShell>
  );
}
