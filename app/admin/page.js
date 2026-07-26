import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";

const ADMIN_CARDS = [
  { symbol: "◔", label: "Users", meta: "Manage team members", metric: "42" },
  { symbol: "◔", label: "Clients", meta: "Organisations and contacts", metric: "348" },
  { symbol: "◔", label: "Permissions", meta: "Roles and access control" },
  { symbol: "◔", label: "Task Management", meta: "Task settings and assignments" },
  { symbol: "◔", label: "Workflows", meta: "Automations and stages" },
  { symbol: "◔", label: "Tags", meta: "Labels for matters" },
  { symbol: "◔", label: "Smart Fields", meta: "Custom data fields" },
  { symbol: "◔", label: "Billing", meta: "Plans and invoices" },
  { symbol: "◔", label: "Matter Types", meta: "Configure matter templates" },
];

const ACTIVITY_LOG = [
  {
    user: "John Anderson",
    role: "Administrator",
    activity: "Updated workflow: Civil Litigation",
    timestamp: "21 Jul 2026, 10:42 AM",
    ip: "103.21.244.18",
  },
  {
    user: "R. Sharma",
    role: "Associate",
    activity: "Created matter ABC Corp. vs. XYZ Ltd.",
    timestamp: "21 Jul 2026, 09:15 AM",
    ip: "103.21.244.31",
  },
  {
    user: "Priya Mehta",
    role: "Partner",
    activity: "Changed a client permission",
    timestamp: "20 Jul 2026, 05:31 PM",
    ip: "103.21.244.72",
  },
];

export default function AdminPage() {
  return (
    <AppShell>
      <Topbar searchPlaceholder="Search users, clients, settings...">
        <span>◌</span>
        <div className="avatar">JA</div>
      </Topbar>
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-subtitle">
              Manage your firm workspace, users and workflow configurations.
            </p>
          </div>
          <button className="btn">+ Invite User</button>
        </div>

        <section className="admin-grid">
          {ADMIN_CARDS.map((card) => (
            <a className="card admin-card" href="#" key={card.label}>
              <div className="card-symbol">{card.symbol}</div>
              <strong>{card.label}</strong>
              <span>{card.meta}</span>
              {card.metric && <b className="metric">{card.metric}</b>}
            </a>
          ))}
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <h2 className="section-title">Activity Log</h2>
              <p className="page-subtitle">Recent administration and security activity</p>
            </div>
            <a className="link" href="#">
              Download log ↓
            </a>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Activity</th>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_LOG.map((row) => (
                  <tr key={row.timestamp}>
                    <td>
                      <strong>{row.user}</strong>
                      <br />
                      <small>{row.role}</small>
                    </td>
                    <td>{row.activity}</td>
                    <td>{row.timestamp}</td>
                    <td>{row.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
