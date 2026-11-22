// Page geometry for the Draft Editor's paged view.
//
// The actual pagination (page frames, automatic page breaks as text flows,
// running headers/footers with page numbers) is done by the
// `tiptap-pagination-plus` extension (see extensions.js → buildExtensions
// with { live: true }). This module only translates a draft's saved Layout
// settings into that extension's numbers, and sizes manual Page Break nodes
// so the content after one starts on the next page.
//
// All sizes are CSS pixels at 96 dpi — 1in = 96px, 1cm ≈ 37.8px — so an A4
// page is 794 × 1123px, the same as Word's 100% zoom.

export const PX_PER_CM = 96 / 2.54;

export const PAGE_DIMENSIONS = {
  A4: { width: 794, height: 1123, label: "A4 (21 × 29.7 cm)" },
  Letter: { width: 816, height: 1056, label: "Letter (8.5 × 11 in)" },
  Legal: { width: 816, height: 1344, label: "Legal (8.5 × 14 in)" },
  A3: { width: 1123, height: 1587, label: "A3 (29.7 × 42 cm)" },
};

// Word's margin presets.
export const MARGIN_PRESETS = {
  normal: { label: "Normal", top: 96, bottom: 96, left: 96, right: 96 },
  narrow: { label: "Narrow", top: 48, bottom: 48, left: 48, right: 48 },
  moderate: { label: "Moderate", top: 96, bottom: 96, left: 72, right: 72 },
  wide: { label: "Wide", top: 96, bottom: 96, left: 192, right: 192 },
};

export const PAGE_GAP = 24;
export const CANVAS_COLOR = "#e6e7eb";

export function marginsFor(layout = {}) {
  if (layout.margin === "custom") {
    if (layout.customMargins) return { ...MARGIN_PRESETS.normal, ...layout.customMargins };
    // Older drafts stored one number for all four sides.
    if (layout.customMargin) return { top: layout.customMargin, bottom: layout.customMargin, left: layout.customMargin, right: layout.customMargin };
  }
  return MARGIN_PRESETS[layout.margin] || MARGIN_PRESETS.normal;
}

export function pageMetricsFor(layout = {}) {
  let base = PAGE_DIMENSIONS[layout.pageSize] || PAGE_DIMENSIONS.A4;
  if (layout.pageSize === "Custom") {
    const width = layout.customPageWidth || base.width;
    base = { width, height: layout.customPageHeight || Math.round(width * 1.414) };
  }
  const { width, height } = layout.orientation === "landscape" ? { width: base.height, height: base.width } : base;
  const m = marginsFor(layout);
  return {
    width,
    height,
    marginTop: m.top,
    marginBottom: m.bottom,
    marginLeft: m.left,
    marginRight: m.right,
    gap: PAGE_GAP,
    columns: layout.columns || 1,
  };
}

// The header/footer editor stores {{PAGE}} / {{PAGES}} tokens; the
// pagination extension uses {page} / {total}.
function toPaginationTokens(html) {
  return (html || "").replace(/\{\{PAGE\}\}/g, "{page}").replace(/\{\{PAGES\}\}/g, "{total}");
}

export const PAGE_NUMBER_FORMATS = {
  plain: "{page}",
  pageN: "Page {page}",
  pageNofM: "Page {page} of {total}",
};

// Header/footer contents for the pagination extension, combining the
// draft's own header/footer HTML with the Insert → Page Number setting.
export function headerFooterFor(draft) {
  const pn = draft.layout?.pageNumbers || null; // { position: "header-left"|"header-right"|"footer-left"|"footer-right", format }
  const number = pn ? `<span class="doc-page-number">${PAGE_NUMBER_FORMATS[pn.format] || PAGE_NUMBER_FORMATS.plain}</span>` : "";
  let headerLeft = toPaginationTokens(draft.headerHtml);
  let headerRight = "";
  let footerLeft = toPaginationTokens(draft.footerHtml);
  let footerRight = "";
  if (pn?.position === "header-right") headerRight = number;
  if (pn?.position === "header-left") headerLeft = headerLeft ? `${number} ${headerLeft}` : number;
  if (pn?.position === "footer-right") footerRight = number;
  if (pn?.position === "footer-left") footerLeft = footerLeft ? `${number} ${footerLeft}` : number;
  return { headerLeft, headerRight, footerLeft, footerRight };
}

