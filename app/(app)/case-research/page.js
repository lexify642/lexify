import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import CaseResearchWorkspace from "@/components/case-research/CaseResearchWorkspace";

export default function CaseResearchPage() {
  return (
    <AppShell>
      <Topbar />
      <Suspense fallback={<div className="page">Loading…</div>}>
        <CaseResearchWorkspace />
      </Suspense>
    </AppShell>
  );
}
