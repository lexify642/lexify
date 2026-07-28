"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import CaseResearchDetail from "@/components/case-research/CaseResearchDetail";

export default function CaseResearchDetailPage({ params }) {
  const { id } = use(params);
  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <CaseResearchDetail caseId={id} />
    </AppShell>
  );
}
