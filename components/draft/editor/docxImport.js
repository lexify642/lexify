// .docx import via mammoth: Word document → HTML (headings, paragraphs,
// bold/italic/underline/strikethrough, sub/superscript, lists, tables,
// links, images as embedded data URLs, footnotes/endnotes) → the editor's
// TipTap JSON. Word formatting mammoth doesn't carry over (fonts, sizes,
// colours, exact spacing) falls back to the draft's own design settings.
import { generateJSON } from "@tiptap/html";
import { editorExtensions } from "./extensions";

const STYLE_MAP = [
  "u => u",
  "strike => s",
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
  "p[style-name='Quote'] => blockquote > p:fresh",
  "p[style-name='Intense Quote'] => blockquote > p:fresh",
];

// mammoth writes notes as <sup><a href="#footnote-1">[1]</a></sup> plus an
// <ol> of <li id="footnote-1"> at the end; turn them back into the editor's
// footnote/endnote reference nodes (text stored on the node itself).
function convertNotes(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const noteText = new Map();
  doc.querySelectorAll("li[id^='footnote-'], li[id^='endnote-']").forEach((li) => {
    li.querySelectorAll("a[href^='#footnote-ref-'], a[href^='#endnote-ref-']").forEach((a) => a.remove());
    noteText.set(li.id, (li.textContent || "").trim());
  });
  doc.querySelectorAll("a[href^='#footnote-'], a[href^='#endnote-']").forEach((a) => {
    const target = a.getAttribute("href").slice(1);
    if (!noteText.has(target)) return;
    const kind = target.startsWith("endnote") ? "endnote" : "footnote";
    const sup = doc.createElement("sup");
    const noteId = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    sup.setAttribute("data-note-id", noteId);
    sup.setAttribute("data-kind", kind);
    sup.setAttribute("data-note-text", noteText.get(target));
    sup.textContent = "*";
    (a.closest("sup") || a).replaceWith(sup);
  });
  noteText.forEach((_, id) => {
    const li = doc.getElementById(id);
    const list = li?.parentElement;
    li?.remove();
    if (list && !list.children.length) list.remove();
  });
  return doc.body.innerHTML;
}

export async function docxToContent(file) {
  const mod = await import("mammoth");
  const mammoth = mod.default || mod;
  const arrayBuffer = await file.arrayBuffer();
  // The browser build reads `arrayBuffer`; the Node build (tests, server)
  // reads `buffer`.
  const input = typeof Buffer !== "undefined" ? { arrayBuffer, buffer: Buffer.from(arrayBuffer) } : { arrayBuffer };
  const result = await mammoth.convertToHtml(input, { styleMap: STYLE_MAP });
  const html = convertNotes(result.value || "");
  return {
    contentJson: generateJSON(html || "<p></p>", editorExtensions),
    warnings: (result.messages || []).filter((m) => m.type === "warning").map((m) => m.message),
  };
}

export function titleFromFileName(name) {
  return (name || "Imported document").replace(/\.docx$/i, "").replace(/[_-]+/g, " ").trim() || "Imported document";
}
