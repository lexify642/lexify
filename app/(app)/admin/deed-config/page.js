"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import { fetchJson } from "@/lib/fetchJson";

function ClauseEditModal({ clause, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: clause.title || "",
    description: clause.description || "",
    heading: clause.heading || "",
    jumpLabel: clause.jumpLabel || "",
    textTemplate: clause.textTemplate || "",
    options: clause.options || [],
    playbookImpact: clause.playbook?.impact || "",
    playbookGuidance: clause.playbook?.guidance || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateOption(index, field, value) {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === index ? { ...o, [field]: value } : o)) }));
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, { id: "", label: "" }] }));
  }

  function removeOption(index) {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await fetchJson(`/api/partnership-deed/clauses/${clause.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          heading: form.heading,
          jumpLabel: form.jumpLabel,
          textTemplate: form.textTemplate,
          options: form.options,
          playbook: { impact: form.playbookImpact, guidance: form.playbookGuidance },
        }),
      });
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
            <p className="eyebrow">PARTNERSHIP DEED</p>
            <h2>Clause {clause.number} — {clause.jumpLabel}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="form-field">
              Jump label
              <input value={form.jumpLabel} onChange={(e) => setForm((f) => ({ ...f, jumpLabel: e.target.value }))} />
            </label>
            <label className="form-field">
              Title
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </label>
            <label className="form-field full">
              Description
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="form-field full">
              Section heading
              <input value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} />
            </label>
            <label className="form-field full">
              Clause text template
              <textarea rows={4} value={form.textTemplate} onChange={(e) => setForm((f) => ({ ...f, textTemplate: e.target.value }))} />
              <small>
                Use <code>{"{{optionLabel}}"}</code>
                {form.options.length ? " and " : ""}
                {form.options.length ? <code>{"{{extraValue}}"}</code> : ""} where the selected option (and extra field value, if any) should
                appear.
              </small>
            </label>
          </div>

          <div className="drawer-section-title" style={{ marginTop: 16 }}>
            <h3>Options</h3>
            <button type="button" className="link" onClick={addOption}>
              + Add option
            </button>
          </div>
          {form.options.map((o, i) => (
            <div className="form-grid" key={i} style={{ marginBottom: 8 }}>
              <label className="form-field">
                Option id
                <input value={o.id} onChange={(e) => updateOption(i, "id", e.target.value)} />
              </label>
              <label className="form-field">
                Label
                <input value={o.label} onChange={(e) => updateOption(i, "label", e.target.value)} />
              </label>
              <button type="button" className="link danger-action" onClick={() => removeOption(i)} style={{ alignSelf: "end" }}>
                Remove
              </button>
            </div>
          ))}

          <div className="drawer-section-title" style={{ marginTop: 16 }}>
            <h3>Counter-playbook (optional)</h3>
          </div>
          <div className="form-grid">
            <label className="form-field full">
              Impact
              <input value={form.playbookImpact} onChange={(e) => setForm((f) => ({ ...f, playbookImpact: e.target.value }))} />
            </label>
            <label className="form-field full">
              Guidance
              <input value={form.playbookGuidance} onChange={(e) => setForm((f) => ({ ...f, playbookGuidance: e.target.value }))} />
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

function PresetEditModal({ preset, clauses, onClose, onSaved }) {
  const isNew = !preset;
  const [form, setForm] = useState(
    preset || { pathId: "", posture: "", interestPath: "", votingLock: "", friction: "", guidelines: "", selections: {} }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setSelection(clauseId, optionId) {
    setForm((f) => ({ ...f, selections: { ...f.selections, [clauseId]: optionId } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        await fetchJson("/api/partnership-deed/presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetchJson(`/api/partnership-deed/presets/${preset.pathId}`, {
          method: "PATCH",
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
            <p className="eyebrow">PARTNERSHIP DEED</p>
            <h2>{isNew ? "New" : "Edit"} preset</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="form-field">
              Path id
              <input
                required
                disabled={!isNew}
                value={form.pathId}
                onChange={(e) => setForm((f) => ({ ...f, pathId: e.target.value.toUpperCase() }))}
              />
            </label>
            <label className="form-field">
              Posture
              <input value={form.posture} onChange={(e) => setForm((f) => ({ ...f, posture: e.target.value }))} />
            </label>
            <label className="form-field">
              Interest path
              <input value={form.interestPath} onChange={(e) => setForm((f) => ({ ...f, interestPath: e.target.value }))} />
            </label>
            <label className="form-field">
              Voting lock
              <input value={form.votingLock} onChange={(e) => setForm((f) => ({ ...f, votingLock: e.target.value }))} />
            </label>
            <label className="form-field">
              Friction
              <input value={form.friction} onChange={(e) => setForm((f) => ({ ...f, friction: e.target.value }))} />
            </label>
            <label className="form-field full">
              Guidelines
              <input value={form.guidelines} onChange={(e) => setForm((f) => ({ ...f, guidelines: e.target.value }))} />
            </label>
          </div>

          <div className="drawer-section-title" style={{ marginTop: 16 }}>
            <h3>Selections</h3>
          </div>
          <div className="form-grid">
            {clauses.map((c) => (
              <label className="form-field" key={c.id}>
                {c.jumpLabel}
                <select value={form.selections[c.id] || ""} onChange={(e) => setSelection(c.id, e.target.value)}>
                  <option value="">— unset —</option>
                  {c.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
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

export default function AdminDeedConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingClause, setEditingClause] = useState(null);
  const [editingPreset, setEditingPreset] = useState(null);
  const [creatingPreset, setCreatingPreset] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [busyPresetId, setBusyPresetId] = useState(null);

  function reload() {
    return fetchJson("/api/partnership-deed")
      .then(({ data }) => {
        setConfig(data);
        setSettingsForm({
          recitalsHtml: data.recitalsHtml,
          closingHtml: data.closingHtml,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDeletePreset(pathId) {
    if (!window.confirm(`Delete preset ${pathId}?`)) return;
    setBusyPresetId(pathId);
    try {
      await fetchJson(`/api/partnership-deed/presets/${pathId}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyPresetId(null);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    setError("");
    try {
      await fetchJson("/api/partnership-deed/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <AppShell>
      <Topbar />
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Partnership Deed Configuration</h1>
            <p className="page-subtitle">Clause options, presets, and boilerplate text used by the Partnership Deed generator.</p>
          </div>
        </div>

        {error && <div className="otp-error">{error}</div>}

        {loading || !config ? (
          <div className="empty-inline">Loading…</div>
        ) : (
          <>
            <section className="card">
              <div className="section-head">
                <h2 className="section-title">Clauses</h2>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Options</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.clauses.map((c) => (
                      <tr key={c.id}>
                        <td>{c.number}</td>
                        <td>
                          <strong>{c.title}</strong>
                        </td>
                        <td>{c.options.length}</td>
                        <td>
                          <button type="button" className="link" onClick={() => setEditingClause(c)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <div className="section-head">
                <div>
                  <h2 className="section-title">Presets</h2>
                </div>
                <button className="btn btn-outline" type="button" onClick={() => setCreatingPreset(true)}>
                  + New Preset
                </button>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Path ID</th>
                      <th>Posture</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.presets.length ? (
                      config.presets.map((p) => (
                        <tr key={p.pathId}>
                          <td>{p.pathId}</td>
                          <td>{p.posture}</td>
                          <td>
                            <button type="button" className="link" disabled={busyPresetId === p.pathId} onClick={() => setEditingPreset(p)}>
                              Edit
                            </button>{" "}
                            <button
                              type="button"
                              className="link danger-action"
                              disabled={busyPresetId === p.pathId}
                              onClick={() => handleDeletePreset(p.pathId)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>No presets yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <div className="section-head">
                <h2 className="section-title">Boilerplate</h2>
                <p className="page-subtitle">Fixed recitals/execution text wrapped around every generated deed.</p>
              </div>
              <form onSubmit={handleSaveSettings}>
                <div className="form-grid">
                  <label className="form-field full">
                    Recitals HTML
                    <textarea
                      rows={5}
                      value={settingsForm.recitalsHtml}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, recitalsHtml: e.target.value }))}
                    />
                  </label>
                  <label className="form-field full">
                    Closing HTML
                    <textarea
                      rows={3}
                      value={settingsForm.closingHtml}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, closingHtml: e.target.value }))}
                    />
                  </label>
                </div>
                <button className="btn" type="submit" disabled={savingSettings}>
                  {savingSettings ? "Saving…" : "Save boilerplate"}
                </button>
              </form>
            </section>
          </>
        )}
      </div>

      {editingClause && <ClauseEditModal clause={editingClause} onClose={() => setEditingClause(null)} onSaved={reload} />}
      {editingPreset && (
        <PresetEditModal preset={editingPreset} clauses={config.clauses} onClose={() => setEditingPreset(null)} onSaved={reload} />
      )}
      {creatingPreset && (
        <PresetEditModal preset={null} clauses={config.clauses} onClose={() => setCreatingPreset(false)} onSaved={reload} />
      )}
    </AppShell>
  );
}
