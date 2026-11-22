"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useDrafts } from "./DraftsContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import DraftEditor from "./editor/DraftEditor";
import { downloadDraftPdf } from "./editor/pdfExport";
import { exportDraftAsDocx } from "./editor/wordExport";
import { docxToContent, titleFromFileName } from "./editor/docxImport";
import { pageMetricsFor } from "./editor/pagination";

const SAVE_LABELS = { saved: "Saved", saving: "Saving…", unsaved: "Unsaved changes" };

// The Draft Editor page: a Word-style title bar (draft title, save state,
// switch draft) above the ribbon + paged document (DraftEditor). Save,
// export, import and print live in the ribbon's File tab and shortcuts;
// their handlers are here because they act on the whole draft.
export default function DraftEditorWorkspace() {
  const { drafts, activeDraftId, setActiveDraftId, addDraft, loading, getLiveEditor, saveVersion, getActiveVersion, updateDraftMeta } = useDrafts();
  const currentUser = useCurrentUser();
  const [saveState, setSaveState] = useState("saved");
  const [notice, setNotice] = useState(null);
  const [titleDraft, setTitleDraft] = useState(null);

  const activeDraft = drafts.find((d) => d.id === activeDraftId) || drafts[0];

  // Switching drafts resets the save indicator (adjusted during render, not
  // in an effect, per React's guidance).
  const [stateForDraftId, setStateForDraftId] = useState(activeDraftId);
  if (stateForDraftId !== activeDraftId) {
    setStateForDraftId(activeDraftId);
    setSaveState("saved");
    setTitleDraft(null);
  }

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (saveState === "unsaved") {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleSaveNow = useCallback(() => {
    if (!activeDraft) return;
    const editor = getLiveEditor(activeDraft.id);
    if (!editor) return;
    setSaveState("saving");
    const created = saveVersion(activeDraft.id, editor.getJSON(), "Saved");
    setSaveState("saved");
    setNotice(created ? `Saved as ${created.label}.` : "No changes since the last save.");
  }, [activeDraft, getLiveEditor, saveVersion]);

  // Exports always use what's on screen right now, saved first.
  const currentVersionForExport = useCallback(() => {
    const editor = getLiveEditor(activeDraft.id);
    if (editor) {
      const created = saveVersion(activeDraft.id, editor.getJSON(), "Exported");
      if (created) return created;
      return { ...getActiveVersion(activeDraft), contentJson: editor.getJSON() };
    }
    return getActiveVersion(activeDraft);
  }, [activeDraft, getLiveEditor, saveVersion, getActiveVersion]);

  const handleExportPdf = useCallback(() => {
    downloadDraftPdf(activeDraft, currentVersionForExport());
  }, [activeDraft, currentVersionForExport]);

  const handleExportDocx = useCallback(async () => {
    setNotice("Preparing Word document…");
    try {
      await exportDraftAsDocx(activeDraft, currentVersionForExport(), { author: currentUser.name });
      setNotice("Word document downloaded.");
    } catch (err) {
      console.error("[DraftEditorWorkspace] docx export failed", err);
      setNotice("Couldn't create the Word document. Please try again.");
    }
  }, [activeDraft, currentVersionForExport, currentUser.name]);

  const handleImportDocx = useCallback(
    async (file) => {
      const { contentJson, warnings } = await docxToContent(file);
      addDraft({ title: titleFromFileName(file.name), type: "Draft", contentJson });
      setNotice(warnings.length ? `Opened "${file.name}". Some Word formatting couldn't be carried over.` : `Opened "${file.name}" as a new draft.`);
    },
    [addDraft]
  );

  // Ctrl+P / File → Print: prints the pages exactly as laid out on screen
  // (page size and margins come from the draft; the browser's "Save as PDF"
  // gives a PDF that matches the editor).
  const handlePrint = useCallback(() => {
    if (!activeDraft) return;
    const m = pageMetricsFor(activeDraft.layout);
    const style = document.createElement("style");
    style.dataset.draftPrint = "";
    style.textContent = `@page { size: ${m.width}px ${m.height}px; margin: 0; }`;
    document.head.appendChild(style);
    document.body.classList.add("printing-draft");
    const cleanup = () => {
      document.body.classList.remove("printing-draft");
      style.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  }, [activeDraft]);

  function commitTitle() {
    if (titleDraft === null) return;
    const next = titleDraft.trim();
    if (next && next !== activeDraft.title) updateDraftMeta(activeDraft.id, { title: next });
    setTitleDraft(null);
  }

  if (!activeDraft) {
    return (
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Lexi Draft</h1>
            <p className="page-subtitle">{loading ? "Loading…" : "No drafts yet."}</p>
          </div>
          {!loading && (
            <div className="header-actions">
              <button className="btn" onClick={() => addDraft({ title: "Untitled Draft", type: "Draft" })}>
                + New Draft
              </button>
            </div>
          )}
        </div>
        {!loading && (
          <div className="card">
            <p className="empty-inline">Start a blank draft here, or build one from a template, clause collection, or the Partnership Deed generator in the Drafting Library.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="word-page">
      <div className="word-titlebar">
        <FileText size={18} aria-hidden="true" className="word-titlebar-icon" />
        <input
          className="word-title-input"
          value={titleDraft ?? activeDraft.title}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setTitleDraft(null);
              e.currentTarget.blur();
            }
          }}
          aria-label="Draft title"
        />
        <span className={`draft-save-state draft-save-state-${saveState}`} role="status">
          {SAVE_LABELS[saveState]}
        </span>
        {notice && <span className="word-titlebar-notice">{notice}</span>}
        <span className="word-titlebar-spacer" />
        <label className="word-draft-switcher">
          <span className="sr-only">Switch draft</span>
          <select value={activeDraft.id} onChange={(e) => setActiveDraftId(e.target.value)}>
            {drafts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DraftEditor
        key={activeDraft.id}
        draft={activeDraft}
        onSaveStateChange={setSaveState}
        onSaveNow={handleSaveNow}
        onPrint={handlePrint}
        onExportDocx={handleExportDocx}
        onExportPdf={handleExportPdf}
        onImportDocx={handleImportDocx}
      />
    </div>
  );
}
