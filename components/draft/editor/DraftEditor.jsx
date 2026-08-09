"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "./extensions";
import { useDrafts } from "../DraftsContext";
import RibbonTabs from "./ribbon/RibbonTabs";
import CommentsPanel from "./modals/CommentsPanel";
import ReferencesPanel from "./modals/ReferencesPanel";
import { canEditDraft } from "../permissions";

const AUTOSAVE_DEBOUNCE_MS = 1500;
const PAGE_WIDTHS = { A4: 690, A3: 980, Letter: 660, Legal: 660 };
const MARGIN_PADDING = { normal: "52px 65px", narrow: "30px 34px", moderate: "40px 50px" };

function countWords(text) {
  const trimmed = (text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function pageWidthFor(layout) {
  const base = layout.pageSize === "Custom" && layout.customPageWidth ? layout.customPageWidth : PAGE_WIDTHS[layout.pageSize] || 690;
  return layout.orientation === "landscape" ? Math.round(base * 1.35) : base;
}

function marginPaddingFor(layout) {
  if (layout.margin === "custom" && layout.customMargin) return `${layout.customMargin}px`;
  return MARGIN_PADDING[layout.margin] || MARGIN_PADDING.normal;
}

// The live editing surface: a real TipTap instance backing the ribbon, kept
// in sync with DraftsContext's version model. Typing debounce-saves into a
// new version (only when content genuinely changed); an externally-driven
// change (Version History → Restore, Compare → Accept, Import Updated
// Draft) is detected by activeVersion.id moving without this editor having
// produced it, and is pulled back in via setContent rather than fought.
export default function DraftEditor({ draft, onSaveStateChange }) {
  const { getActiveVersion, saveVersion, registerLiveEditor, unregisterLiveEditor } = useDrafts();
  const activeVersion = getActiveVersion(draft);

  const lastSyncedVersionId = useRef(activeVersion.id);
  const saveTimerRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [activePanel, setActivePanel] = useState(null); // null | "comments" | "references"
  const [zoom, setZoom] = useState(100);

  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: activeVersion.contentJson,
      editable: canEditDraft(),
      immediatelyRender: false,
      onUpdate: ({ editor: instance }) => {
        onSaveStateChange?.("unsaved");
        setWordCount(countWords(instance.getText()));
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          onSaveStateChange?.("saving");
          const created = saveVersion(draft.id, instance.getJSON(), "Edited");
          if (created) lastSyncedVersionId.current = created.id;
          onSaveStateChange?.("saved");
        }, AUTOSAVE_DEBOUNCE_MS);
      },
      onSelectionUpdate: () => {},
    },
    [draft.id]
  );

  useEffect(() => {
    if (!editor) return undefined;
    lastSyncedVersionId.current = activeVersion.id;
    registerLiveEditor(draft.id, editor);
    setWordCount(countWords(editor.getText()));
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      unregisterLiveEditor(draft.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (activeVersion.id === lastSyncedVersionId.current) return;
    editor.commands.setContent(activeVersion.contentJson, { emitUpdate: false });
    lastSyncedVersionId.current = activeVersion.id;
    onSaveStateChange?.("saved");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVersion.id]);

  if (!editor) {
    return (
      <div className="editor-layout">
        <section className="card editor-card">
          <div className="document-loading">Loading editor…</div>
        </section>
      </div>
    );
  }

  const docClassName = [
    "document",
    `font-${draft.design.fontPairing}`,
    `spacing-${draft.design.spacing}`,
    `bg-${draft.design.pageBackground}`,
    draft.design.pageBorder ? "doc-page-border" : "",
    draft.layout.lineNumbers ? "line-numbers" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`editor-layout draft-editor-layout${activePanel ? " with-comments" : ""}`}>
      <section className="card editor-card draft-editor-card">
        <RibbonTabs
          editor={editor}
          draft={draft}
          activePanel={activePanel}
          onTogglePanel={(panel) => setActivePanel((current) => (current === panel ? null : panel))}
          zoom={zoom}
          onZoomChange={setZoom}
        />
        <div
          className={`document-page-wrap layout-${draft.layout.orientation} margin-${draft.layout.margin}`}
          style={{ zoom: zoom !== 100 ? zoom / 100 : undefined }}
          onClick={(event) => {
            const refEl = event.target.closest?.(".doc-reference");
            if (!refEl || refEl.dataset.refType !== "heading") return;
            const headings = editor.view.dom.querySelectorAll("h1, h2, h3");
            const match = Array.from(headings).find((el) => el.textContent.trim() === refEl.dataset.refTarget?.trim());
            match?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          {draft.design.watermark && <div className="doc-watermark" aria-hidden="true">{draft.design.watermark}</div>}
          {draft.headerHtml && (
            <div
              className="document-region document-header-region"
              style={{ maxWidth: pageWidthFor(draft.layout), paddingTop: draft.layout.headerDistance, paddingBottom: draft.layout.headerDistance }}
              dangerouslySetInnerHTML={{ __html: draft.headerHtml }}
            />
          )}
          <EditorContent
            editor={editor}
            className={docClassName}
            style={{
              maxWidth: pageWidthFor(draft.layout),
              padding: marginPaddingFor(draft.layout),
              columnCount: draft.layout.columns > 1 ? draft.layout.columns : undefined,
              columnGap: draft.layout.columns > 1 ? "32px" : undefined,
            }}
          />
          {draft.footerHtml && (
            <div
              className="document-region document-footer-region"
              style={{ maxWidth: pageWidthFor(draft.layout), paddingTop: draft.layout.footerDistance, paddingBottom: draft.layout.footerDistance }}
              dangerouslySetInnerHTML={{ __html: draft.footerHtml }}
            />
          )}
        </div>
        <div className="document-status-bar">
          <span>{wordCount} word{wordCount === 1 ? "" : "s"}</span>
          <span className="document-status-sep">•</span>
          <span>{draft.layout.pageSize} · {draft.layout.orientation === "landscape" ? "Landscape" : "Portrait"}</span>
        </div>
      </section>
      {activePanel === "comments" && <CommentsPanel draft={draft} editor={editor} onClose={() => setActivePanel(null)} />}
      {activePanel === "references" && <ReferencesPanel draft={draft} editor={editor} onClose={() => setActivePanel(null)} />}
    </div>
  );
}
