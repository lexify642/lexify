// Word export.
//
// exportDraftAsDocx builds a real .docx with the `docx` library: the draft's
// HTML (generated from its TipTap JSON) is converted by docx/html's
// htmlToContent — which reads inline styles, lists, tables, images, links,
// page breaks, footnotes, equations (data-latex) and <ins>/<del> as Word
// tracked changes — and placed in a section with the draft's real page
// size, orientation, margins, columns, line numbering and running header/
// footer with live page-number fields.
//
// draftWordHtml (the older Word-compatible HTML file) is kept for Send for
// Review, which emails it as an attachment.
import { generateHTML } from "@tiptap/html";
import { editorExtensions } from "./extensions";
import { pageMetricsFor, PAGE_NUMBER_FORMATS } from "./pagination";
import { svgToPngDataUrl } from "./graphics";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileName(draft) {
  return (draft.title || "draft").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "draft";
}

// Everything the Home ribbon applies via inline style/attrs (bold, color,
// font, borders, bullet/number marker-style) round-trips automatically
// since generateHTML() renders each extension's own inline styles. The one
// exception is Multilevel List's nested numbering, which depends on CSS
// counters/nesting selectors a stylesheet-less exported file wouldn't have
// — duplicated here as a <style> block, mirroring the same rules in
// globals.css, so "1 / 1.1 / 1.1.1" and "I / A / 1" still render when the
// .doc file is opened in Word.
const MULTILEVEL_STYLE = `
ol[data-multilevel="legal-decimal"] { list-style:none; counter-reset:item; padding-left:30px; }
ol[data-multilevel="legal-decimal"] li { counter-increment:item; position:relative; }
ol[data-multilevel="legal-decimal"] li::before { content:counters(item,".") ". "; position:absolute; left:-30px; }
ol[data-multilevel="legal-decimal"] ol { list-style:none; counter-reset:item; padding-left:30px; }
ol[data-multilevel="legal-roman"] { list-style-type:upper-roman; }
ol[data-multilevel="legal-roman"] ol { list-style-type:upper-alpha; }
ol[data-multilevel="legal-roman"] ol ol { list-style-type:decimal; }
ol[data-multilevel="legal-roman"] ol ol ol { list-style-type:lower-roman; }
`;

export function draftWordHtml(draft, version) {
  const body = generateHTML(version.contentJson, editorExtensions);
  const header = draft.headerHtml ? `<div style="color:#666;font-size:11px;border-bottom:1px solid #ccc;margin-bottom:12px;">${draft.headerHtml}</div>` : "";
  const footer = draft.footerHtml ? `<div style="color:#666;font-size:11px;border-top:1px solid #ccc;margin-top:12px;">${draft.footerHtml}</div>` : "";
  return `<html><head><meta charset="utf-8"><style>${MULTILEVEL_STYLE}</style></head><body>${header}${body}${footer}</body></html>`;
}

// Kept for any caller that still wants the HTML-based .doc file.
export function exportDraftAsWord(draft, version, filename) {
  const html = draftWordHtml(draft, version);
  downloadBlob(new Blob(["﻿", html], { type: "application/msword" }), filename || `${safeFileName(draft)}-${version.label}.doc`);
}

// Styles the editor gives through classes rather than inline CSS — passed
// to htmlToContent as a stylesheet so the Word file looks the same.
const EXPORT_STYLESHEET = `
${MULTILEVEL_STYLE}
.legal-style-title { font-size:16.5pt; font-weight:bold; text-align:center; }
.legal-style-subtitle { font-size:11.5pt; color:#64748d; text-align:center; }
.legal-style-legal-heading { text-transform:uppercase; text-align:center; }
.legal-style-legal-paragraph { text-align:justify; text-indent:21pt; }
.legal-style-prayer-relief { font-style:italic; margin-top:18pt; }
.legal-style-signature-block { margin-top:30pt; text-align:right; }
.legal-style-caption { font-size:8.5pt; color:#64748d; text-align:center; font-style:italic; }
.doc-text-box { border:1px solid #5b6472; padding:6pt; }
`;

const FONT_FOR_PAIRING = { classic: "Georgia", modern: "Arial", traditional: "Times New Roman" };
const LINE_FOR_SPACING = { compact: 1.15, normal: 1.4, relaxed: 2 };

// Footnote/endnote refs → the HTML footnote convention htmlToContent reads
// (role="doc-noteref" links + a role="doc-footnotes"/"doc-endnotes" list).
// SVG images → PNG (Word needs a raster fallback). Comment highlights and
// index-entry marks are editor-only presentation and are unwrapped.
async function prepareHtml(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const notes = { footnote: [], endnote: [] };
  doc.querySelectorAll("sup[data-note-id]").forEach((sup) => {
    const kind = sup.getAttribute("data-kind") === "endnote" ? "endnote" : "footnote";
    const id = `${kind}-${notes[kind].length + 1}`;
    notes[kind].push({ id, text: sup.getAttribute("data-note-text") || "" });
    const a = doc.createElement("a");
    a.setAttribute("role", "doc-noteref");
    a.setAttribute("href", `#${id}`);
    a.textContent = String(notes[kind].length);
    sup.replaceWith(a);
  });
  for (const kind of ["footnote", "endnote"]) {
    if (!notes[kind].length) continue;
    const section = doc.createElement("section");
    section.setAttribute("role", kind === "footnote" ? "doc-footnotes" : "doc-endnotes");
    const ol = doc.createElement("ol");
    notes[kind].forEach((n) => {
      const li = doc.createElement("li");
      li.id = n.id;
      li.setAttribute("role", kind === "footnote" ? "doc-footnote" : "doc-endnote");
      const p = doc.createElement("p");
      p.textContent = n.text;
      li.appendChild(p);
      ol.appendChild(li);
    });
    section.appendChild(ol);
    doc.body.appendChild(section);
  }
  doc.querySelectorAll("span.doc-comment, span[data-index-entry]").forEach((el) => el.replaceWith(...el.childNodes));
  for (const img of Array.from(doc.querySelectorAll("img[src^='data:image/svg']"))) {
    const width = Number(img.getAttribute("width")) || undefined;
    const height = Number(img.getAttribute("height")) || undefined;
    const png = await svgToPngDataUrl(img.getAttribute("src"), width, height);
    if (png) img.setAttribute("src", png);
  }
  return doc.body.innerHTML;
}

