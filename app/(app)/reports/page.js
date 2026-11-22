import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import AdvocateWorkloadCard from "@/components/intelligence/AdvocateWorkloadCard";
import ProductivityAnalyticsCard from "@/components/intelligence/ProductivityAnalyticsCard";
import RecentActivityCard from "@/components/intelligence/RecentActivityCard";

// Team-level reporting moved off the Dashboard so the Dashboard stays a
// "what needs doing today" page.
export default function ReportsPage() {
  return (
    <AppShell>
      <Topbar />
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">Team workload, productivity and recent activity.</p>
          </div>
        </div>
        <div className="dashboard-grid">
          <AdvocateWorkloadCard />
          <ProductivityAnalyticsCard />
          <section style={{ gridColumn: "1/-1" }}>
            <RecentActivityCard limit={20} />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
