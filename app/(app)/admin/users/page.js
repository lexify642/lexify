"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import { fetchJson } from "@/lib/fetchJson";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { ROLE_OPTIONS, ROLE_LABELS } from "@/lib/roles";

const ROLE_BADGE_TONE = {
  admin: "blue",
  senior_advocate: "green",
  junior_advocate: "orange",
  clerk: "grey",
  staff: "grey",
};
const PAGE_SIZE = 20;

function InviteUserModal({ onClose, onInvited }) {
  const [form, setForm] = useState({ email: "", fullName: "", role: "staff" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data: created } = await fetchJson("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onInvited(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="case-modal" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">ADMIN</p>
            <h2>Invite user</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="form-field full">
              Full name
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>
            <label className="form-field full">
              Email address
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="form-field full">
              Role
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && <div className="otp-error">{error}</div>}
          <p className="hint">
            They&apos;ll sign in the same way everyone else does — enter this email at /login and verify the 6-digit
            code sent to it. No password is set here.
          </p>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Inviting…" : "Send invite"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminUsersPage() {
  const currentUser = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search.trim()) params.set("q", search.trim());
    fetchJson(`/api/admin/users?${params.toString()}`)
      .then(({ data, pagination }) => {
        setUsers(data);
        setTotal(pagination?.total ?? 0);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateUser(id, updates) {
    setBusyId(id);
    try {
      const { data: updated } = await fetchJson(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleRoleChange(user, role) {
    if (role === user.role) return;
    updateUser(user.id, { role });
  }

  function handleToggleActive(user) {
    const next = !user.is_active;
    if (!next && !window.confirm(`Deactivate ${user.full_name || user.email}? They will no longer be able to sign in.`)) return;
    updateUser(user.id, { isActive: next });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell>
      <Topbar />
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Users &amp; Roles</h1>
            <p className="page-subtitle">Every account that can sign in to LEXIFYI, and what they&apos;re allowed to do.</p>
          </div>
          <button className="btn" type="button" onClick={() => setInviteOpen(true)}>
            + Invite User
          </button>
        </div>

        <div className="filter-row">
          <div className="search">
            <span>⌕</span>
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>

        {error && <div className="otp-error">{error}</div>}

        <section className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading…</td>
                  </tr>
                ) : users.length ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.full_name || "—"}</strong>
                        {user.id === currentUser.id && <small> (you)</small>}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          disabled={busyId === user.id || user.id === currentUser.id}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? "green" : "red"}`}>{user.is_active ? "Active" : "Deactivated"}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="link"
                          disabled={busyId === user.id || user.id === currentUser.id}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <span className="pagination-ellipsis">
                Page {page} of {totalPages}
              </span>
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </section>
      </div>

      {inviteOpen && (
        <InviteUserModal
          onClose={() => setInviteOpen(false)}
          onInvited={() => {
            setPage(1);
            load();
          }}
        />
      )}
    </AppShell>
  );
}
