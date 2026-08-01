import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import CalculatorEstimateWorkspace from "@/components/calculator/CalculatorEstimateWorkspace";

export default function CalculatorEstimatePage() {
  return (
    <AppShell>
      <Topbar searchPlaceholder="Search case, matter, parties, citation...">
        <button type="button" className="icon-btn" aria-label="Help">
          ?
        </button>
        <button type="button" className="icon-btn" aria-label="Notifications">
          🔔
        </button>
        <div className="avatar">JA</div>
      </Topbar>
      <div className="page">
        <CalculatorEstimateWorkspace />
      </div>
    </AppShell>
  );
}
