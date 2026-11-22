// The real TipTap document model shared by DraftsContext (server-of-truth
// content) and DraftEditor (the live editing surface) — both must use the
// exact same extension set, or content parsed/generated in one place won't
// round-trip correctly in the other.
import { Mark, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { TextStyle, FontFamily, FontSize } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table/kit";
import Image from "@tiptap/extension-image";
import { Mathematics } from "@tiptap/extension-mathematics";
import { PaginationPlus } from "tiptap-pagination-plus";
import { InsertionMark, DeletionMark, TrackChanges } from "./trackChanges";
import { PAGE_GAP, CANVAS_COLOR } from "./pagination";

function parseSpacing(value) {
  if (value === null || value === undefined || value === "" || value === "false") return false;
  if (value === "true") return true;
  const n = Number(value);
  return Number.isFinite(n) ? n : false;
}

function spacingHtml(side, value) {
  if (value === false || value === null || value === undefined || value === 0) return {};
  const amount = value === true ? "16px" : `${value}pt`;
  return { [`data-spacing-${side}`]: String(value), style: `margin-${side === "before" ? "top" : "bottom"}:${amount}` };
}

// Real Layout-tab paragraph controls (indent, line spacing, space before/
// after, borders) — plain attributes on the block node, rendered as inline
// style/data fragments. TipTap's attribute renderer concatenates multiple
// `style`/`class` contributions instead of overwriting, so each attribute
// below can be defined independently and they still combine correctly on
// the final <p>/<h1-3>.
function blockLayoutAttributes() {
  return {
    // Left indent in 32px steps (Home → Increase Indent); Layout → Indent
    // Left sets fractional values from centimetres.
    indent: {
      default: 0,
      parseHTML: (el) => Number(el.getAttribute("data-indent")) || 0,
      renderHTML: (attrs) => (attrs.indent ? { "data-indent": attrs.indent, style: `margin-left:${+(attrs.indent * 32).toFixed(2)}px` } : {}),
    },
    indentRight: {
      default: 0,
      parseHTML: (el) => Number(el.getAttribute("data-indent-right")) || 0,
      renderHTML: (attrs) => (attrs.indentRight ? { "data-indent-right": attrs.indentRight, style: `margin-right:${attrs.indentRight}px` } : {}),
    },
    lineSpacing: {
      default: null,
      parseHTML: (el) => el.getAttribute("data-line-spacing"),
      renderHTML: (attrs) => (attrs.lineSpacing ? { "data-line-spacing": attrs.lineSpacing, style: `line-height:${attrs.lineSpacing}` } : {}),
    },
    // Space before/after a paragraph: a number of points (Layout → Spacing),
    // or `true` from older drafts / Home → Line Spacing's "Add space"
    // toggles, which keeps its original 16px.
    spacingBefore: {
      default: false,
      parseHTML: (el) => parseSpacing(el.getAttribute("data-spacing-before")),
      renderHTML: (attrs) => spacingHtml("before", attrs.spacingBefore),
    },
    spacingAfter: {
      default: false,
      parseHTML: (el) => parseSpacing(el.getAttribute("data-spacing-after")),
      renderHTML: (attrs) => spacingHtml("after", attrs.spacingAfter),
    },
    // A space-separated set of sides ("top", "top bottom", "top bottom left
    // right" == a full box, ...) rather than a boolean — Home ribbon's
    // Borders dropdown toggles individual sides the same way Word's does,
    // and "Outside"/"Inside Borders" (applied across a multi-paragraph
    // selection) assign different side-sets to different blocks. Rendered as
    // real inline border-* CSS (not a stylesheet class) specifically so it
    // round-trips into the Word-HTML export, which ships with no stylesheet.
    border: {
      default: "",
      parseHTML: (el) => el.getAttribute("data-border") || "",
      renderHTML: (attrs) => {
        if (!attrs.border) return {};
        const sides = attrs.border.split(" ").filter(Boolean);
        return { "data-border": attrs.border, style: sides.map((s) => `border-${s}:1.5px solid #a8c3de`).join(";") };
      },
    },
    shading: {
      default: null,
      parseHTML: (el) => el.getAttribute("data-shading"),
      renderHTML: (attrs) => (attrs.shading ? { "data-shading": attrs.shading, style: `background-color:${attrs.shading}` } : {}),
    },
  };
}

// Legal Heading / Legal Paragraph / Prayer-Relief / Signature Block / Quote /
// Title / Subtitle all live as a `legalStyle` attribute on the ordinary
// paragraph/heading nodes (rendered as a `data-legal-style` attribute +
// matching CSS class) rather than as separate node types — the same
// paragraph stays a paragraph, it just carries a named look, exactly like
// Word's Style gallery.
export const LegalParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      legalStyle: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-legal-style"),
        renderHTML: (attrs) => (attrs.legalStyle ? { "data-legal-style": attrs.legalStyle, class: `legal-style-${attrs.legalStyle}` } : {}),
      },
      ...blockLayoutAttributes(),
    };
  },
});

