"use client";

import { createContext, useContext, useRef, useState } from "react";
import { generateJSON } from "@tiptap/html";
import { CURRENT_USER } from "@/data/team";
import { editorExtensions, jsonToText } from "./editor/extensions";

const DraftsContext = createContext(null);

// Same starting content the Draft Editor has always shown — converted once
// into a real TipTap document (see buildSeedDraft below) so a first-time
// visitor to /draft still sees exactly this, but now as genuine structured
// content instead of a raw HTML string.
const SEED_DRAFT_HTML = `<h3>IN THE HIGH COURT OF JUDICATURE AT MUMBAI</h3><h3>ORDINARY ORIGINAL CIVIL JURISDICTION</h3><p>SUIT NO. ______ OF 2026</p><p><b>ABC CORPORATION LIMITED</b><br>...Plaintiff</p><p><b>VERSUS</b></p><p><b>XYZ LIMITED</b><br>...Defendant</p><p><b>PLAINT</b></p><p>The Plaintiff above named respectfully submits as follows: The Plaintiff is a company incorporated under the Companies Act, 2013 and carries on business from its registered office at Mumbai.</p>`;

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyDoc() {
  return { type: "doc", content: [{ type: "legalParagraph", content: [] }] };
}

function makeVersion({ contentJson, action, number, label }) {
  return {
    id: newId("version"),
    number,
    label: label || `v${number}`,
    contentJson,
    contentText: jsonToText(contentJson),
    createdAt: nowIso(),
    createdBy: CURRENT_USER.name,
    action,
    status: "Active",
  };
}

const DEFAULT_LAYOUT = {
  margin: "normal",
  customMargin: null,
  orientation: "portrait",
  pageSize: "A4",
  customPageWidth: null,
  customPageHeight: null,
  columns: 1,
  differentFirstPage: false,
  lineNumbers: false,
  headerDistance: 24,
  footerDistance: 24,
};

const DEFAULT_DESIGN = { preset: null, watermark: null, fontPairing: "classic", spacing: "normal", pageBackground: "white", pageBorder: false };

// Legal-document presets bundle real Layout/Design attribute changes — they
// never touch a draft's contentJson, matching the "presets modify
// formatting without deleting content" requirement.
export const LEGAL_PRESETS = {
  Plaint: { design: { fontPairing: "classic", spacing: "relaxed" }, layout: { margin: "normal" } },
  "Written Statement": { design: { fontPairing: "classic", spacing: "relaxed" }, layout: { margin: "normal" } },
  Petition: { design: { fontPairing: "classic", spacing: "normal" }, layout: { margin: "normal" } },
  Application: { design: { fontPairing: "modern", spacing: "normal" }, layout: { margin: "narrow" } },
  Affidavit: { design: { fontPairing: "classic", spacing: "relaxed" }, layout: { margin: "normal" } },
  "Legal Notice": { design: { fontPairing: "modern", spacing: "normal" }, layout: { margin: "moderate" } },
  Agreement: { design: { fontPairing: "traditional", spacing: "compact" }, layout: { margin: "normal", columns: 1 } },
  Contract: { design: { fontPairing: "traditional", spacing: "compact" }, layout: { margin: "normal", columns: 1 } },
  Memorandum: { design: { fontPairing: "modern", spacing: "compact" }, layout: { margin: "narrow" } },
  Submission: { design: { fontPairing: "classic", spacing: "normal" }, layout: { margin: "normal" } },
};

function buildSeedDraft() {
  const contentJson = generateJSON(SEED_DRAFT_HTML, editorExtensions);
  const v1 = makeVersion({ contentJson, action: "Created", number: 1 });
  return {
    id: "draft-plaint-abc-xyz",
    title: "Plaint — ABC Corporation Limited vs XYZ Limited",
    type: "Plaint",
    linkedCaseNo: "02",
    clientName: "ABC Corp.",
    description: "",
    versions: [v1],
    activeVersionId: v1.id,
    headerHtml: "",
    footerHtml: "",
    layout: { ...DEFAULT_LAYOUT },
    design: { ...DEFAULT_DESIGN, preset: "Plaint" },
    createdAt: "2026-07-15T09:00:00.000Z",
    updatedAt: "2026-07-15T09:00:00.000Z",
  };
}

