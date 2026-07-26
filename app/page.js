import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";

const STATS = [
  { icon: "▤", tone: "", number: 300, label: "Open Cases" },
  { icon: "!", tone: "red", number: 20, label: "High Priority" },
  { icon: "◷", tone: "orange", number: 58, label: "Upcoming Hearings" },
  { icon: "✓", tone: "green", number: 12, label: "Tasks Due Soon" },
];

const HEARINGS = [
  {
    day: "24",
    month: "JUL",
    title: "ABC Corp. vs. XYZ Ltd.",
    meta: "Supreme Court · Court Room 4 · 10:30 AM",
    badge: "Hearing",
    tone: "blue",
  },
  {
    day: "25",
    month: "JUL",
    title: "Mehta Industries vs. Union of India",
    meta: "Bombay High Court · Court Room 12 · 11:00 AM",
    badge: "Arguments",
    tone: "blue",
  },
  {
    day: "26",
    month: "JUL",
    title: "State vs. R. Khanna",
    meta: "Sessions Court · Court Room 7 · 02:15 PM",
    badge: "Evidence",
    tone: "orange",
  },
];

const DEADLINES = [
  {
    icon: "!",
    tone: "red",
    title: "Submit written statement",
    meta: "ABC Corp. vs. XYZ Ltd. · Due tomorrow",
  },
  {
    icon: "◷",
    tone: "orange",
    title: "Review counter affidavit",
    meta: "Mehta Industries · Due in 3 days",
  },
  {
    icon: "✓",
    tone: "green",
    title: "Client document collection",
    meta: "R. Khanna matter · Due in 5 days",
  },
];

const RECENT_CASES = [
  {
    matter: "ABC Corp. vs. XYZ Ltd.",
    number: "CS/1245/2024",
    court: "Supreme Court",
    nextDate: "24 Jul 2026",
    stage: "Final Hearing",
    status: "Active",
  },
  {
    matter: "Chevron Inc. vs. State of California",
    number: "WP/890/2025",
    court: "High Court",
    nextDate: "29 Jul 2026",
    stage: "Notice",
    status: "Active",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Here is what is happening with your matters today.</p>
          </div>
          <button className="btn">+ File Case</button>
        </div>

        <section className="welcome">
          <h2>Welcome John</h2>
          <p>Manage your practice, stay ahead of deadlines, and make every case count.</p>
        </section>

        <section className="stats-grid">
          {STATS.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className={`stat-icon${stat.tone ? ` ${stat.tone}` : ""}`}>{stat.icon}</div>
              <div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </section>

        <div className="actions">
          <button className="action-btn">
            <b>+</b>File Case
          </button>
          <Link className="action-btn" href="/draft">
            <b>✦</b>Generate Notices
          </Link>
          <Link className="action-btn" href="/lexi-ai">
            <b>⌕</b>Legal Research
          </Link>
          <Link className="action-btn" href="/calculator">
            <b>₹</b>Calculate Court Fees
          </Link>
        </div>

        <div className="dashboard-grid">
          <section className="card">
            <div className="section-head">
              <h2 className="section-title">Upcoming Hearings</h2>
              <Link className="link" href="/cases">
                View calendar →
              </Link>
            </div>
            {HEARINGS.map((hearing) => (
              <div className="list-item" key={hearing.title}>
                <div className="date-box">
                  {hearing.day}
                  <small>{hearing.month}</small>
                </div>
                <div className="item-main">
                  <strong>{hearing.title}</strong>
                  <span>{hearing.meta}</span>
                </div>
                <span className={`badge ${hearing.tone}`}>{hearing.badge}</span>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="section-head">
              <h2 className="section-title">Approaching Deadlines</h2>
              <Link className="link" href="/cases">
                View all →
              </Link>
            </div>
            {DEADLINES.map((deadline) => (
              <div className="list-item" key={deadline.title}>
                <div className={`stat-icon ${deadline.tone}`}>{deadline.icon}</div>
                <div className="item-main">
                  <strong>{deadline.title}</strong>
                  <span>{deadline.meta}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="card" style={{ gridColumn: "1/-1" }}>
            <div className="section-head">
              <h2 className="section-title">Recent Cases</h2>
              <Link className="link" href="/cases">
                View all cases →
              </Link>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Matter</th>
                    <th>Court</th>
                    <th>Next Date</th>
                    <th>Stage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_CASES.map((row) => (
                    <tr key={row.number}>
                      <td>
                        <strong>{row.matter}</strong>
                        <br />
                        <small>{row.number}</small>
                      </td>
                      <td>{row.court}</td>
                      <td>{row.nextDate}</td>
                      <td>{row.stage}</td>
                      <td>
                        <span className="badge green">{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