export const LegalHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      legalStyle: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-legal-style"),
        renderHTML: (attrs) => (attrs.legalStyle ? { "data-legal-style": attrs.legalStyle, class: `legal-style-${attrs.legalStyle}` } : {}),
      },
      ...blockLayoutAttributes(),
    };
  },
});

// Word's Bullets gallery (disc/circle/square) and Numbering gallery
// (decimal/upper-alpha/upper-roman/lower-alpha/lower-roman) — rendered as a
// plain inline `list-style-type`, so it's portable to the Word-HTML export
// with zero stylesheet dependency. `multilevel` additionally marks a root
// ordered list as a legal numbering scheme (see the `ol[data-multilevel]`
// rules in globals.css + the matching <style> block wordExport.js injects);
// while active, the per-item inline list-style-type is suppressed so it
// doesn't fight the CSS-driven nested counters/per-depth marker rules.
export const StyledBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      markerStyle: {
        default: "disc",
        parseHTML: (el) => el.getAttribute("data-marker-style") || "disc",
        renderHTML: (attrs) => ({ "data-marker-style": attrs.markerStyle, style: `list-style-type:${attrs.markerStyle}` }),
      },
    };
  },
});

export const StyledOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      markerStyle: {
        default: "decimal",
        parseHTML: (el) => el.getAttribute("data-marker-style") || "decimal",
        renderHTML: (attrs) => (attrs.multilevel ? {} : { "data-marker-style": attrs.markerStyle, style: `list-style-type:${attrs.markerStyle}` }),
      },
      multilevel: {
        default: null, // null | "legal-decimal" (1, 1.1, 1.1.1) | "legal-roman" (I, A, 1, i)
        parseHTML: (el) => el.getAttribute("data-multilevel"),
        renderHTML: (attrs) => (attrs.multilevel ? { "data-multilevel": attrs.multilevel, style: "list-style:none" } : {}),
      },
    };
  },
});

