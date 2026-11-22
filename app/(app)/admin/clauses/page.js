"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import { fetchJson } from "@/lib/fetchJson";
import { useClauses } from "@/components/draft/ClausesContext";
import { riskTone, statusTone } from "@/components/draft/clauseUtils";

const PAGE_SIZE = 20;
const RISK_OPTIONS = ["N/A", "LOW", "MEDIUM", "HIGH"];
const STATUS_OPTIONS = ["APPROVED", "DRAFT", "PENDING", "DEPRECATED", "REJECTED"];

function emptyForm() {
  return {
    id: "",
    category: "",
    type: "",
    name: "",
    position: "",
    domain: "",
    text: "",
    version: "",
    risk: "N/A",
    favorability: "",
    negotiation: "",
    frequency: "",
    caseLaw: "",
    status: "APPROVED",
    isPublished: true,
  };
}

function ClauseFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? { ...initial } : emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await fetchJson(`/api/clauses/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetchJson("/api/clauses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="case-modal wide" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">CLAUSE BANK</p>
            <h2>{isEdit ? "Edit" : "New"} clause</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="form-field">
              Clause id
              <input required disabled={isEdit} value={form.id} onChange={(e) => update("id", e.target.value.toUpperCase())} />
            </label>
            <label className="form-field">
              Category
              <input value={form.category || ""} onChange={(e) => update("category", e.target.value)} />
            </label>
            <label className="form-field">
              Type
              <input value={form.type || ""} onChange={(e) => update("type", e.target.value)} />
            </label>
            <label className="form-field">
              Name (optional)
              <input value={form.name || ""} onChange={(e) => update("name", e.target.value)} />
            </label>
            <label className="form-field">
              Position
              <input value={form.position || ""} onChange={(e) => update("position", e.target.value)} />
            </label>
            <label className="form-field">
              Domain
              <input value={form.domain || ""} onChange={(e) => update("domain", e.target.value)} />
            </label>
            <label className="form-field">
              Version
              <input value={form.version || ""} onChange={(e) => update("version", e.target.value)} />
            </label>
            <label className="form-field">
              Risk
              <select value={form.risk || "N/A"} onChange={(e) => update("risk", e.target.value)}>
                {RISK_OPTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Favorability
              <input value={form.favorability || ""} onChange={(e) => update("favorability", e.target.value)} />
            </label>
            <label className="form-field">
              Frequency
              <input value={form.frequency || ""} onChange={(e) => update("frequency", e.target.value)} />
            </label>
            <label className="form-field">
              Case law (UUID or citation)
              <input value={form.caseLaw || ""} onChange={(e) => update("caseLaw", e.target.value)} />
            </label>
            <label className="form-field">
              Legal status
              <select value={form.status || "APPROVED"} onChange={(e) => update("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="form-field full">
              Negotiation notes
              <textarea rows={2} value={form.negotiation || ""} onChange={(e) => update("negotiation", e.target.value)} />
            </label>
            <label className="form-field full">
              Clause text
              <textarea rows={6} value={form.text || ""} onChange={(e) => update("text", e.target.value)} />
            </label>
            <label className="toggle-field full">
              <span className="switch">
                <input type="checkbox" checked={form.isPublished !== false} onChange={(e) => update("isPublished", e.target.checked)} />
                <span className="switch-track" />
              </span>
              Published (visible to staff)
            </label>
          </div>
          {error && <div className="otp-error">{error}</div>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminClausesPage() {
  const { clauses, loading, reload } = useClauses();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clauses;
    return clauses.filter((c) =>
      [c.id, c.category, c.type, c.name, c.text].some((f) => (f || "").toLowerCase().includes(term))
    );
  }, [clauses, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageResults = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function toggleStatus(clause) {
    setBusyId(clause.id);
    try {
      await fetchJson(`/api/clauses/${clause.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !clause.isPublished }),
      });
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(clause) {
    if (!window.confirm(`Delete clause ${clause.id}?`)) return;
    setBusyId(clause.id);
    try {
      await fetchJson(`/api/clauses/${clause.id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <Topbar />
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Clause Bank</h1>
            <p className="page-subtitle">{clauses.length} clauses in the library.</p>
          </div>
          <button className="btn" type="button" onClick={() => setCreating(true)}>
            + New Clause
          </button>
        </div>

        <div className="filter-row">
          <div className="search">
            <span>⌕</span>
            <input
              placeholder="Search id, category, type, text…"
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
                  <th>ID</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading…</td>
                  </tr>
                ) : pageResults.length ? (
                  pageResults.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.id}</strong>
                      </td>
                      <td>{c.category}</td>
                      <td>{c.type}</td>
                      <td>
                        <span className={`badge ${riskTone(c.risk)}`}>{(c.risk || "N/A").trim()}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusTone(c.status)}`}>{(c.status || "").trim()}</span>
                      </td>
                      <td>
                        <span className={`badge ${c.isPublished ? "green" : "grey"}`}>{c.isPublished ? "Published" : "Hidden"}</span>
                      </td>
                      <td>
                        <button type="button" className="link" disabled={busyId === c.id} onClick={() => setEditing(c)}>
                          Edit
                        </button>{" "}
                        <button type="button" className="link" disabled={busyId === c.id} onClick={() => toggleStatus(c)}>
                          {c.isPublished ? "Unpublish" : "Publish"}
                        </button>{" "}
                        <button type="button" className="link danger-action" disabled={busyId === c.id} onClick={() => handleDelete(c)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>No clauses found.</td>
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

      {creating && <ClauseFormModal onClose={() => setCreating(false)} onSaved={reload} />}
      {editing && <ClauseFormModal initial={editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </AppShell>
  );
}
