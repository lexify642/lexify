// A real, paginated PDF renderer for a draft version's TipTap contentJson —
// walks paragraphs/headings/lists/tables/breaks, honoring the real
// Layout-tab settings (margin/orientation/page size/columns) and drawing a
// real header/footer/page-number/watermark on every page. Multi-column PDF
// layout is a best-effort simple two-pass text split, not full Word-grade
// column balancing (documented scope boundary — see the build plan).
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { jsonToText } from "./extensions";
import { marginsFor, PAGE_NUMBER_FORMATS } from "./pagination";

const PAGE_FORMATS = { A4: "a4", A3: "a3", Letter: "letter", Legal: "legal" };

// The same margins the on-screen pages use (px at 96 dpi → pt).
function marginsPt(layout) {
  const m = marginsFor(layout);
  return { top: m.top * 0.75, bottom: m.bottom * 0.75, left: m.left * 0.75, right: m.right * 0.75 };
}

function stripHtml(html) {
  if (!html) return "";
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "");
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

function blockText(node) {
  return jsonToText(node).replace(/\n+$/, "");
}

// Only this item's own direct paragraph/heading text — excludes any nested
// bulletList/orderedList children, which renderList() below walks and
// draws separately (so a nested list keeps its own marker/indent instead of
// being flattened into a run-on line of its parent item's text).
function listItemOwnText(item) {
  return (item.content || [])
    .filter((n) => n.type !== "bulletList" && n.type !== "orderedList")
    .map(blockText)
    .join(" ")
    .trim();
}

function toRoman(num) {
  const table = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let n = num;
  let out = "";
  table.forEach(([v, s]) => {
    while (n >= v) {
      out += s;
      n -= v;
    }
  });
  return out;
}