// A real index-entry marker (References → Index → Mark Entry) — the marked
// text itself is the index term; "Insert Index" scans the document for these
// spans and builds a real alphabetized, deduplicated, occurrence-counted
// list (no fake page numbers — the document is a continuous scroll, not
// paginated, so occurrence count is the honest substitute).
export const IndexMark = Mark.create({
  name: "indexEntry",
  parseHTML() {
    return [{ tag: "span[data-index-entry]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "doc-index-entry", "data-index-entry": "true" }), 0];
  },
  addCommands() {
    return {
      toggleIndexEntry:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});

// Word's "Text Effects" button (Home → Font) — a small, real set of
// CSS-based presets (outline/shadow) applied as an inline style via a mark,
// same attribute-driven pattern as every other style mark here. Only as
// many presets as are genuinely distinct CSS effects, not a fake gallery.
export const TextEffect = Mark.create({
  name: "textEffect",
  addAttributes() {
    return {
      effect: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-text-effect"),
        renderHTML: (attrs) => {
          if (!attrs.effect) return {};
          const styles = {
            outline: "-webkit-text-stroke:1px currentColor; color:transparent; -webkit-text-fill-color:transparent;",
            shadow: "text-shadow:2px 2px 3px rgba(13,37,61,.45);",
            glow: "text-shadow:0 0 6px var(--blue-soft), 0 0 2px var(--blue-soft);",
          };
          return { "data-text-effect": attrs.effect, style: styles[attrs.effect] || "" };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-text-effect]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setTextEffect:
        (effect) =>
        ({ commands }) =>
          commands.setMark(this.name, { effect }),
      unsetTextEffect:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

// A real comment anchor — the mark travels with its text through edits.
// Thread data (author/replies/status) lives in DraftCommentsContext, keyed
// by this commentId, not inside the document itself.
export const CommentMark = Mark.create({
  name: "comment",
  addAttributes() {
    return { commentId: { default: null } };
  },
  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "doc-comment", "data-comment-id": HTMLAttributes.commentId }), 0];
  },
  addCommands() {
    return {
      setComment:
        (commentId) =>
        ({ commands }) =>
          commands.setMark(this.name, { commentId }),
      unsetComment:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

// A real, atomic page / section / column break. On screen the node view
// holds a spacer that pagination.js grows so whatever follows starts on the
// next page; in exported HTML (Word, print) it's a CSS break, which
// docx/html turns into a real Word page break.
const BREAK_LABELS = { page: "Page Break", section: "Section Break (Next Page)", column: "Column Break" };

export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    // Written out as data-break-type by renderHTML below.
    return { breakType: { default: "page", renderHTML: () => ({}) } };
  },
  parseHTML() {
    return [{ tag: "div[data-break-type]", getAttrs: (el) => ({ breakType: el.getAttribute("data-break-type") || "page" }) }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.breakType || "page";
    const style = type === "column" ? "break-after:column" : "page-break-after:always;break-after:page";
    return ["div", mergeAttributes(HTMLAttributes, { "data-break-type": type, class: "doc-break", style })];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "doc-break";
      dom.dataset.breakType = node.attrs.breakType;
      dom.contentEditable = "false";
      const spacer = document.createElement("span");
      spacer.className = "doc-break-spacer";
      const label = document.createElement("span");
      label.className = "doc-break-label";
      label.textContent = BREAK_LABELS[node.attrs.breakType] || BREAK_LABELS.page;
      dom.append(spacer, label);
      return { dom, ignoreMutation: () => true };
    };
  },
  addCommands() {
    return {
      insertPageBreak:
        (breakType = "page") =>
        ({ commands }) =>
          commands.insertContent([{ type: this.name, attrs: { breakType } }, { type: "paragraph" }]),
    };
  },
  addKeyboardShortcuts() {
    return { "Mod-Enter": () => this.editor.commands.insertPageBreak("page") };
  },
});

// Insert → Text Box: a bordered box holding its own paragraphs.
export const TextBox = Node.create({
  name: "textBox",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      // Written out as data-width/data-align by renderHTML below.
      width: { default: 320, parseHTML: (el) => Number(el.getAttribute("data-width")) || 320, renderHTML: () => ({}) },
      align: { default: "left", parseHTML: (el) => el.getAttribute("data-align") || "left", renderHTML: () => ({}) },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-text-box]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const { width, align } = node.attrs;
    const marginStyle = align === "center" ? "margin-left:auto;margin-right:auto;" : align === "right" ? "margin-left:auto;" : "";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-text-box": "true",
        "data-width": width,
        "data-align": align,
        class: "doc-text-box",
        style: `width:${width}px;max-width:100%;border:1px solid #5b6472;padding:8px 10px;${marginStyle}`,
      }),
      0,
    ];
  },
  addCommands() {
    return {
      insertTextBox:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs, content: [{ type: "paragraph", content: [{ type: "text", text: "Type text here" }] }] }),
    };
  },
});

