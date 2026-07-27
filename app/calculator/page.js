import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import FeeCalculator from "@/components/calculator/FeeCalculator";

export default function CalculatorPage() {
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
        <FeeCalculator />
      </div>
    </AppShell>
  );
}
