import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import ClauseBank from "@/components/draft/ClauseBank";

export default function ClauseBankPage() {
  return (
    <AppShell>
      <Topbar />
      <div className="page">
        <ClauseBank />
      </div>
    </AppShell>
  );
}
