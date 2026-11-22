import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import ReviewDashboard from "@/components/draft/ReviewDashboard";

export default function ReviewDashboardPage() {
  return (
    <AppShell>
      <Topbar />
      <ReviewDashboard />
    </AppShell>
  );
}