// The pagination extension's options for a draft. Used both when the
// editor is created (the extension's onCreate styles the pages from its
// options) and by applyPageSetup for later changes.
export function paginationOptionsFor(draft) {
  const m = pageMetricsFor(draft.layout);
  const hf = headerFooterFor(draft);
  const firstBlank = !!draft.layout?.differentFirstPage;
  return {
    pageWidth: m.width,
    pageHeight: m.height,
    marginTop: m.marginTop,
    marginBottom: m.marginBottom,
    marginLeft: m.marginLeft,
    marginRight: m.marginRight,
    pageGap: m.gap,
    pageBreakBackground: CANVAS_COLOR,
    ...hf,
    customHeader: firstBlank ? { 1: { headerLeft: "", headerRight: "" } } : {},
    customFooter: firstBlank ? { 1: { footerLeft: "", footerRight: "" } } : {},
    enabled: m.columns <= 1,
  };
}

// Pushes a draft's page settings into the live editor's pagination
// extension. Multi-column layout uses CSS columns, which can't be combined
// with page frames, so pagination is switched off while columns > 1 (the
// same trade-off the previous editor made).
export function applyPageSetup(editor, draft) {
  // The pagination extension measures the page DOM while handling these
  // commands, so they can only run once the editor is on the page.
  if (!editorDom(editor)) return;
  const o = paginationOptionsFor(draft);
  const storage = editor.storage.PaginationPlus;
  // "Different first page" blanks page 1's running head/foot; reset each
  // time so turning it off restores them.
  if (storage) {
    storage.customHeader = o.customHeader;
    storage.customFooter = o.customFooter;
  }
  const chain = editor
    .chain()
    .updatePageWidth(o.pageWidth)
    .updatePageHeight(o.pageHeight)
    .updateMargins({ top: o.marginTop, bottom: o.marginBottom, left: o.marginLeft, right: o.marginRight })
    .updatePageGap(o.pageGap)
    .updatePageBreakBackground(o.pageBreakBackground)
    .updateHeaderContent(o.headerLeft, o.headerRight)
    .updateFooterContent(o.footerLeft, o.footerRight);
  if (o.enabled) chain.enablePagination();
  else chain.disablePagination();
  chain.run();
}

// The editor's page element, or null while the editor isn't attached to
// the page yet (TipTap v3 throws on editor.view.dom until it is).
export function editorDom(editor) {
  if (!editor || editor.isDestroyed) return null;
  try {
    return editor.view.dom || null;
  } catch {
    return null;
  }
}

// The page-gap elements the extension draws between pages, top to bottom.
function pageBreakers(root) {
  return Array.from(root.querySelectorAll("[data-rm-pagination] .breaker"));
}

// Page count as drawn by the extension.
export function renderedPageCount(root) {
  const wrap = root?.querySelector("[data-rm-pagination]");
  return wrap ? Math.max(1, wrap.children.length) : 1;
}

// Which page a viewport y-coordinate falls on: one more than the number of
// page gaps above it. Works at any zoom because it only compares positions.
export function pageAtY(root, y) {
  if (!root) return 1;
  const total = renderedPageCount(root);
  const above = pageBreakers(root).filter((b) => b.getBoundingClientRect().top < y).length;
  return Math.min(total, above + 1);
}

// Manual Page/Section Breaks: each break node holds an inline spacer that is
// grown until the content after it lands below the next page gap. The
// extension lays pages out with full-width floats, which push *lines* (not
// block boxes) past each gap — so the spacer is an inline-block on its own
// line, sized to end just above the next gap.
export function syncPageBreakSpacers(root) {
  if (!root || root.hasAttribute("rm-pagination-disabled")) {
    root?.querySelectorAll(".doc-break-spacer").forEach((el) => (el.style.height = "0px"));
    return;
  }
  const spacers = Array.from(root.querySelectorAll(".doc-break[data-break-type='page'] .doc-break-spacer, .doc-break[data-break-type='section'] .doc-break-spacer"));
  if (!spacers.length) return;
  const scale = root.getBoundingClientRect().height / (root.offsetHeight || 1) || 1;
  spacers.forEach((spacer) => {
    spacer.style.height = "0px";
    const top = spacer.getBoundingClientRect().top;
    const next = pageBreakers(root).find((b) => b.getBoundingClientRect().top > top + 1);
    if (!next) return;
    const gapPx = (next.getBoundingClientRect().top - top) / scale - 2;
    spacer.style.height = `${Math.max(0, Math.floor(gapPx))}px`;
  });
}
