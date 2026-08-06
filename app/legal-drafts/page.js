import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import LegalDraftsDirectoryWorkspace from "@/components/legal-drafts/LegalDraftsDirectoryWorkspace";

export default function LegalDraftsPage() {
  return (
    <AppShell>
      <Topbar />
      <Suspense fallback={<div className="page">Loading…</div>}>
        <LegalDraftsDirectoryWorkspace />
      </Suspense>
    </AppShell>
  );
}
