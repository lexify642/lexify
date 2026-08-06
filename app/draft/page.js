import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import LexiDraftWorkspace from "@/components/draft/LexiDraftWorkspace";
import SaveDraftButton from "@/components/draft/SaveDraftButton";
import GoBackButton from "@/components/draft/GoBackButton";

export default function DraftPage() {
  return (
    <AppShell>
      <Topbar leftSlot={<GoBackButton />}>
        <SaveDraftButton className="btn btn-soft" />
      </Topbar>
      <LexiDraftWorkspace />
    </AppShell>
  );
}
