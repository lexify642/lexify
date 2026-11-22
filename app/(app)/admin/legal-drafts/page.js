"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import { fetchJson } from "@/lib/fetchJson";
import { useLegalDrafts } from "@/components/legal-drafts/LegalDraftsContext";
import { LANGUAGES, PRACTICE_AREAS, categoryName } from "@/data/legalDrafts";

const EMPTY_TRANSLATIONS = Object.fromEntries(LANGUAGES.map((l) => [l.id, { name: "", description: "" }]));

function emptyCategoryForm() {
  return {
    slug: "",
    practiceArea: PRACTICE_AREAS[0],
    languages: ["english"],
    status: "published",
    translations: structuredClone(EMPTY_TRANSLATIONS),
    filePath: null,
  };
}

async function uploadPdf(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await fetchJson("/api/legal-drafts/upload", { method: "POST", body: formData });
  return data.filePath;
}

function CategoryFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? { ...initial, translations: structuredClone(initial.translations) } : emptyCategoryForm());
  const [lang, setLang] = useState("english");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial?.dbId;

  function setTranslation(field, value) {
    setForm((f) => ({ ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], [field]: value } } }));
  }

  function toggleLanguage(id) {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(id) ? f.languages.filter((l) => l !== id) : [...f.languages, id],
    }));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const filePath = await uploadPdf(file);
      setForm((f) => ({ ...f, filePath }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        slug: form.slug,
        practiceArea: form.practiceArea,
        languages: form.languages,
        status: form.status,
        translations: form.translations,
        filePath: form.filePath,
      };
      if (isEdit) {
        await fetchJson(`/api/legal-drafts/${initial.dbId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson("/api/legal-drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
            <p className="eyebrow">DRAFTING LIBRARY</p>
            <h2>{isEdit ? "Edit" : "New"} category</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="form-field">
              Slug
              <input
                required
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
              />
            </label>
            <label className="form-field">
              Practice area
              <select value={form.practiceArea} onChange={(e) => setForm((f) => ({ ...f, practiceArea: e.target.value }))}>
                {PRACTICE_AREAS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Status
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="published">Published</option>
                <option value="draft">Draft (hidden from staff)</option>
              </select>
            </label>
            <label className="form-field">
              Document (PDF)
              <input type="file" accept="application/pdf" onChange={handleFileChange} />
              {uploading && <small>Uploading…</small>}
              {form.filePath && !uploading && <small>File attached.</small>}
            </label>
            <div className="form-field full">
              Languages
              <div className="checkbox-row-group">
                {LANGUAGES.map((l) => (
                  <label key={l.id} className="toggle-field">
                    <span className="switch">
                      <input type="checkbox" checked={form.languages.includes(l.id)} onChange={() => toggleLanguage(l.id)} />
                      <span className="switch-track" />
                    </span>
                    {l.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="workspace-tabs" style={{ marginTop: 16 }}>
            {LANGUAGES.map((l) => (
              <a key={l.id} className={lang === l.id ? "active" : ""} onClick={() => setLang(l.id)}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label className="form-field full">
              Name ({lang})
              <input value={form.translations[lang]?.name || ""} onChange={(e) => setTranslation("name", e.target.value)} />
            </label>
            <label className="form-field full">
              Description ({lang})
              <textarea
                rows={3}
                value={form.translations[lang]?.description || ""}
                onChange={(e) => setTranslation("description", e.target.value)}
              />
            </label>
          </div>

          {error && <div className="otp-error">{error}</div>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" type="submit" disabled={saving || uploading}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function emptySubtypeForm() {
  return { subtypeKey: "", status: "published", translations: { english: { name: "" } }, filePath: null };
}

function SubtypeManagerModal({ category, onClose, onSaved }) {
  const [subTypes, setSubTypes] = useState(category.subTypes || []);
  const [form, setForm] = useState(emptySubtypeForm());
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const filePath = await uploadPdf(file);
      setForm((f) => ({ ...f, filePath }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const { data: created } = await fetchJson(`/api/legal-drafts/${category.dbId}/subtypes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubTypes((prev) => [...prev, created]);
      setForm(emptySubtypeForm());
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(sub) {
    setBusyId(sub.dbId);
    try {
      const { data: updated } = await fetchJson(`/api/legal-drafts/subtypes/${sub.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: sub.status === "published" ? "draft" : "published" }),
      });
      setSubTypes((prev) => prev.map((s) => (s.dbId === sub.dbId ? updated : s)));
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteSub(sub) {
    if (!window.confirm(`Delete sub-type "${sub.id}"?`)) return;
    setBusyId(sub.dbId);
    try {
      await fetchJson(`/api/legal-drafts/subtypes/${sub.dbId}`, { method: "DELETE" });
      setSubTypes((prev) => prev.filter((s) => s.dbId !== sub.dbId));
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">DRAFTING LIBRARY</p>
            <h2>Sub-types — {categoryName(category, "english")}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="table-wrap" style={{ marginBottom: 18 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subTypes.length ? (
                  subTypes.map((s) => (
                    <tr key={s.dbId}>
                      <td>{s.translations.english?.name || s.id}</td>
                      <td>{s.id}</td>
                      <td>
                        <span className={`badge ${s.status === "published" ? "green" : "grey"}`}>{s.status}</span>
                      </td>
                      <td>
                        <button type="button" className="link" disabled={busyId === s.dbId} onClick={() => toggleStatus(s)}>
                          {s.status === "published" ? "Unpublish" : "Publish"}
                        </button>{" "}
                        <button type="button" className="link danger-action" disabled={busyId === s.dbId} onClick={() => handleDeleteSub(s)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No sub-types yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleCreate}>
            <div className="drawer-section-title">
              <h3>Add sub-type</h3>
            </div>
            <div className="form-grid">
              <label className="form-field">
                Key (e.g. &quot;name-change&quot;)
                <input
                  required
                  value={form.subtypeKey}
                  onChange={(e) => setForm((f) => ({ ...f, subtypeKey: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                />
              </label>
              <label className="form-field">
                Name (English)
                <input
                  required
                  value={form.translations.english.name}
                  onChange={(e) => setForm((f) => ({ ...f, translations: { english: { name: e.target.value } } }))}
                />
              </label>
              <label className="form-field">
                Document (PDF)
                <input type="file" accept="application/pdf" onChange={handleFileChange} />
                {uploading && <small>Uploading…</small>}
                {form.filePath && !uploading && <small>File attached.</small>}
              </label>
            </div>
            {error && <div className="otp-error">{error}</div>}
            <button className="btn" type="submit" disabled={creating || uploading} style={{ marginTop: 10 }}>
              {creating ? "Adding…" : "+ Add sub-type"}
            </button>
          </form>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLegalDraftsPage() {
  const { categories, loading, reload } = useLegalDrafts();
  const [editing, setEditing] = useState(null);
  const [managingSubtypes, setManagingSubtypes] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function toggleStatus(category) {
    setBusyId(category.dbId);
    try {
      await fetchJson(`/api/legal-drafts/${category.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: category.status === "published" ? "draft" : "published" }),
      });
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Delete "${categoryName(category, "english")}"? This removes its sub-types too.`)) return;
    setBusyId(category.dbId);
    try {
      await fetchJson(`/api/legal-drafts/${category.dbId}`, { method: "DELETE" });
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
            <h1 className="page-title">Drafting Library</h1>
            <p className="page-subtitle">Legal draft categories shown on /legal-drafts, in all four languages.</p>
          </div>
          <button className="btn" type="button" onClick={() => setCreating(true)}>
            + New Category
          </button>
        </div>

        {error && <div className="otp-error">{error}</div>}

        <section className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Practice Area</th>
                  <th>Sub-types</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading…</td>
                  </tr>
                ) : categories.length ? (
                  categories.map((c) => (
                    <tr key={c.dbId}>
                      <td>
                        <strong>{categoryName(c, "english")}</strong>
                      </td>
                      <td>{c.slug}</td>
                      <td>{c.practiceArea}</td>
                      <td>{c.subTypes?.length || "—"}</td>
                      <td>
                        <span className={`badge ${c.status === "published" ? "green" : "grey"}`}>{c.status}</span>
                      </td>
                      <td>
                        <button type="button" className="link" disabled={busyId === c.dbId} onClick={() => setEditing(c)}>
                          Edit
                        </button>{" "}
                        <button type="button" className="link" disabled={busyId === c.dbId} onClick={() => setManagingSubtypes(c)}>
                          Sub-types
                        </button>{" "}
                        <button type="button" className="link" disabled={busyId === c.dbId} onClick={() => toggleStatus(c)}>
                          {c.status === "published" ? "Unpublish" : "Publish"}
                        </button>{" "}
                        <button type="button" className="link danger-action" disabled={busyId === c.dbId} onClick={() => handleDelete(c)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>No categories yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {creating && <CategoryFormModal onClose={() => setCreating(false)} onSaved={reload} />}
      {editing && <CategoryFormModal initial={editing} onClose={() => setEditing(null)} onSaved={reload} />}
      {managingSubtypes && (
        <SubtypeManagerModal category={managingSubtypes} onClose={() => setManagingSubtypes(null)} onSaved={reload} />
      )}
    </AppShell>
  );
}
