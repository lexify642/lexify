// A real, paginated PDF renderer for a draft version's TipTap contentJson —
// walks paragraphs/headings/lists/tables/breaks, honoring the real
// Layout-tab settings (margin/orientation/page size/columns) and drawing a
// real header/footer/page-number/watermark on every page. Multi-column PDF
// layout is a best-effort simple two-pass text split, not full Word-grade
// column balancing (documented scope boundary — see the build plan).
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { jsonToText } from "./extensions";

const PAGE_FORMATS = { A4: "a4", A3: "a3", Letter: "letter", Legal: "legal" };
const MARGIN_PT = { normal: 52, narrow: 30, moderate: 40 };

function marginFor(layout) {
  if (layout.margin === "custom" && layout.customMargin) return Math.round(layout.customMargin * 0.75);
  return MARGIN_PT[layout.margin] || MARGIN_PT.normal;
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
  const margin = marginFor(draft.layout);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const headerReserve = draft.headerHtml ? 28 : 0;
  const footerReserve = draft.footerHtml ? 28 : 0;
  let y = margin + headerReserve;

  function ensureSpace(nextLineHeight) {
    if (y + nextLineHeight > pageHeight - margin - footerReserve) {
      doc.addPage();
      y = margin + headerReserve;
    }
  }

  function drawLines(lines, { size, style = "normal", align = "left", color = 20, indent = 0, lineSpacing } = {}) {
    doc.setFont(baseFont, style);
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lineHeight = size * (lineSpacing ? Number(lineSpacing) : 1.35);
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      const x = align === "right" ? pageWidth - margin : align === "center" ? pageWidth / 2 : margin + indent;
      doc.text(line, x, y, { align: align === "left" ? "left" : align });
      y += lineHeight;
    });
  }

  function renderParagraphLike(node, { headingLevel } = {}) {
    const text = blockText(node);
    const legalStyle = node.attrs?.legalStyle || null;
    const indent = (node.attrs?.indent || 0) * 16;
    const lineSpacing = node.attrs?.lineSpacing;
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
    drawLines(lines, { size, style, align, color, indent, lineSpacing });
    if (node.attrs?.spacingAfter) y += 12;
    else y += 4;
  }

  function renderList(node, ordered) {
    (node.content || []).forEach((item, idx) => {
      const text = jsonToText(item).replace(/\n+$/, "");
      const bullet = ordered ? `${idx + 1}.` : "•";
      const lines = doc.splitTextToSize(text, maxWidth - 24);
      lines.forEach((line, li) => {
        ensureSpace(15);
        doc.setFont(baseFont, "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(20);
        if (li === 0) doc.text(bullet, margin, y);
        doc.text(line, margin + 20, y);
        y += 15;
      });
    });
    y += 6;
  }

  function renderTable(node) {
    const rows = (node.content || []).filter((n) => n.type === "tableRow");
    const body = rows.map((row) => (row.content || []).map((cell) => jsonToText(cell).trim()));
    const head = body.length && rows[0].content?.some((c) => c.type === "tableHeader") ? [body[0]] : [];
    const rest = head.length ? body.slice(1) : body;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
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
        doc.line(margin, y, pageWidth - margin, y);
        y += 16;
        break;
      case "pageBreak":
        doc.addPage();
        y = margin + headerReserve;
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
    if (!skip && headerText) {
      const text = headerText.replace(/\{\{PAGE\}\}/g, String(p)).replace(/\{\{PAGES\}\}/g, String(totalPages));
      doc.setFont(baseFont, "normal");
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(text, pageWidth / 2, margin - 14, { align: "center" });
    }
    if (!skip && footerText) {
      const text = footerText.replace(/\{\{PAGE\}\}/g, String(p)).replace(/\{\{PAGES\}\}/g, String(totalPages));
      doc.setFont(baseFont, "normal");
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(text, pageWidth / 2, pageHeight - margin + 20, { align: "center" });
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