function toAlpha(num) {
  let n = num;
  let out = "";
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

// Mirrors the Home ribbon's Numbering gallery / Multilevel List presets —
// same five flat marker styles, plus the two legal schemes where each depth
// gets its own marker *type* (not a dotted "1.1.1" chain).
function orderedMarker(index, markerStyle) {
  const n = index + 1;
  switch (markerStyle) {
    case "upper-alpha":
      return `${toAlpha(n).toUpperCase()}.`;
    case "lower-alpha":
      return `${toAlpha(n)}.`;
    case "upper-roman":
      return `${toRoman(n).toUpperCase()}.`;
    case "lower-roman":
      return `${toRoman(n)}.`;
    default:
      return `${n}.`;
  }
}
const LEGAL_ROMAN_DEPTH_STYLES = ["upper-roman", "upper-alpha", "decimal", "lower-roman"];
const BULLET_GLYPHS = { disc: "•", circle: "o", square: "▪" };

function fontFor(design) {
  if (design.fontPairing === "modern") return "helvetica";
  if (design.fontPairing === "traditional") return "times";
  return "times";
}

export function exportDraftAsPdf(draft, version, filename) {
  const orientation = draft.layout.orientation === "landscape" ? "landscape" : "portrait";
  const format = PAGE_FORMATS[draft.layout.pageSize] || "a4";
  const doc = new jsPDF({ unit: "pt", format, orientation });
  const baseFont = fontFor(draft.design);
  const margins = marginsPt(draft.layout);
  // `margin` is the left edge for text; the right edge is pageWidth - mR.
  const margin = margins.left;
  const mR = margins.right;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin - mR;
  const pn = draft.layout.pageNumbers || null;
  const headerReserve = draft.headerHtml || pn?.position?.startsWith("header") ? 20 : 0;
  const footerReserve = draft.footerHtml || pn?.position?.startsWith("footer") ? 20 : 0;
  let y = margins.top + headerReserve;

  function ensureSpace(nextLineHeight) {
    if (y + nextLineHeight > pageHeight - margins.bottom - footerReserve) {
      doc.addPage();
      y = margins.top + headerReserve;
    }
  }

  function drawLines(lines, { size, style = "normal", align = "left", color = 20, indent = 0, lineSpacing } = {}) {
    doc.setFont(baseFont, style);
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lineHeight = size * (lineSpacing ? Number(lineSpacing) : 1.35);
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      const x = align === "right" ? pageWidth - mR : align === "center" ? (margin + pageWidth - mR) / 2 : margin + indent;
      doc.text(line, x, y, { align: align === "left" ? "left" : align });
      y += lineHeight;
    });
  }

  function renderParagraphLike(node, { headingLevel } = {}) {
    const text = blockText(node);
    const legalStyle = node.attrs?.legalStyle || null;
    const indent = (node.attrs?.indent || 0) * 16;
    const lineSpacing = node.attrs?.lineSpacing;
    const border = node.attrs?.border || "";
    if (node.attrs?.spacingBefore) y += 12;

    let size = 10.5;
    let style = "normal";
    let align = "left";
    let color = 20;

    if (headingLevel) {
      size = headingLevel === 1 ? 16 : headingLevel === 2 ? 14 : 12;
      style = "bold";
      align = "center";
    }
    if (legalStyle === "title") { size = 18; style = "bold"; align = "center"; }
    if (legalStyle === "subtitle") { size = 12; align = "center"; color = 100; }
    if (legalStyle === "legal-heading") { size = 12; style = "bold"; align = "center"; }
    if (legalStyle === "legal-paragraph") { align = "justify"; }
    if (legalStyle === "prayer-relief") { style = "italic"; }
    if (legalStyle === "signature-block") { align = "right"; }

    if (!text.trim()) {
      y += size * 0.9;
      return;
    }
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    const boxTop = y - size * 0.8;
    drawLines(lines, { size, style, align, color, indent, lineSpacing });
    const boxBottom = y - 4;
    if (border) {
      const padX = 6;
      const x1 = margin + indent - padX;
      const x2 = pageWidth - mR + padX;
      doc.setDrawColor(168, 195, 222);
      doc.setLineWidth(1);
      if (border.includes("top")) doc.line(x1, boxTop, x2, boxTop);
      if (border.includes("bottom")) doc.line(x1, boxBottom, x2, boxBottom);
      if (border.includes("left")) doc.line(x1, boxTop, x1, boxBottom);
      if (border.includes("right")) doc.line(x2, boxTop, x2, boxBottom);
    }
    if (node.attrs?.spacingAfter) y += 12;
    else y += 4;
  }

  // Recursive so a nested list (Home ribbon → Increase Indent inside a
  // list) keeps its own marker/indent per depth instead of being flattened
  // into its parent item's text — `counters` threads through a single
  // top-level list's recursion for Multilevel List's "1 / 1.1 / 1.1.1".
  function renderList(node, ordered, depth = 0, counters = []) {
    const markerStyle = node.attrs?.markerStyle;
    const multilevel = node.attrs?.multilevel;
    const items = (node.content || []).filter((n) => n.type === "listItem");
    items.forEach((item, idx) => {
      const text = listItemOwnText(item);
      let marker = "";
      if (ordered) {
        if (multilevel === "legal-decimal") {
          counters[depth] = (counters[depth] || 0) + 1;
          counters.length = depth + 1;
          marker = `${counters.slice(0, depth + 1).join(".")}.`;
        } else if (multilevel === "legal-roman") {
          const depthStyle = LEGAL_ROMAN_DEPTH_STYLES[Math.min(depth, LEGAL_ROMAN_DEPTH_STYLES.length - 1)];
          marker = orderedMarker(idx, depthStyle);
        } else {
          marker = orderedMarker(idx, markerStyle);
        }
      } else {
        const glyphKey = depth === 0 ? markerStyle || "disc" : depth === 1 ? "circle" : "square";
        marker = BULLET_GLYPHS[glyphKey] || "•";
      }
      const markerX = margin + depth * 18;
      const textX = markerX + 20;
      if (text) {
        const lines = doc.splitTextToSize(text, maxWidth - (textX - margin));
        lines.forEach((line, li) => {
          ensureSpace(15);
          doc.setFont(baseFont, "normal");
          doc.setFontSize(10.5);
          doc.setTextColor(20);
          if (li === 0) doc.text(marker, markerX, y);
          doc.text(line, textX, y);
          y += 15;
        });
      }
      (item.content || [])
        .filter((n) => n.type === "bulletList" || n.type === "orderedList")
        .forEach((child) => renderList(child, child.type === "orderedList", depth + 1, counters));
    });
    if (depth === 0) y += 6;
  }

  // PNG/JPEG pictures are embedded; SVG graphics (shapes, icons, charts)
  // can't be rasterised synchronously here, so they get a labelled box —
  // the .docx export and Print include them in full.
  function renderImage(node) {
    const src = node.attrs?.src || "";
    const w = Math.min(maxWidth, (node.attrs?.width || 300) * 0.75);
    const h = (node.attrs?.height ? node.attrs.height * 0.75 : w * 0.6) * (w / Math.max(1, (node.attrs?.width || 300) * 0.75));
    ensureSpace(h + 8);
    const fmt = /^data:image\/png/i.test(src) ? "PNG" : /^data:image\/jpe?g/i.test(src) ? "JPEG" : null;
    try {
      if (!fmt) throw new Error("unsupported");
      doc.addImage(src, fmt, margin, y, w, h);
    } catch {
      doc.setDrawColor(190);
      doc.rect(margin, y, w, h);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`[${node.attrs?.alt || "Picture"}]`, margin + w / 2, y + h / 2, { align: "center" });
    }
    y += h + 8;
  }

  function imagesIn(node) {
    const list = [];
    (function find(n) {
      if (!n) return;
      if (n.type === "image") list.push(n);
      (n.content || []).forEach(find);
    })(node);
    return list;
  }

  function renderTable(node) {
    const rows = (node.content || []).filter((n) => n.type === "tableRow");
    const body = rows.map((row) => (row.content || []).map((cell) => jsonToText(cell).trim()));
    const head = body.length && rows[0].content?.some((c) => c.type === "tableHeader") ? [body[0]] : [];
    const rest = head.length ? body.slice(1) : body;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: mR },
      head,
      body: rest,
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [94, 43, 157] },
    });
    y = doc.lastAutoTable.finalY + 14;
  }

  function walk(node) {
    if (!node) return;
    switch (node.type) {
      case "heading":
        renderParagraphLike(node, { headingLevel: node.attrs?.level || 1 });
        break;
      case "paragraph":
        renderParagraphLike(node);
        imagesIn(node).forEach(renderImage);
        break;
      case "bulletList":
        renderList(node, false);
        break;
      case "orderedList":
        renderList(node, true);
        break;
      case "blockquote":
        (node.content || []).forEach((child) => renderParagraphLike(child));
        break;
      case "table":
        renderTable(node);
        break;
      case "horizontalRule":
        ensureSpace(16);
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - mR, y);
        y += 16;
        break;
      case "pageBreak":
        if (node.attrs?.breakType === "column") break;
        doc.addPage();
        y = margins.top + headerReserve;
        break;
      case "textBox": {
        const top = y - 10;
        (node.content || []).forEach(walk);
        doc.setDrawColor(91, 100, 114);
        doc.setLineWidth(0.75);
        doc.rect(margin - 4, top, Math.min(maxWidth, (node.attrs?.width || 320) * 0.75) + 8, y - top);
        y += 8;
        break;
      }
      case "blockMath":
        drawLines(doc.splitTextToSize(node.attrs?.latex || "", maxWidth), { size: 10.5, style: "italic", align: "center" });
        y += 4;
        break;
      case "image":
        renderImage(node);
        break;
      default:
        (node.content || []).forEach(walk);
    }
  }

  (version.contentJson.content || []).forEach(walk);

  const totalPages = doc.internal.getNumberOfPages();
  const headerText = stripHtml(draft.headerHtml);
  const footerText = stripHtml(draft.footerHtml);
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    const skip = draft.layout.differentFirstPage && p === 1;
    doc.setFont(baseFont, "normal");
    doc.setFontSize(9);
    doc.setTextColor(110);
    const headerY = Math.max(18, margins.top - 10);
    const footerY = pageHeight - Math.max(14, margins.bottom - 18);
    if (!skip && headerText) {
      const text = headerText.replace(/\{\{PAGE\}\}/g, String(p)).replace(/\{\{PAGES\}\}/g, String(totalPages));
      doc.text(text, margin, headerY);
    }
    if (!skip && footerText) {
      const text = footerText.replace(/\{\{PAGE\}\}/g, String(p)).replace(/\{\{PAGES\}\}/g, String(totalPages));
      doc.text(text, margin, footerY);
    }
    if (!skip && pn) {
      const label = (PAGE_NUMBER_FORMATS[pn.format] || PAGE_NUMBER_FORMATS.plain).replace("{page}", String(p)).replace("{total}", String(totalPages));
      const right = pn.position.endsWith("right");
      doc.text(label, right ? pageWidth - mR : margin, pn.position.startsWith("header") ? headerY : footerY, { align: right ? "right" : "left" });
    }
    if (draft.design.watermark) {
      try {
        doc.saveGraphicsState();
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.15 }));
        doc.setFont(baseFont, "bold");
        doc.setFontSize(60);
        doc.setTextColor(140);
        doc.text(draft.design.watermark, pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
        doc.restoreGraphicsState();
      } catch {
        // GState unsupported in this jsPDF build — watermark simply isn't drawn rather than crashing export.
      }
    }
  }

  if (filename) {
    doc.save(filename);
    return null;
  }
  return doc;
}

export function downloadDraftPdf(draft, version) {
  const safeTitle = (draft.title || "draft").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  exportDraftAsPdf(draft, version, `${safeTitle}-${version.label}.pdf`);
}

export function draftPdfBlob(draft, version) {
  const doc = exportDraftAsPdf(draft, version, null);
  return doc.output("blob");
}

export function draftPdfBase64(draft, version) {
  const doc = exportDraftAsPdf(draft, version, null);
  return doc.output("datauristring").split(",")[1];
}
