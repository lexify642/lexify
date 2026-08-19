// The real TipTap document model shared by DraftsContext (server-of-truth
// content) and DraftEditor (the live editing surface) — both must use the
// exact same extension set, or content parsed/generated in one place won't
// round-trip correctly in the other.
import { Mark, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import Heading from "@tiptap/extension-heading";
import { TextStyle, FontFamily, FontSize } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table/kit";
import { PaginationExtension } from "./pagination";

// Real Layout-tab paragraph controls (indent, line spacing, space before/
// after, borders) — plain attributes on the block node, rendered as inline
// style/data fragments. TipTap's attribute renderer concatenates multiple
// `style`/`class` contributions instead of overwriting, so each attribute
// below can be defined independently and they still combine correctly on
// the final <p>/<h1-3>.
function blockLayoutAttributes() {
  return {
    indent: {
      default: 0,
      parseHTML: (el) => Number(el.getAttribute("data-indent")) || 0,
      renderHTML: (attrs) => (attrs.indent ? { "data-indent": attrs.indent, style: `margin-left:${attrs.indent * 32}px` } : {}),
    },
    lineSpacing: {
      default: null,
      parseHTML: (el) => el.getAttribute("data-line-spacing"),
      renderHTML: (attrs) => (attrs.lineSpacing ? { "data-line-spacing": attrs.lineSpacing, style: `line-height:${attrs.lineSpacing}` } : {}),
    },
    spacingBefore: {
      default: false,
      parseHTML: (el) => el.getAttribute("data-spacing-before") === "true",
      renderHTML: (attrs) => (attrs.spacingBefore ? { "data-spacing-before": "true", style: "margin-top:16px" } : {}),
    },
    spacingAfter: {
      default: false,
      parseHTML: (el) => el.getAttribute("data-spacing-after") === "true",
      renderHTML: (attrs) => (attrs.spacingAfter ? { "data-spacing-after": "true", style: "margin-bottom:16px" } : {}),
    },
    border: {
      default: false,
      parseHTML: (el) => el.getAttribute("data-border") === "true",
      renderHTML: (attrs) => (attrs.border ? { "data-border": "true", class: "doc-para-border" } : {}),
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

// A real, atomic page/section break — rendered as a visible divider on
// screen and read by pdfExport.js to force a new page during PDF rendering.
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return { breakType: { default: "page" } };
  },
  parseHTML() {
    return [{ tag: "div[data-break-type]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes.breakType === "section" ? "Section Break" : "Page Break";
    return ["div", mergeAttributes(HTMLAttributes, { "data-break-type": HTMLAttributes.breakType, class: "doc-break", contenteditable: "false" }), label];
  },
  addCommands() {
    return {
      insertPageBreak:
        (breakType = "page") =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { breakType } }),
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
    return [{ tag: "sup[data-note-id]" }];
  },
  renderHTML({ node }) {
    return ["sup", { "data-note-id": node.attrs.noteId, "data-kind": node.attrs.kind, class: "doc-footnote-ref" }, "*"];
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
    return [{ tag: "span[data-ref-type]" }];
  },
  renderHTML({ node }) {
    return ["span", { "data-ref-type": node.attrs.refType, "data-ref-target": node.attrs.target, class: "doc-reference" }, node.attrs.label || "[reference]"];
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

export function buildExtensions() {
  return [
    StarterKit.configure({
      paragraph: false,
      heading: false,
      link: { openOnClick: false, autolink: true, HTMLAttributes: { class: "doc-link" } },
    }),
    LegalParagraph,
    LegalHeading,
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
    PaginationExtension,
  ];
}

export const editorExtensions = buildExtensions();

// Plain-text extraction from a TipTap JSON doc — the basis for word count,
// search, and the diff engine (which compares real text, not raw HTML).
export function jsonToText(node) {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (node.type === "footnoteRef") return "";
  if (node.type === "referenceField") return node.attrs?.label || "";
  const childText = (node.content || []).map(jsonToText).join("");
  const BLOCK_TYPES = ["paragraph", "legalParagraph", "heading", "legalHeading", "tableCell", "tableHeader", "listItem", "blockquote"];
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