// Insert → Bookmark: a named, invisible anchor (shown as a marker when
// formatting marks are on). Cross-references point at it by name.
export const Bookmark = Node.create({
  name: "bookmark",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return { name: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "a[data-bookmark]", getAttrs: (el) => ({ name: el.getAttribute("data-bookmark") || el.getAttribute("id") || "" }) }];
  },
  renderHTML({ node }) {
    return ["a", { id: node.attrs.name, "data-bookmark": node.attrs.name, class: "doc-bookmark", title: `Bookmark: ${node.attrs.name}` }];
  },
  addCommands() {
    return {
      insertBookmark:
        (name) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { name } }),
    };
  },
});

// Footnote/endnote reference — the editable note text lives on the node's
// own attributes (so it's real, persisted, structured data), the numbered
// list + edit surface is the References tab's Footnotes panel, which scans
// the document for these nodes in order.
export const FootnoteRef = Node.create({
  name: "footnoteRef",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return {
      noteId: { default: null },
      text: { default: "" },
      kind: { default: "footnote" },
    };
  },
  parseHTML() {
    // Above Superscript's plain <sup> rule, which would otherwise win.
    return [
      {
        tag: "sup[data-note-id]",
        priority: 60,
        getAttrs: (el) => ({
          noteId: el.getAttribute("data-note-id"),
          kind: el.getAttribute("data-kind") || el.getAttribute("kind") || "footnote",
          text: el.getAttribute("data-note-text") || el.getAttribute("text") || "",
        }),
      },
    ];
  },
  renderHTML({ node }) {
    return ["sup", { "data-note-id": node.attrs.noteId, "data-kind": node.attrs.kind, "data-note-text": node.attrs.text || "", class: "doc-footnote-ref" }, "*"];
  },
  addCommands() {
    return {
      insertFootnoteRef:
        (kind = "footnote") =>
        ({ commands }) => {
          const noteId = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          return commands.insertContent({ type: this.name, attrs: { noteId, text: "", kind } });
        },
    };
  },
});

// A named cross-reference/citation field — real inline content (renders the
// label you gave it), carries a `refType`/`target` pair so ReferencesTab can
// resolve/update it, but degrades gracefully to plain text if the target
// later disappears (never a broken/blank field).
export const ReferenceField = Node.create({
  name: "referenceField",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return {
      refType: { default: "heading" }, // heading | paragraph | page | clause | citation
      target: { default: null },
      label: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-ref-type]" }, { tag: "a[data-ref-type]" }];
  },
  renderHTML({ node }) {
    const attrs = { "data-ref-type": node.attrs.refType, "data-ref-target": node.attrs.target, class: "doc-reference" };
    // Bookmark references are real internal links, so they stay clickable
    // in the exported Word file.
    if (node.attrs.refType === "bookmark") return ["a", { ...attrs, href: `#${node.attrs.target}` }, node.attrs.label || "[reference]"];
    return ["span", attrs, node.attrs.label || "[reference]"];
  },
  addCommands() {
    return {
      insertReferenceField:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

// `live: true` adds what only the on-screen editor needs: page frames
// (tiptap-pagination-plus) and the Track Changes plugin. Schema-only uses
// (generateJSON/generateHTML for import, export, clause insertion) leave
// them out — the document model is identical either way.
export function buildExtensions({ live = false, author = "", pagination = {} } = {}) {
  const extensions = [
    StarterKit.configure({
      paragraph: false,
      heading: false,
      bulletList: false,
      orderedList: false,
      link: { openOnClick: false, autolink: true, HTMLAttributes: { class: "doc-link" } },
    }),
    LegalParagraph,
    LegalHeading,
    StyledBulletList,
    StyledOrderedList,
    TextStyle,
    FontFamily,
    FontSize,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["legalHeading", "legalParagraph", "heading", "paragraph"] }),
    TableKit.configure({ table: { resizable: true } }),
    Placeholder.configure({ placeholder: "Start drafting…" }),
    CharacterCount,
    Subscript,
    Superscript,
    TextEffect,
    CommentMark,
    IndexMark,
    PageBreak,
    FootnoteRef,
    ReferenceField,
    TextBox,
    Bookmark,
    InsertionMark,
    DeletionMark,
    Image.configure({ inline: true, allowBase64: true, resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 24, minHeight: 24 } }),
    Mathematics.configure({ katexOptions: { throwOnError: false } }),
  ];
  if (live) {
    extensions.push(
      TrackChanges.configure({ author }),
      PaginationPlus.configure({
        pageGap: PAGE_GAP,
        pageBreakBackground: CANVAS_COLOR,
        pageGapBorderSize: 0,
        pageGapBorderColor: CANVAS_COLOR,
        contentMarginTop: 12,
        contentMarginBottom: 12,
        footerRight: "",
        ...pagination,
      })
    );
  }
  return extensions;
}

