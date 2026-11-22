"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { generateJSON } from "@tiptap/html";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { editorExtensions, jsonToText } from "./editor/extensions";

const DraftsContext = createContext(null);

function nowIso() {
  return new Date().toISOString();
}

function newUuid() {
  return crypto.randomUUID();
}

// LegalParagraph (extensions.js) is Paragraph.extend()'d without a `name`
// override, so its real registered node type is still "paragraph" — the
// "legalParagraph" node name was never actually registered anywhere, which
// made every brand-new blank draft fail to parse the moment it loaded
// ("Unknown node type: legalParagraph").
function emptyDoc() {
  return { type: "doc", content: [{ type: "paragraph", content: [] }] };
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

function makeVersion({ id, contentJson, action, number, label, authorName }) {
  return {
    id: id || newUuid(),
    number,
    label: label || `v${number}`,
    contentJson,
    contentText: jsonToText(contentJson),
    createdAt: nowIso(),
    createdBy: authorName,
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
  customMargins: null, // { top, bottom, left, right } in px, used when margin === "custom"
  pageNumbers: null, // { position: "header-left"|"header-right"|"footer-left"|"footer-right", format: "plain"|"pageN"|"pageNofM" }
  hyphenation: false,
  protected: false, // Review → Protect: read-only for everyone until switched off
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

// Backed by Supabase (app/api/drafts/*) instead of a single hardcoded seed
// draft. Every exported method keeps its exact original signature and
// synchronous return behavior — critically, addDraft/saveVersion/
// restoreVersion all still return a usable {id, ...} object immediately,
// because the id is generated client-side (crypto.randomUUID()) and sent to
// the server as part of the create payload, rather than waiting on the
// server to assign one. That's what lets AddToDraftModal, PartnershipDeedEngine,
// and SendForReviewModal keep using the return value synchronously with zero
// changes to their own logic.
export function DraftsProvider({ children }) {
  const currentUser = useCurrentUser();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDraftId, setActiveDraftId] = useState(null);

  const liveEditorRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/drafts")
      .then((data) => {
        if (cancelled) return;
        setDrafts(data);
        if (data.length) setActiveDraftId((prev) => prev || data[0].id);
      })
      .catch((err) => console.error("[DraftsContext] initial load failed", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  function addDraft({ title, type, linkedCaseNo, clientName, description, contentJson, blocks }) {
    let doc = contentJson;
    if (!doc && blocks && blocks.length) {
      doc = generateJSON(blocks.map((b) => b.html).join(""), editorExtensions);
    }
    if (!doc) doc = emptyDoc();

    const v1 = makeVersion({ contentJson: doc, action: "Created", number: 1, authorName: currentUser.name });
    const entry = {
      id: newUuid(),
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

    fetchJson("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, versionId: v1.id, title, type: entry.type, caseNo: linkedCaseNo, clientName, description, contentJson: doc }),
    }).catch((err) => console.error("[DraftsContext] addDraft persist failed", err));

    return entry;
  }

  // Only creates a new version when the document genuinely changed since
  // the last saved one — autosave doesn't spam the version list.
  function saveVersion(draftId, contentJson, action = "Edited") {
    let created = null;
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        const current = getActiveVersion(d);
        // Compare the whole document, not just its text, so formatting-only
        // edits (bold, alignment, colour, tracked-change marks) are saved too.
        if (current && JSON.stringify(current.contentJson) === JSON.stringify(contentJson)) return d;
        const version = makeVersion({ contentJson, action, number: d.versions.length + 1, authorName: currentUser.name });
        created = version;
        return { ...d, versions: [...d.versions, version], activeVersionId: version.id, updatedAt: nowIso() };
      })
    );
    if (created) {
      fetchJson(`/api/drafts/${draftId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: created.id, contentJson, action, label: created.label }),
      }).catch((err) => console.error("[DraftsContext] saveVersion persist failed", err));
    }
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
        const version = makeVersion({
          contentJson: target.contentJson,
          action: `Restored from ${target.label}`,
          number: d.versions.length + 1,
          authorName: currentUser.name,
        });
        created = version;
        return { ...d, versions: [...d.versions, version], activeVersionId: version.id, updatedAt: nowIso() };
      })
    );
    if (created) {
      fetchJson(`/api/drafts/${draftId}/versions/${versionId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: created.id }),
      }).catch((err) => console.error("[DraftsContext] restoreVersion persist failed", err));
    }
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
        const version = makeVersion({ contentJson: newDoc, action: label, number: d.versions.length + 1, authorName: currentUser.name });
        fetchJson(`/api/drafts/${draftId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: version.id, contentJson: newDoc, action: label, label: version.label }),
        }).catch((err) => console.error("[DraftsContext] insertContentIntoDraft persist failed", err));
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

  function persistMeta(draftId, patch) {
    fetchJson(`/api/drafts/${draftId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch((err) =>
      console.error("[DraftsContext] meta update failed", err)
    );
  }

  function updateDraftMeta(draftId, patch) {
    setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, ...patch, updatedAt: nowIso() } : d)));
    const { linkedCaseNo, ...rest } = patch;
    persistMeta(draftId, { ...rest, ...(linkedCaseNo !== undefined ? { caseNo: linkedCaseNo } : {}) });
  }

  function updateDraftLayout(draftId, patch) {
    setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, layout: { ...d.layout, ...patch }, updatedAt: nowIso() } : d)));
    persistMeta(draftId, { layout: patch });
  }

  function updateDraftDesign(draftId, patch) {
    setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, design: { ...d.design, ...patch }, updatedAt: nowIso() } : d)));
    persistMeta(draftId, { design: patch });
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
    persistMeta(draftId, { design: { ...preset.design, preset: presetName }, layout: preset.layout });
  }

  function updateHeaderFooter(draftId, { headerHtml, footerHtml }) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? { ...d, ...(headerHtml !== undefined ? { headerHtml } : {}), ...(footerHtml !== undefined ? { footerHtml } : {}), updatedAt: nowIso() }
          : d
      )
    );
    persistMeta(draftId, { ...(headerHtml !== undefined ? { headerHtml } : {}), ...(footerHtml !== undefined ? { footerHtml } : {}) });
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
        loading,
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
