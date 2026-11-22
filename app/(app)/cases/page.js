import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import CaseDiary from "@/components/cases/CaseDiary";

export default function CasesPage() {
  return (
    <AppShell>
      <Topbar />
      <CaseDiary />
    </AppShell>
  );
}