export const editorExtensions = buildExtensions();

// Plain-text extraction from a TipTap JSON doc — the basis for word count,
// search, and the diff engine (which compares real text, not raw HTML).
export function jsonToText(node) {
  if (!node) return "";
  if (node.type === "text") return node.marks?.some((m) => m.type === "deletion") ? "" : node.text || "";
  if (node.type === "inlineMath" || node.type === "blockMath") return node.attrs?.latex || "";
  if (node.type === "footnoteRef") return "";
  if (node.type === "referenceField") return node.attrs?.label || "";
  const childText = (node.content || []).map(jsonToText).join("");
  const BLOCK_TYPES = ["paragraph", "legalParagraph", "heading", "legalHeading", "tableCell", "tableHeader", "listItem", "blockquote", "blockMath"];
  return BLOCK_TYPES.includes(node.type) ? `${childText}\n` : childText;
}

// Builds a plain-paragraph TipTap doc from plain text — used wherever a
// real merge/import only has plain text to work with (compare-versions
// merge, plain-text draft import), never claiming to reconstruct rich
// formatting it doesn't actually have.
export function plainTextToDoc(text) {
  const lines = (text || "").split("\n").filter((line, idx, arr) => !(idx === arr.length - 1 && line === ""));
  return {
    type: "doc",
    content: lines.length
      ? lines.map((line) => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] }))
      : [{ type: "paragraph", content: [] }],
  };
}

// Every heading in document order — used by the Table of Contents panel and
// the Navigation pane (View tab).
export function collectHeadings(docJson) {
  const headings = [];
  function walk(node) {
    if (!node) return;
    if (node.type === "heading" || node.type === "legalHeading") {
      const text = (node.content || []).map(jsonToText).join("").trim();
      if (text) headings.push({ level: node.attrs?.level || 1, text, legalStyle: node.attrs?.legalStyle || null });
    }
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  return headings;
}

// Every footnote/endnote reference in document order.
export function collectFootnotes(docJson) {
  const notes = [];
  function walk(node) {
    if (!node) return;
    if (node.type === "footnoteRef") notes.push(node.attrs);
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  return notes;
}

// Every span marked with the indexEntry mark — deduplicated, alphabetized,
// with a real occurrence count (used by References → Index → Insert Index).
export function collectIndexEntries(docJson) {
  const counts = new Map();
  function walk(node) {
    if (!node) return;
    if (node.type === "text" && node.marks?.some((m) => m.type === "indexEntry")) {
      const term = node.text.trim();
      if (term) counts.set(term, (counts.get(term) || 0) + 1);
    }
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  return Array.from(counts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => a.term.localeCompare(b.term));
}
