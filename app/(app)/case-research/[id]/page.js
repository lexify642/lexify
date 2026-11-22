"use client";

import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import CaseResearchDetail from "@/components/case-research/CaseResearchDetail";

export default function CaseResearchDetailPage({ params }) {
  const { id } = use(params);
  return (
    <AppShell>
      <Topbar />
      <CaseResearchDetail caseId={id} />
    </AppShell>
  );
}
