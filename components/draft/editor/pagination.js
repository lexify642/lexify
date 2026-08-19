// Real, measurement-driven Word-style pagination for the live TipTap
// document. There is no built-in way to split a single contenteditable
// across separate fixed-height page frames while keeping it one editable
// document (that's why Google Docs/Word don't use contenteditable at all —
// they run their own layout engine). This does the honest achievable
// version instead: keep ONE continuous contenteditable (so every existing
// feature — comments, footnotes, tables, cross-reference scroll-to, undo —
// keeps working untouched), and on every content change, measure the
// rendered height of each top-level block and push any block that would
// overflow the current page's printable area down onto the next page.
//
// The push is a real ProseMirror Decoration (padding-top on the node),
// not a directly-mutated DOM style. That distinction matters: ProseMirror
// owns and re-renders its own DOM on every transaction, so a style set by
// reaching into the DOM from outside gets silently clobbered the next time
// ProseMirror redraws that node (which happens on nearly every keystroke
// near the edit point) — text would visibly bleed into the inter-page gap
// again a few keystrokes later. A Decoration is recomputed by ProseMirror
// itself as part of its own render cycle, so it survives every subsequent
// edit until this module explicitly clears or replaces it. It's also
// genuinely invisible to the document model: it never appears in
// getJSON(), never touches undo history, and never triggers "update"
// (ProseMirror only emits that for transactions that change the document;
// a metadata-only decoration transaction doesn't).
//
// Known, honest limitation: a single block taller than one full page's
// printable height (an unusually large table or image) can't be split by
// this technique — it will simply extend past that page's edge on screen.
// PDF export (pdfExport.js) paginates independently from the raw document
// JSON and handles this correctly regardless.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const paginationPluginKey = new PluginKey("pagination");

export const PaginationExtension = Extension.create({
  name: "pagination",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: paginationPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, decorationSet) {
            const spacers = tr.getMeta(paginationPluginKey);
            if (spacers) {
              const decorations = spacers.map(({ pos, endPos, push }) => Decoration.node(pos, endPos, { style: `padding-top:${push}px` }));
              return DecorationSet.create(tr.doc, decorations);
            }
            return decorationSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return paginationPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

export const PAGE_DIMENSIONS = {
  A4: { width: 690, height: 976 },
  A3: { width: 980, height: 1386 },
  Letter: { width: 660, height: 854 },
  Legal: { width: 660, height: 1087 },
};

const MARGIN_VALUES = {
  normal: { v: 52, h: 65 },
  narrow: { v: 30, h: 34 },
  moderate: { v: 40, h: 50 },
};

export const PAGE_GAP = 32;

// Derives real on-screen page geometry from the Layout tab's settings.
// Landscape is a true width/height swap (not an arbitrary widen-by-factor)
// so page HEIGHT — the number that actually drives pagination — is
// meaningful rather than approximate.
export function pageMetricsFor(layout) {
  let base = PAGE_DIMENSIONS[layout.pageSize] || PAGE_DIMENSIONS.A4;
  if (layout.pageSize === "Custom") {
    const width = layout.customPageWidth || base.width;
    const height = layout.customPageHeight || Math.round(width * 1.414);
    base = { width, height };
  }
  const { width, height } = layout.orientation === "landscape" ? { width: base.height, height: base.width } : base;

  const margin = layout.margin === "custom" && layout.customMargin ? { v: layout.customMargin, h: layout.customMargin } : MARGIN_VALUES[layout.margin] || MARGIN_VALUES.normal;

  return {
    width,
    height,
    marginTop: margin.v,
    marginBottom: margin.v,
    marginLeft: margin.h,
    marginRight: margin.h,
    printableHeight: height - margin.v * 2,
    gap: PAGE_GAP,
    columns: layout.columns || 1,
  };
}

// Measures the live rendered top-level blocks (editor.view.dom.children)
// against the document's own top-level nodes (same order, same count) to
// recover each block's real ProseMirror position, decides which need
// pushing onto the next page, and dispatches ONE metadata-only transaction
// carrying the result — clearing prior spacers first so this is idempotent
// and reflects the current content exactly (this is what makes "if content
// is deleted, pagination automatically adjusts" genuinely true rather than
// only ever growing).
export function paginateContent(editor, metrics) {
  const { view } = editor;
  const root = view?.dom;
  if (!root) return 1;

  // Clear existing spacers first so this measurement isn't biased by
  // pushes computed on a previous pass.
  view.dispatch(view.state.tr.setMeta(paginationPluginKey, []));

  const { printableHeight, height: pageOuterHeight, gap } = metrics;
  const domBlocks = Array.from(root.children).filter((el) => el.nodeType === 1);
  const topNodes = [];
  view.state.doc.forEach((node, offset) => topNodes.push({ node, offset }));

  let pageStart = 0;
  let pageIndex = 0;
  const spacers = [];

  domBlocks.forEach((el, i) => {
    // el.offsetTop must reflect every push already dispatched earlier in
    // this same pass — otherwise pageStart (which jumps ahead by a full
    // page+gap on every push) and the still-unshifted natural offsetTop of
    // later blocks fall out of sync, silently under-detecting overflow
    // several blocks later. Dispatching after each push (not once at the
    // end) keeps every subsequent read in the same coordinate space.
    const top = el.offsetTop;
    const posInPage = top - pageStart;
    const bottomEdge = posInPage + el.offsetHeight;
    if (posInPage > 0.5 && bottomEdge > printableHeight + 0.5) {
      const pushDown = pageOuterHeight + gap - posInPage;
      const entry = topNodes[i];
      if (entry) {
        spacers.push({ pos: entry.offset, endPos: entry.offset + entry.node.nodeSize, push: pushDown });
        view.dispatch(view.state.tr.setMeta(paginationPluginKey, [...spacers]));
      }
      pageIndex += 1;
      pageStart += pageOuterHeight + gap;
    }
  });

  return domBlocks.length ? pageIndex + 1 : 1;
}
