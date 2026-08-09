"use client";

import { useEffect, useState } from "react";
import { useDrafts } from "./DraftsContext";
import DraftEditor from "./editor/DraftEditor";
import { downloadDraftPdf } from "./editor/pdfExport";
import { exportDraftAsWord } from "./editor/wordExport";
import VersionHistoryPanel from "./editor/modals/VersionHistoryPanel";

const SAVE_LABELS = { saved: "Saved", saving: "Saving…", unsaved: "Unsaved changes" };

// The Draft Editor's own page — no tab bar, no Clause Bank/Template Bank
// content. Owns the page header (title, save status, Save/Export actions);
// DraftEditor owns the ribbon + live TipTap surface underneath it.
export default function DraftEditorWorkspace() {
  const { drafts, activeDraftId, getLiveEditor, saveVersion, getActiveVersion } = useDrafts();
  const [saveState, setSaveState] = useState("saved");
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const activeDraft = drafts.find((d) => d.id === activeDraftId) || drafts[0];

  useEffect(() => {
    setSaveState("saved");
  }, [activeDraftId]);

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

  function handleSaveDraft() {
    const editor = getLiveEditor(activeDraft.id);
    if (!editor) return;
    setSaveState("saving");
    saveVersion(activeDraft.id, editor.getJSON(), "Saved");
    setSaveState("saved");
  }

  function currentVersionForExport() {
    const editor = getLiveEditor(activeDraft.id);
    if (editor) {
      const created = saveVersion(activeDraft.id, editor.getJSON(), "Exported");
      if (created) return created;
    }
    return getActiveVersion(activeDraft);
  }

  function handleExportPdf() {
    downloadDraftPdf(activeDraft, currentVersionForExport());
  }

  function handleExportWord() {
    exportDraftAsWord(activeDraft, currentVersionForExport());
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Lexi Draft</h1>
          <p className="page-subtitle">{activeDraft.title}</p>
        </div>
        <div className="header-actions">
          <span className={`draft-save-state draft-save-state-${saveState}`}>{SAVE_LABELS[saveState]}</span>
          <button className="btn btn-outline" onClick={handleSaveDraft}>
            Save Draft
          </button>
          <button className="btn btn-outline" onClick={() => setShowVersionHistory(true)}>
            Version History
          </button>
          <button className="btn btn-outline" onClick={handleExportWord}>
            Export Word
          </button>
          <button className="btn" onClick={handleExportPdf}>
            Export PDF
          </button>
        </div>
      </div>

      <DraftEditor key={activeDraft.id} draft={activeDraft} onSaveStateChange={setSaveState} />
      {showVersionHistory && <VersionHistoryPanel draft={activeDraft} onClose={() => setShowVersionHistory(false)} />}
    </div>
  );
}
