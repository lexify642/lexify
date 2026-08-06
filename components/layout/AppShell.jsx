import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">{children}</main>
      <BottomNav />
    </div>
  );
}