// Built once at module load (not per-render) — every DraftsProvider mount
// (there is only ever one, in app/layout.js) starts from the same seed.
let cachedSeedDraft = null;
function getSeedDraft() {
  if (!cachedSeedDraft) cachedSeedDraft = buildSeedDraft();
  return cachedSeedDraft;
}

// Minimal, honest multi-draft/version storage — mirrors the CasesContext/
// TasksContext pattern (Provider + useState + mutator functions), mounted
// once in app/layout.js so the Draft Editor, Clause Bank, and Template Bank
// always see the same list. Content lives as real TipTap JSON so it can be
// diffed, exported, and inserted into precisely — never a raw HTML blob.
export function DraftsProvider({ children }) {
  const [drafts, setDrafts] = useState(() => [getSeedDraft()]);
  const [activeDraftId, setActiveDraftId] = useState(() => getSeedDraft().id);

  // Holds the live TipTap editor instance for whichever draft is currently
  // open on screen, so insertions (Clause Bank "Add to Draft", Mail Merge,
  // etc.) land at the real cursor position when possible instead of always
  // falling back to "append a paragraph at the end".
  const liveEditorRef = useRef(null);

  function registerLiveEditor(draftId, editor) {
    liveEditorRef.current = { draftId, editor };
  }

  function unregisterLiveEditor(draftId) {
    if (liveEditorRef.current?.draftId === draftId) liveEditorRef.current = null;
  }

  function getLiveEditor(draftId) {
    return liveEditorRef.current?.draftId === draftId ? liveEditorRef.current.editor : null;
  }

  function getActiveVersion(draft) {
    return draft.versions.find((v) => v.id === draft.activeVersionId) || draft.versions[draft.versions.length - 1];
  }

  // `contentJson` is the real seed for a new draft's first version. `blocks`
  // (an array of {html}) is accepted for backward compatibility with the
  // Clause-Bank-built modals that still assemble drafts as HTML blocks —
  // it's converted into the same real document model.
  function addDraft({ title, type, linkedCaseNo, clientName, description, contentJson, blocks }) {
    let doc = contentJson;
    if (!doc && blocks && blocks.length) {
      doc = generateJSON(blocks.map((b) => b.html).join(""), editorExtensions);
    }
    if (!doc) doc = emptyDoc();

    const v1 = makeVersion({ contentJson: doc, action: "Created", number: 1 });
    const entry = {
      id: newId("draft"),
      title,
      type: type || "Draft",
      linkedCaseNo: linkedCaseNo || null,
      clientName: clientName || "",
      description: description || "",
      versions: [v1],
      activeVersionId: v1.id,
      headerHtml: "",
      footerHtml: "",
      layout: { ...DEFAULT_LAYOUT },
      design: { ...DEFAULT_DESIGN, preset: type || null },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    setDrafts((prev) => [entry, ...prev]);
    setActiveDraftId(entry.id);
    return entry;
  }

  // Only creates a new version when the content genuinely changed since the
  // last saved one — typing/autosave doesn't spam the version list.
  function saveVersion(draftId, contentJson, action = "Edited") {
    let created = null;
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        const current = getActiveVersion(d);
        const newText = jsonToText(contentJson);
        if (current && current.contentText === newText) return d;
        const version = makeVersion({ contentJson, action, number: d.versions.length + 1 });
        created = version;
        return { ...d, versions: [...d.versions, version], activeVersionId: version.id, updatedAt: nowIso() };
      })
    );
    return created;
  }

  // Restoring never deletes/rewrites history — it creates a new version that
  // copies the restored content, exactly like real version control.
  function restoreVersion(draftId, versionId) {
    let created = null;
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        const target = d.versions.find((v) => v.id === versionId);
        if (!target) return d;
        const version = makeVersion({ contentJson: target.contentJson, action: `Restored from ${target.label}`, number: d.versions.length + 1 });
        created = version;
        return { ...d, versions: [...d.versions, version], activeVersionId: version.id, updatedAt: nowIso() };
      })
    );
    return created;
  }

  // Real insertion: if `draftId` is the draft currently open in the live
  // editor, the HTML goes in at the cursor (or replaces the selection)
  // exactly as if typed. Otherwise it's appended to the stored document and
  // logged as a new version, so a clause can be added to any draft, not only
  // the one on screen.
  function insertContentIntoDraft(draftId, html, { sectionLabel, replaceSelection = false } = {}) {
    const label = sectionLabel ? `Inserted clause — ${sectionLabel}` : "Inserted clause";
    const live = liveEditorRef.current;
    if (live && live.draftId === draftId && live.editor && !live.editor.isDestroyed) {
      const chain = live.editor.chain().focus();
      if (replaceSelection) chain.deleteSelection();
      chain.insertContent(html).run();
      saveVersion(draftId, live.editor.getJSON(), label);
      setActiveDraftId(draftId);
      return true;
    }

    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        const current = getActiveVersion(d);
        const fragmentJson = generateJSON(html, editorExtensions);
        const newDoc = { ...current.contentJson, content: [...(current.contentJson.content || []), ...(fragmentJson.content || [])] };
        const version = makeVersion({ contentJson: newDoc, action: label, number: d.versions.length + 1 });
        return { ...d, versions: [...d.versions, version], activeVersionId: version.id, updatedAt: nowIso() };
      })
    );
    setActiveDraftId(draftId);
    return false;
  }

  // Kept for the existing Clause Bank modals (AddToDraftModal,
  // CreateDraftFromClausesModal) — same 3-positional-argument shape they
  // already call, now backed by the real insertion above.
  function insertClauseIntoDraft(draftId, clauseHtml, sectionLabel) {
    insertContentIntoDraft(draftId, clauseHtml, { sectionLabel });
    const draft = drafts.find((d) => d.id === draftId);
    const version = draft ? getActiveVersion(draft) : null;
    return version;
  }

  function updateDraftMeta(draftId, patch) {
    setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, ...patch, updatedAt: nowIso() } : d)));
  }

  function updateDraftLayout(draftId, patch) {
    setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, layout: { ...d.layout, ...patch }, updatedAt: nowIso() } : d)));
  }

  function updateDraftDesign(draftId, patch) {
    setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, design: { ...d.design, ...patch }, updatedAt: nowIso() } : d)));
  }

  // Applies a named legal-document preset's real formatting bundle — never
  // touches contentJson, so existing content is preserved.
  function applyPreset(draftId, presetName) {
    const preset = LEGAL_PRESETS[presetName];
    if (!preset) return;
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? { ...d, design: { ...d.design, ...preset.design, preset: presetName }, layout: { ...d.layout, ...preset.layout }, updatedAt: nowIso() }
          : d
      )
    );
  }

  function updateHeaderFooter(draftId, { headerHtml, footerHtml }) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? { ...d, ...(headerHtml !== undefined ? { headerHtml } : {}), ...(footerHtml !== undefined ? { footerHtml } : {}), updatedAt: nowIso() }
          : d
      )
    );
  }

  return (
    <DraftsContext.Provider
      value={{
        drafts,
        activeDraftId,
        setActiveDraftId,
        addDraft,
        saveVersion,
        restoreVersion,
        insertClauseIntoDraft,
        insertContentIntoDraft,
        updateDraftMeta,
        updateDraftLayout,
        updateDraftDesign,
        applyPreset,
        updateHeaderFooter,
        registerLiveEditor,
        unregisterLiveEditor,
        getLiveEditor,
        getActiveVersion,
      }}
    >
      {children}
    </DraftsContext.Provider>
  );
}

export function useDrafts() {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error("useDrafts must be used within a DraftsProvider");
  return ctx;
}
