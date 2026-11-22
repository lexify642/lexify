"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDrafts } from "./DraftsContext";
import styles from "./PartnershipDeedEngine.module.css";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

function optionLabel(clause, optionId) {
  return clause.options.find((option) => option.id === optionId)?.label ?? clause.options[0].label;
}

// Replaces data/partnershipDeed.js's old buildText(optionLabel, extraValue)
// JS functions — every one of the 10 was pure string interpolation with no
// branching (verified before the migration), so it converts cleanly to a
// stored template with {{optionLabel}}/{{extraValue}} placeholder tokens
// (see scripts/seed-partnership-deed.mjs) plus this substitution instead of
// a function call.
function interpolate(template, values) {
  return (template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => (values[key] ?? ""));
}

export default function PartnershipDeedEngine({ active }) {
  const router = useRouter();
  const { addDraft } = useDrafts();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState({});
  const [extraValues, setExtraValues] = useState({});
  const [downloaded, setDownloaded] = useState(false);
  const [activeClauseId, setActiveClauseId] = useState(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/partnership-deed")
      .then((data) => {
        if (cancelled) return;
        setConfig(data);
        setSelections(data.defaultSelections);
        setExtraValues(data.defaultExtraValues);
        if (data.clauses.length) setActiveClauseId(data.clauses[0].id);
      })
      .catch((err) => console.error("[PartnershipDeedEngine] load failed", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !config) {
    return (
      <section className={`library-view${active ? " active" : ""}`} data-library-view="generator">
        <div className="empty-inline">Loading Partnership Deed configuration…</div>
      </section>
    );
  }

  const { clauses: CLAUSES, presets: PRESETS, recitalsHtml: RECITALS_HTML, closingHtml: CLOSING_HTML } = config;
  const activeClause = CLAUSES.find((clause) => clause.id === activeClauseId) || CLAUSES[0];

  function setOption(clauseId, optionId) {
    setSelections((prev) => ({ ...prev, [clauseId]: optionId }));
  }

  function setExtra(name, value) {
    setExtraValues((prev) => ({ ...prev, [name]: value }));
  }

  function applyPreset(preset) {
    setSelections((prev) => ({ ...prev, ...preset.selections }));
  }

  function jumpTo(clauseId) {
    sectionRefs.current[clauseId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clauseText(clause) {
    const label = optionLabel(clause, selections[clause.id]);
    const extraValue = clause.extraField ? extraValues[clause.extraField.name] : undefined;
    return interpolate(clause.textTemplate, { optionLabel: label, extraValue });
  }

  function buildDeedBodyHtml() {
    const clauseHtml = CLAUSES.map((clause) => `<h4>${clause.heading}</h4><p>${clauseText(clause)}</p>`).join("");
    return `${RECITALS_HTML}${clauseHtml}${CLOSING_HTML}`;
  }

  function buildDeedHtml() {
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Partnership Deed</title>
<style>
  @page { margin: 1in; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.7; color: #1b1e27; }
  h3 { text-align: center; margin: 0 0 10pt; }
  h4 { margin: 20pt 0 8pt; font-size: 13pt; text-align: left; }
  p { margin: 0 0 12pt; text-align: justify; }
</style>
</head>
<body>
${buildDeedBodyHtml()}
</body>
</html>`;
  }

  // Creates a real draft from the currently configured deed and hands off
  // to the MS Word-style Draft Editor for further editing/review — the
  // generator itself stays a fast configurator, not a second editing
  // surface competing with the real one.
  function handleSendToDraftEditor() {
    const entry = addDraft({
      title: `Partnership Deed — ${new Date().toLocaleDateString("en-IN")}`,
      type: "Agreement",
      blocks: [{ html: buildDeedBodyHtml() }],
    });
    router.push("/draft");
    return entry;
  }

  function handleDownloadWord() {
    const blob = new Blob(["﻿", buildDeedHtml()], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Partnership-Deed.doc";
    link.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1400);
  }

  function handleExportParams() {
    const payload = { selections, extraValues, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "partnership-deed-parameters.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={`library-view${active ? " active" : ""}`} data-library-view="generator">
      <div className={styles.topActions}>
          <button className={styles.primaryBtn} onClick={handleSendToDraftEditor}>
            ✎ Open in Draft Editor
          </button>
          <button className={styles.secondaryBtn} onClick={handleDownloadWord}>
            {downloaded ? "Downloaded ✓" : "📄 Download as MS Word"}
          </button>
          <button className={styles.secondaryBtn} onClick={handleExportParams}>
            ⬇ Export Operational Parameters
          </button>
          <button className={styles.secondaryBtn} onClick={() => window.print()}>
            🖨 Generate Professional Print PDF
          </button>
        </div>

        <div className={styles.clauseCard}>
          <div className={styles.clauseTabs}>
            {CLAUSES.map((clause) => (
              <button
                key={clause.id}
                className={`${styles.clauseTab}${clause.id === activeClauseId ? ` ${styles.clauseTabActive}` : ""}`}
                onClick={() => setActiveClauseId(clause.id)}
              >
                {clause.number}. {clause.jumpLabel}
              </button>
            ))}
          </div>

          <div className={styles.activeClauseBody}>
            <div className={styles.activeClauseInfo}>
              <strong>
                Clause {activeClause.number}: {activeClause.title}
              </strong>
              <p>{activeClause.description}</p>
            </div>
            <div className={styles.activeClauseConfig}>
              <select
                value={selections[activeClause.id]}
                onChange={(event) => setOption(activeClause.id, event.target.value)}
              >
                {activeClause.options.map((option, index) => (
                  <option key={option.id} value={option.id}>
                    [Option {index + 1}] {option.label}
                  </option>
                ))}
              </select>
              {activeClause.extraField && (
                <div className={styles.extraField}>
                  <label>{activeClause.extraField.label}</label>
                  <input
                    value={extraValues[activeClause.extraField.name] || ""}
                    onChange={(event) => setExtra(activeClause.extraField.name, event.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.canvas}>
            <div className={styles.canvasHead}>
              <h3>📄 SYSTEM ENGAGEMENT CANVAS (PARTNERSHIP DEED DEPLOYMENT)</h3>
            </div>

            <div className={styles.jumpTerminal}>
              <div className={styles.jumpTerminalLabel}>⚑ INSTANT CLAUSE JUMP TERMINAL</div>
              <div className={styles.jumpGrid}>
                {CLAUSES.map((clause) => (
                  <button key={clause.id} onClick={() => jumpTo(clause.id)}>
                    {clause.number}. {clause.jumpLabel}
                  </button>
                ))}
              </div>
            </div>

            <article className={styles.docPreview}>
              <div dangerouslySetInnerHTML={{ __html: RECITALS_HTML }} />
              {CLAUSES.map((clause) => (
                <div
                  key={clause.id}
                  ref={(el) => {
                    sectionRefs.current[clause.id] = el;
                  }}
                >
                  <h4>{clause.heading}</h4>
                  <p>{clauseText(clause)}</p>
                  {clause.playbook && (
                    <div className={styles.inlineRisk}>
                      <strong>
                        CLAUSE {clause.number}: {clause.title.toUpperCase()}
                      </strong>
                      <p>
                        <b>Risk Vector Target:</b> {clause.playbook.impact}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <div dangerouslySetInnerHTML={{ __html: CLOSING_HTML }} />
            </article>
          </div>

          <div className={styles.playbook}>
            <div className={styles.playbookHead}>⚑ TACTICAL STRATEGIC COUNTER-PLAYBOOK</div>
            {CLAUSES.filter((clause) => clause.playbook).map((clause) => (
              <div className={styles.playbookCard} key={clause.id}>
                <div className={styles.playbookCardHead}>
                  <strong>Clause {clause.number}</strong>
                  <span className={styles.activeBadge}>ACTIVE</span>
                </div>
                <div className={styles.impactLabel}>
                  <b>Impact Matrix:</b> {clause.playbook.impact}
                </div>
                <div className={styles.guidanceBox}>{clause.playbook.guidance}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.presetsSection}>
          <div className={styles.presetsHead}>
            <h3>▤ PREDEFINED OPERATIONAL POSTURE INJECTORS (CLICK ROW TO SELECT)</h3>
            <p>Select preset management configurations based on capital size and structural governance preferences.</p>
          </div>
          <table className={styles.presetsTable}>
            <thead>
              <tr>
                <th>Path ID</th>
                <th>Governance Posture</th>
                <th>Interest Path Matrix</th>
                <th>Voting Lock Rules</th>
                <th>Friction Score Rating</th>
                <th>System Execution Guidelines</th>
              </tr>
            </thead>
            <tbody>
              {PRESETS.map((preset) => (
                <tr className={styles.presetRow} key={preset.pathId} onClick={() => applyPreset(preset)}>
                  <td>
                    <span className={styles.pathId}>{preset.pathId}</span>
                  </td>
                  <td>
                    <strong>{preset.posture}</strong>
                  </td>
                  <td>{preset.interestPath}</td>
                  <td>{preset.votingLock}</td>
                  <td>{preset.friction}</td>
                  <td>{preset.guidelines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </section>
  );
}
