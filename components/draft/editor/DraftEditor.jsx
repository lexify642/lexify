"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "./extensions";
import { pageMetricsFor, paginateContent } from "./pagination";
import { useDrafts } from "../DraftsContext";
import RibbonTabs from "./ribbon/RibbonTabs";
import CommentsPanel from "./modals/CommentsPanel";
import ReferencesPanel from "./modals/ReferencesPanel";
import { canEditDraft } from "../permissions";

const AUTOSAVE_DEBOUNCE_MS = 1500;

function countWords(text) {
  const trimmed = (text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function pageBackgroundColor(pageBackground) {
  if (pageBackground === "ivory") return "var(--ivory)";
  if (pageBackground === "secondary") return "var(--page-secondary)";
  return "#fff";
}

// The live editing surface: a real TipTap instance backing the ribbon, kept
// in sync with DraftsContext's version model. Typing debounce-saves into a
// new version (only when content genuinely changed); an externally-driven
// change (Version History → Restore, Compare → Accept, Import Updated
// Draft) is detected by activeVersion.id moving without this editor having
// produced it, and is pulled back in via setContent rather than fought.
//
// The document renders as real, fixed-height A4/A3/Letter/Legal pages (see
// pagination.js) — one continuous contenteditable underneath (so comments,
// footnotes, tables, and cross-reference scrolling all keep working
// untouched), with white "page" rectangles drawn behind it and overflowing
// content pushed onto the next page via measured spacers, not a background
// illusion. Multi-column layout (Layout tab → Columns) uses CSS column
// flow instead, which is a different flow model pagination can't combine
// with, so pagination is skipped (single tall page) whenever columns > 1.
export default function DraftEditor({ draft, onSaveStateChange }) {
  const { getActiveVersion, saveVersion, registerLiveEditor, unregisterLiveEditor } = useDrafts();
  const activeVersion = getActiveVersion(draft);

  const lastSyncedVersionId = useRef(activeVersion.id);
  const saveTimerRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const paginateFrameRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [activePanel, setActivePanel] = useState(null); // null | "comments" | "references"
  const [zoom, setZoom] = useState(100);
  const [pageCount, setPageCount] = useState(1);

  function runPagination(targetEditor) {
    if (paginateFrameRef.current) cancelAnimationFrame(paginateFrameRef.current);
    paginateFrameRef.current = requestAnimationFrame(() => {
      if (!targetEditor || targetEditor.isDestroyed) return;
      const metrics = pageMetricsFor(draftRef.current.layout);
      setPageCount(metrics.columns > 1 ? 1 : paginateContent(targetEditor, metrics));
    });
  }

  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: activeVersion.contentJson,
      editable: canEditDraft(),
      immediatelyRender: false,
      onUpdate: ({ editor: instance }) => {
        onSaveStateChange?.("unsaved");
        setWordCount(countWords(instance.getText()));
        runPagination(instance);
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
    // Initial pagination once the DOM has actually painted, plus a second
    // pass shortly after for late webfont metric shifts (FOUT/FOIT) that a
    // same-tick measurement would miss.
    runPagination(editor);
    const fontTimer = setTimeout(() => runPagination(editor), 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (paginateFrameRef.current) cancelAnimationFrame(paginateFrameRef.current);
      clearTimeout(fontTimer);
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
    runPagination(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVersion.id]);

  // Anything that changes rendered block heights (margins, page size,
  // orientation, columns, font pairing/spacing, zoom) needs a fresh
  // pagination pass — the content itself hasn't changed, only how tall it
  // renders.
  useEffect(() => {
    if (!editor) return;
    runPagination(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editor,
    draft.layout.margin,
    draft.layout.customMargin,
    draft.layout.orientation,
    draft.layout.pageSize,
    draft.layout.customPageWidth,
    draft.layout.customPageHeight,
    draft.layout.columns,
    draft.design.fontPairing,
    draft.design.spacing,
    zoom,
  ]);

  if (!editor) {
    return (
      <div className="editor-layout">
        <section className="card editor-card">
          <div className="document-loading">Loading editor…</div>
        </section>
      </div>
    );
  }

  const metrics = pageMetricsFor(draft.layout);
  const paginated = metrics.columns <= 1;

  const docClassName = [
    "document",
    paginated ? "document-paginated" : "",
    `font-${draft.design.fontPairing}`,
    `spacing-${draft.design.spacing}`,
    // Page background/border are drawn by the .document-page-bg rectangles
    // when paginated — applying them here too would paint the content div's
    // own background across the inter-page gaps, hiding them.
    !paginated ? `bg-${draft.design.pageBackground}` : "",
    !paginated && draft.design.pageBorder ? "doc-page-border" : "",
    draft.layout.lineNumbers ? "line-numbers" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const pageStride = metrics.height + metrics.gap;
  const totalStackHeight = paginated ? pageCount * pageStride - metrics.gap : undefined;

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
          style={{ zoom: zoom !== 100 ? zoom / 100 : undefined, minHeight: totalStackHeight }}
          onClick={(event) => {
            const refEl = event.target.closest?.(".doc-reference");
            if (!refEl || refEl.dataset.refType !== "heading") return;
            const headings = editor.view.dom.querySelectorAll("h1, h2, h3");
            const match = Array.from(headings).find((el) => el.textContent.trim() === refEl.dataset.refTarget?.trim());
            match?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          {draft.design.watermark && <div className="doc-watermark" aria-hidden="true">{draft.design.watermark}</div>}

          {paginated &&
            Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                className="document-page-bg"
                style={{
                  top: i * pageStride,
                  width: metrics.width,
                  height: metrics.height,
                  background: pageBackgroundColor(draft.design.pageBackground),
                  ...(draft.design.pageBorder ? { borderWidth: 2, borderColor: "var(--line-strong)" } : null),
                }}
              />
            ))}

          {draft.headerHtml && (
            <div
              className="document-region document-header-region"
              style={{ maxWidth: metrics.width, paddingTop: draft.layout.headerDistance, paddingBottom: draft.layout.headerDistance }}
              dangerouslySetInnerHTML={{ __html: draft.headerHtml }}
            />
          )}
          <EditorContent
            editor={editor}
            className={docClassName}
            style={{
              maxWidth: metrics.width,
              paddingTop: metrics.marginTop,
              paddingBottom: metrics.marginBottom,
              paddingLeft: metrics.marginLeft,
              paddingRight: metrics.marginRight,
              columnCount: metrics.columns > 1 ? metrics.columns : undefined,
              columnGap: metrics.columns > 1 ? "32px" : undefined,
            }}
          />
          {draft.footerHtml && (
            <div
              className="document-region document-footer-region"
              style={{ maxWidth: metrics.width, paddingTop: draft.layout.footerDistance, paddingBottom: draft.layout.footerDistance }}
              dangerouslySetInnerHTML={{ __html: draft.footerHtml }}
            />
          )}
        </div>
        <div className="document-status-bar">
          <span>{wordCount} word{wordCount === 1 ? "" : "s"}</span>
          <span className="document-status-sep">•</span>
          <span>
            {draft.layout.pageSize} · {draft.layout.orientation === "landscape" ? "Landscape" : "Portrait"}
          </span>
          {paginated && (
            <>
              <span className="document-status-sep">•</span>
              <span>
                {pageCount} page{pageCount === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      </section>
      {activePanel === "comments" && <CommentsPanel draft={draft} editor={editor} onClose={() => setActivePanel(null)} />}
      {activePanel === "references" && <ReferencesPanel draft={draft} editor={editor} onClose={() => setActivePanel(null)} />}
    </div>
  );
}