function pxToTwip(px) {
  return Math.round(px * 15);
}

export async function exportDraftAsDocx(draft, version, { author } = {}) {
  const docx = await import("docx");
  const { htmlToContent } = await import("docx/html");
  const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, PageNumber, PageOrientation, LineNumberRestartFormat } = docx;

  const layout = draft.layout || {};
  const design = draft.design || {};
  const m = pageMetricsFor(layout);
  const contentWidthPx = m.width - m.marginLeft - m.marginRight;
  const htmlOptions = {
    stylesheet: EXPORT_STYLESHEET,
    maxImageWidth: contentWidthPx,
    trackChanges: { author: author || "Lexifyi" },
  };

  const bodyHtml = await prepareHtml(generateHTML(version.contentJson, editorExtensions));
  const children = htmlToContent(bodyHtml, htmlOptions);

  const pn = layout.pageNumbers || null;
  function pageNumberRuns() {
    const format = PAGE_NUMBER_FORMATS[pn?.format] || PAGE_NUMBER_FORMATS.plain;
    return format.split(/(\{page\}|\{total\})/).filter(Boolean).map((part) => {
      if (part === "{page}") return new TextRun({ children: [PageNumber.CURRENT] });
      if (part === "{total}") return new TextRun({ children: [PageNumber.TOTAL_PAGES] });
      return new TextRun(part);
    });
  }
  // {{PAGE}} / {{PAGES}} tokens typed into the header/footer editor become
  // real page fields too.
  function runningBlock(html, side) {
    const blocks = [];
    if (html) {
      const tokenized = html.replace(/\{\{PAGE\}\}/g, "\u0001").replace(/\{\{PAGES\}\}/g, "\u0002");
      if (/[\u0001\u0002]/.test(tokenized)) {
        const text = new DOMParser().parseFromString(tokenized, "text/html").body.textContent || "";
        blocks.push(
          new Paragraph({
            children: text.split(/([\u0001\u0002])/).filter(Boolean).map((part) => {
              if (part === "\u0001") return new TextRun({ children: [PageNumber.CURRENT] });
              if (part === "\u0002") return new TextRun({ children: [PageNumber.TOTAL_PAGES] });
              return new TextRun(part);
            }),
          })
        );
      } else {
        blocks.push(...htmlToContent(html, htmlOptions));
      }
    }
    if (pn && pn.position?.startsWith(side)) {
      blocks.push(new Paragraph({ alignment: pn.position.endsWith("right") ? AlignmentType.RIGHT : AlignmentType.LEFT, children: pageNumberRuns() }));
    }
    return blocks;
  }

  const headerBlocks = runningBlock(draft.headerHtml, "header");
  const footerBlocks = runningBlock(draft.footerHtml, "footer");
  const firstPageBlank = !!layout.differentFirstPage;

  const doc = new Document({
    creator: author || "Lexifyi",
    title: draft.title || "Draft",
    description: draft.description || undefined,
    features: { updateFields: true },
    hyphenation: layout.hyphenation ? { autoHyphenation: true } : undefined,
    styles: {
      default: {
        document: {
          run: { font: FONT_FOR_PAIRING[design.fontPairing] || "Georgia", size: 24 },
          paragraph: { spacing: { line: Math.round(240 * (LINE_FOR_SPACING[design.spacing] || 1.4)), after: 120 } },
        },
      },
    },
    sections: [
      {
        properties: {
          titlePage: firstPageBlank,
          page: {
            size: {
              width: pxToTwip(layout.orientation === "landscape" ? m.height : m.width),
              height: pxToTwip(layout.orientation === "landscape" ? m.width : m.height),
              orientation: layout.orientation === "landscape" ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: { top: pxToTwip(m.marginTop), bottom: pxToTwip(m.marginBottom), left: pxToTwip(m.marginLeft), right: pxToTwip(m.marginRight) },
          },
          column: m.columns > 1 ? { count: m.columns, space: 708 } : undefined,
          lineNumbers: layout.lineNumbers ? { countBy: 1, restart: LineNumberRestartFormat.NEW_PAGE } : undefined,
        },
        headers: {
          default: new Header({ children: headerBlocks.length ? headerBlocks : [new Paragraph("")] }),
          ...(firstPageBlank ? { first: new Header({ children: [new Paragraph("")] }) } : {}),
        },
        footers: {
          default: new Footer({ children: footerBlocks.length ? footerBlocks : [new Paragraph("")] }),
          ...(firstPageBlank ? { first: new Footer({ children: [new Paragraph("")] }) } : {}),
        },
        children: children.length ? children : [new Paragraph("")],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${safeFileName(draft)}.docx`);
}
