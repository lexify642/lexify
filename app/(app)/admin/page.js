"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import { fetchJson } from "@/lib/fetchJson";

// Config areas the audit surfaced (data/calculatorReference.js, Matter
// Types implied by editCaseFieldsConfig.js's CASE_CATEGORY_OPTIONS, Tags
// from caseDetails.tags, etc.) but that aren't wired to real tables yet —
// left visible so nothing disappears from the admin UI, just marked as not
// built yet rather than pretending they work.
const COMING_SOON_CARDS = [
  { label: "Workflows", meta: "Automations and stages" },
  { label: "Tags", meta: "Labels for matters" },
  { label: "Smart Fields", meta: "Custom data fields" },
  { label: "Billing", meta: "Plans and invoices" },
  { label: "Matter Types", meta: "Configure matter templates" },
];

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson("/api/admin/stats")
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <Topbar />
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-subtitle">Manage your firm workspace, users and workflow configurations.</p>
          </div>
          <Link href="/admin/users" className="btn">
            + Invite User
          </Link>
        </div>

        {error && <div className="otp-error">{error}</div>}

        <section className="admin-grid">
          <Link className="card admin-card" href="/admin/users">
            <div className="card-symbol">◔</div>
            <strong>Users</strong>
            <span>Manage team members</span>
            <b className="metric">{stats ? stats.totalUsers : "…"}</b>
          </Link>
          <div className="card admin-card">
            <div className="card-symbol">◔</div>
            <strong>Matters</strong>
            <span>All firm cases</span>
            <b className="metric">{stats ? stats.totalMatters : "…"}</b>
          </div>
          <Link className="card admin-card" href="/admin/users">
            <div className="card-symbol">◔</div>
            <strong>Permissions</strong>
            <span>Roles and access control</span>
          </Link>
          <Link className="card admin-card" href="/admin/legal-drafts">
            <div className="card-symbol">◔</div>
            <strong>Drafting Library</strong>
            <span>Legal draft categories</span>
            <b className="metric">{stats ? stats.totalLegalDraftCategories : "…"}</b>
          </Link>
          <Link className="card admin-card" href="/admin/clauses">
            <div className="card-symbol">◔</div>
            <strong>Clause Bank</strong>
            <span>Clause library entries</span>
            <b className="metric">{stats ? stats.totalClauses : "…"}</b>
          </Link>
          <Link className="card admin-card" href="/admin/deed-config">
            <div className="card-symbol">◔</div>
            <strong>Partnership Deed</strong>
            <span>Clause options, presets &amp; boilerplate</span>
          </Link>
          {COMING_SOON_CARDS.map((card) => (
            <div className="card admin-card admin-card-disabled" key={card.label}>
              <div className="card-symbol">◔</div>
              <strong>{card.label}</strong>
              <span>{card.meta} — coming soon</span>
            </div>
          ))}
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <h2 className="section-title">Activity Log</h2>
              <p className="page-subtitle">Recent administration and security activity</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Activity</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentActivity?.length ? (
                  stats.recentActivity.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.actorName}</strong>
                      </td>
                      <td>{row.summary}</td>
                      <td>{new Date(row.createdAt).toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>No activity recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
