import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import DocumentLibraryWorkspace from "@/components/documents/DocumentLibraryWorkspace";

export default function DocumentsPage() {
  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <Suspense fallback={<div className="page">Loading…</div>}>
        <DocumentLibraryWorkspace />
      </Suspense>
    </AppShell>
  );
}
