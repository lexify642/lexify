"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import "katex/dist/katex.min.css";
import { buildExtensions } from "./extensions";
import { applyPageSetup, editorDom, marginsFor, pageAtY, pageMetricsFor, paginationOptionsFor, renderedPageCount, syncPageBreakSpacers } from "./pagination";
import { useDrafts } from "../DraftsContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import RibbonTabs from "./ribbon/RibbonTabs";
import CommentsPanel from "./modals/CommentsPanel";
import ReferencesPanel from "./modals/ReferencesPanel";
import ReviewingPane from "./modals/ReviewingPane";
import { HorizontalRuler, VerticalRuler } from "./Rulers";
import { canEditDraft } from "../permissions";

const AUTOSAVE_DEBOUNCE_MS = 1500;
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;

function countWords(text) {
  const trimmed = (text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function pageBackgroundColor(pageBackground) {
  if (pageBackground === "ivory") return "#f8f5ee";
  if (pageBackground === "secondary") return "#f6f9fc";
  return "#ffffff";
}

// The Word-style editing surface: ribbon on top, a grey canvas with real
// A4/Letter/Legal pages (tiptap-pagination-plus draws the page frames,
// running headers/footers and automatic page breaks), rulers, and a status
// bar with page X of Y, word count and a zoom slider.
//
// Content stays in sync with DraftsContext's version model exactly as
// before: typing debounce-saves a new version (autosave to the user's
// account), and an externally-driven change (Version History → Restore,
// Compare → Accept, Import Updated Draft) is detected by activeVersion.id
// moving without this editor having produced it, and pulled back in.
export default function DraftEditor({ draft, onSaveStateChange, onSaveNow, onPrint, onExportDocx, onExportPdf, onImportDocx }) {
  const { getActiveVersion, saveVersion, registerLiveEditor, unregisterLiveEditor, updateDraftLayout } = useDrafts();
  const currentUser = useCurrentUser();
  const activeVersion = getActiveVersion(draft);

  const lastSyncedVersionId = useRef(activeVersion.id);
  const saveTimerRef = useRef(null);
  const layoutFrameRef = useRef(null);
  const zoomInnerRef = useRef(null);

  const [activePanel, setActivePanel] = useState(null); // null | "comments" | "references" | "reviewing"
  const [zoom, setZoom] = useState(100);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });
  const [innerSize, setInnerSize] = useState({ width: 0, height: 0 });
  const [showRuler, setShowRuler] = useState(true);
  const [showMarks, setShowMarks] = useState(false);
  const [spellcheck, setSpellcheck] = useState(true);
  const [trackChanges, setTrackChangesState] = useState(false);
  const [markup, setMarkup] = useState("all"); // "all" | "simple" | "none" | "original"

  const isProtected = !!draft.layout.protected;
  const editable = canEditDraft(currentUser) && !isProtected;

  const editor = useEditor(
    {
      extensions: buildExtensions({ live: true, author: currentUser.name, pagination: paginationOptionsFor(draft) }),
      content: activeVersion.contentJson,
      editable,
      immediatelyRender: false,
      editorProps: { attributes: { spellcheck: "true", "aria-label": "Document" } },
      onUpdate: ({ editor: instance }) => {
        onSaveStateChange?.("unsaved");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          onSaveStateChange?.("saving");
          const created = saveVersion(draft.id, instance.getJSON(), "Edited");
          if (created) lastSyncedVersionId.current = created.id;
          onSaveStateChange?.("saved");
        }, AUTOSAVE_DEBOUNCE_MS);
      },
    },
    [draft.id]
  );

  const wordCount =
    useEditorState({
      editor,
      selector: ({ editor: ed }) => (ed ? countWords(ed.getText()) : 0),
    }) || 0;

  // TipTap v3 (immediatelyRender: false) creates the editor first and only
  // attaches it to the page once <EditorContent> mounts; until then
  // editor.view.dom throws. Anything that touches the page DOM — including
  // the pagination extension, which measures it on every transaction —
  // waits for this.
  const [mountedEditor, setMountedEditor] = useState(null);
  const isMounted = !!editor && mountedEditor === editor;
  useEffect(() => {
    if (!editor) return undefined;
    const markMounted = () => setMountedEditor(editor);
    editor.on("mount", markMounted);
    // Already attached before this effect subscribed.
    if (editorDom(editor)) queueMicrotask(markMounted);
    return () => editor.off("mount", markMounted);
  }, [editor]);

  // After any change: re-size manual page breaks and refresh page X of Y.
  // Runs a frame later so the pagination extension has redrawn first.
  const refreshLayout = useCallback(() => {
    if (layoutFrameRef.current) cancelAnimationFrame(layoutFrameRef.current);
    layoutFrameRef.current = requestAnimationFrame(() => {
      const root = editorDom(editor);
      if (!root) return;
      syncPageBreakSpacers(root);
      const total = renderedPageCount(root);
      let current = 1;
      try {
        const coords = editor.view.coordsAtPos(editor.state.selection.head);
        current = pageAtY(root, coords.top);
      } catch {
        current = 1;
      }
      setPageInfo((prev) => (prev.current === current && prev.total === total ? prev : { current, total }));
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return undefined;
    lastSyncedVersionId.current = activeVersion.id;
    registerLiveEditor(draft.id, editor);
    editor.on("transaction", refreshLayout);
    // A second pass after webfonts settle (their metrics move line breaks).
    const fontTimer = setTimeout(refreshLayout, 400);
    document.fonts?.ready?.then(refreshLayout);
    return () => {
      editor.off("transaction", refreshLayout);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (layoutFrameRef.current) cancelAnimationFrame(layoutFrameRef.current);
      clearTimeout(fontTimer);
      unregisterLiveEditor(draft.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    if (!isMounted || editor.isDestroyed) return;
    if (activeVersion.id === lastSyncedVersionId.current) return;
    editor.commands.setContent(activeVersion.contentJson, { emitUpdate: false });
    lastSyncedVersionId.current = activeVersion.id;
    onSaveStateChange?.("saved");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, activeVersion.id]);

  // Page size, orientation, margins, columns, header/footer, page numbers.
  useEffect(() => {
    if (!isMounted) return;
    applyPageSetup(editor, draft);
    refreshLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, JSON.stringify(draft.layout), draft.headerHtml, draft.footerHtml, draft.design.fontPairing, draft.design.spacing]);

  useEffect(() => {
    if (isMounted && !editor.isDestroyed) editor.setEditable(editable);
  }, [editor, isMounted, editable]);

  useEffect(() => {
    editorDom(editor)?.setAttribute("spellcheck", spellcheck ? "true" : "false");
  }, [editor, isMounted, spellcheck]);

  function setTrackChanges(on) {
    setTrackChangesState(on);
    editor?.commands.setTrackChanges(on);
  }

  // Keep the scaled page stack's scroll area the right size: transform
  // doesn't affect layout, so the wrapper is sized to the scaled box.
  useLayoutEffect(() => {
    const inner = zoomInnerRef.current;
    if (!inner || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => setInnerSize({ width: inner.offsetWidth, height: inner.offsetHeight }));
    observer.observe(inner);
    return () => observer.disconnect();
  }, [editor]);

  // Ctrl+P print, Ctrl+S save now, Ctrl+Alt+= / - zoom. (Ctrl+B/I/U/Z/Y and
  // the rest are the editor's own keymaps.)
  useEffect(() => {
    function onKeyDown(event) {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === "p" && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onPrint?.();
      } else if (key === "s" && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onSaveNow?.();
      } else if (event.altKey && (key === "=" || key === "+")) {
        event.preventDefault();
        setZoom((z) => Math.min(ZOOM_MAX, z + 10));
      } else if (event.altKey && key === "-") {
        event.preventDefault();
        setZoom((z) => Math.max(ZOOM_MIN, z - 10));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onPrint, onSaveNow]);

  const metrics = pageMetricsFor(draft.layout);
  const margins = marginsFor(draft.layout);
  const scale = zoom / 100;

  function changeMargins(patch) {
    updateDraftLayout(draft.id, { margin: "custom", customMargins: { ...margins, ...patch } });
  }

  const wordStats = useCallback(() => {
    if (!editor) return null;
    const { from, to, empty } = editor.state.selection;
    const text = empty ? editor.getText({ blockSeparator: "\n" }) : editor.state.doc.textBetween(from, to, "\n");
    let paragraphs = 0;
    const scan = (node) => {
      if (node.isTextblock && node.textContent.trim()) paragraphs += 1;
    };
    if (empty) editor.state.doc.descendants(scan);
    else editor.state.doc.nodesBetween(from, to, scan);
    return {
      scope: empty ? "document" : "selection",
      pages: pageInfo.total,
      words: countWords(text),
      chars: text.replace(/\n/g, "").length,
      charsNoSpaces: text.replace(/\s/g, "").length,
      paragraphs,
    };
  }, [editor, pageInfo.total]);

  const ui = useMemo(
    () => ({
      zoom,
      setZoom,
      showRuler,
      setShowRuler,
      showMarks,
      setShowMarks,
      spellcheck,
      setSpellcheck,
      trackChanges,
      setTrackChanges,
      markup,
      setMarkup,
      pageInfo,
      wordStats,
      onPrint,
      onSaveNow,
      onExportDocx,
      onExportPdf,
      onImportDocx,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zoom, showRuler, showMarks, spellcheck, trackChanges, markup, pageInfo, wordStats, onPrint, onSaveNow, onExportDocx, onExportPdf, onImportDocx]
  );

  if (!editor) {
    return (
      <div className="word-shell">
        <div className="word-canvas">
          <div className="document-loading">Loading editor…</div>
        </div>
      </div>
    );
  }

  const paginated = metrics.columns <= 1;
  const docClassName = [
    "document",
    "word-document",
    `font-${draft.design.fontPairing}`,
    `spacing-${draft.design.spacing}`,
    draft.layout.lineNumbers ? "line-numbers" : "",
    draft.layout.hyphenation ? "hyphenate" : "",
    draft.design.pageBorder ? "page-border" : "",
    showMarks ? "show-marks" : "",
    `markup-${markup}`,
  ]
    .filter(Boolean)
    .join(" ");

  const pageStride = metrics.height + metrics.gap;

  return (
    <div className={`word-shell${activePanel ? " with-side-panel" : ""}`}>
      <RibbonTabs editor={editor} draft={draft} activePanel={activePanel} onTogglePanel={(panel) => setActivePanel((current) => (current === panel ? null : panel))} ui={ui} zoom={zoom} onZoomChange={setZoom} />

      {isProtected && (
        <div className="word-banner" role="status">
          This document is protected — editing is turned off. {canEditDraft(currentUser) ? "Review → Protect to turn it back on." : ""}
        </div>
      )}

      <div className="word-body">
        <div
          className="word-canvas"
          onClick={(event) => {
            const refEl = event.target.closest?.(".doc-reference");
            if (!refEl) return;
            event.preventDefault();
            const target = refEl.dataset.refTarget?.trim();
            let match = null;
            const root = editorDom(editor);
            if (!root) return;
            if (refEl.dataset.refType === "bookmark") match = root.querySelector(`[data-bookmark="${CSS.escape(target || "")}"]`);
            else match = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6")).find((el) => el.textContent.trim() === target);
            match?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <div className="word-zoom" style={{ width: innerSize.width * scale || undefined, height: innerSize.height * scale || undefined }}>
            <div ref={zoomInnerRef} className="word-zoom-inner" style={{ transform: scale !== 1 ? `scale(${scale})` : undefined }}>
              {showRuler && paginated && (
                <div className="word-ruler-row">
                  <div className="word-ruler-corner" />
                  <HorizontalRuler width={metrics.width} marginLeft={metrics.marginLeft} marginRight={metrics.marginRight} scale={scale} onChangeMargins={changeMargins} />
                </div>
              )}
              <div className="word-page-row">
                {showRuler && paginated && (
                  <VerticalRuler
                    pageHeight={metrics.height}
                    pageGap={metrics.gap}
                    pageCount={pageInfo.total}
                    marginTop={metrics.marginTop}
                    marginBottom={metrics.marginBottom}
                    scale={scale}
                    onChangeMargins={changeMargins}
                  />
                )}
                <div className="word-page-column" style={{ "--page-bg": pageBackgroundColor(draft.design.pageBackground), width: metrics.width }}>
                  {draft.design.watermark &&
                    paginated &&
                    Array.from({ length: pageInfo.total }).map((_, i) => (
                      <div key={i} className="doc-watermark word-watermark" aria-hidden="true" style={{ top: i * pageStride + metrics.height / 2 }}>
                        {draft.design.watermark}
                      </div>
                    ))}
                  <EditorContent
                    editor={editor}
                    className={docClassName}
                    style={
                      paginated
                        ? undefined
                        : {
                            width: metrics.width,
                            padding: `${metrics.marginTop}px ${metrics.marginRight}px ${metrics.marginBottom}px ${metrics.marginLeft}px`,
                            columnCount: metrics.columns,
                            columnGap: "32px",
                          }
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {activePanel === "comments" && <CommentsPanel draft={draft} editor={editor} onClose={() => setActivePanel(null)} />}
        {activePanel === "references" && <ReferencesPanel draft={draft} editor={editor} onClose={() => setActivePanel(null)} />}
        {activePanel === "reviewing" && <ReviewingPane draft={draft} editor={editor} onClose={() => setActivePanel(null)} />}
      </div>

      <div className="word-status-bar">
        <span>{paginated ? `Page ${pageInfo.current} of ${pageInfo.total}` : `${metrics.columns} columns`}</span>
        <span>
          {wordCount.toLocaleString("en-IN")} word{wordCount === 1 ? "" : "s"}
        </span>
        <span>
          {draft.layout.pageSize} · {draft.layout.orientation === "landscape" ? "Landscape" : "Portrait"}
        </span>
        {trackChanges && <span className="word-status-flag">Track Changes: On</span>}
        {isProtected && <span className="word-status-flag">Protected</span>}
        <span className="word-status-spacer" />
        <div className="word-zoom-control">
          <button type="button" onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 10))} aria-label="Zoom out" title="Zoom out">
            −
          </button>
          <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={5} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" />
          <button type="button" onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 10))} aria-label="Zoom in" title="Zoom in">
            +
          </button>
          <button type="button" className="word-zoom-value" onClick={() => setZoom(100)} title="Reset to 100%">
            {zoom}%
          </button>
        </div>
      </div>
    </div>
  );
}
