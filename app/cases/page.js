import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import CaseDiary from "@/components/cases/CaseDiary";

export default function CasesPage() {
  return (
    <AppShell>
      <Topbar>
        <span>◌</span>
        <div className="avatar">JA</div>
      </Topbar>
      <CaseDiary />
    </AppShell>
  );
}
