import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import ClientDirectoryWorkspace from "@/components/clients/ClientDirectoryWorkspace";

export default function ClientsPage() {
  return (
    <AppShell>
      <Topbar />
      <Suspense fallback={<div className="page">Loading…</div>}>
        <ClientDirectoryWorkspace />
      </Suspense>
    </AppShell>
  );
}
