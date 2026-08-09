import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import DraftEditorWorkspace from "@/components/draft/DraftEditorWorkspace";
import SaveDraftButton from "@/components/draft/SaveDraftButton";

export default function DraftPage() {
  return (
    <AppShell>
      <Topbar>
        <SaveDraftButton className="btn btn-soft" />
      </Topbar>
      <DraftEditorWorkspace />
    </AppShell>
  );
}
