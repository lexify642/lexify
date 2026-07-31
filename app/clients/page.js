import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import ClientDirectoryWorkspace from "@/components/clients/ClientDirectoryWorkspace";

export default function ClientsPage() {
  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <ClientDirectoryWorkspace />
    </AppShell>
  );
}
