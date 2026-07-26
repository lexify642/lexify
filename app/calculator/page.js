import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import FeeCalculator from "@/components/calculator/FeeCalculator";

export default function CalculatorPage() {
  return (
    <AppShell>
      <Topbar>
        <span>◌</span>
        <div className="avatar">JA</div>
      </Topbar>
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Court Fees &amp; Litigation Cost Calculator</h1>
            <p className="page-subtitle">
              Estimate filing fees and common litigation expenses for your matter.
            </p>
          </div>
        </div>
        <FeeCalculator />
      </div>
    </AppShell>
  );
}
