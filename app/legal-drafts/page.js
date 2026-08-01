import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import LegalDraftsDirectoryWorkspace from "@/components/legal-drafts/LegalDraftsDirectoryWorkspace";

export default function LegalDraftsPage() {
  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <LegalDraftsDirectoryWorkspace />
    </AppShell>
  );
}
