"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorState } from "@tiptap/react";
import RibbonMenu from "./RibbonMenu";
import {
  ClipboardPaste,
  Scissors,
  Copy,
  Paintbrush,
  Plus,
  Minus,
  CaseSensitive,
  Eraser,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Sparkles,
  Highlighter,
  Baseline,
  List,
  ListOrdered,
  ListTree,
  IndentIncrease,
  IndentDecrease,
  ArrowDownAZ,
  ArrowUpAZ,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  WrapText,
  PaintBucket,
  Square,
  ChevronDown,
} from "lucide-react";

const FONT_FAMILIES = ["Aptos", "Arial", "Calibri", "Times New Roman", "Georgia", "Garamond", "Cambria", "Helvetica", "Verdana", "Courier New"];
const FONT_SIZES = ["8pt", "9pt", "10pt", "11pt", "12pt", "14pt", "16pt", "18pt", "20pt", "22pt", "24pt", "26pt", "28pt", "32pt", "36pt", "48pt", "72pt"];

// Word's "Standard Colors" row plus one lighter-tint row, shared by Font
// Color and Text Highlight Color. Columns stay 1:1 between rows so a label
// lookup by column index works for either row.
const COLOR_LABELS = ["Black", "Dark Gray", "Gray", "White", "Red", "Orange", "Yellow", "Green", "Blue", "Dark Blue", "Purple"];
const COLOR_ROWS = [
  ["#000000", "#404040", "#808080", "#ffffff", "#dc2626", "#ea580c", "#eab308", "#16a34a", "#2563eb", "#1e3a8a", "#7c3aed"],
  ["#262626", "#595959", "#a6a6a6", "#f2f2f2", "#f87171", "#fb923c", "#fde047", "#4ade80", "#60a5fa", "#3b5ba9", "#a78bfa"],
];
const SHADING_COLORS = [
  { label: "Light Blue", value: "#f6f9fc" },
  { label: "Light Gray", value: "#eef2f6" },
  { label: "Steel", value: "#e3e8ee" },
  { label: "Lavender", value: "#f2eef7" },
  { label: "Amber Tint", value: "#fde68a55" },
];

const CASE_OPTIONS = [
  { key: "sentence", label: "Sentence case.", transform: (t) => t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()) },
  { key: "lower", label: "lowercase", transform: (t) => t.toLowerCase() },
  { key: "upper", label: "UPPERCASE", transform: (t) => t.toUpperCase() },
  { key: "capitalize", label: "Capitalize Each Word", transform: (t) => t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) },
  { key: "toggle", label: "tOGGLE cASE", transform: (t) => t.split("").map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("") },
];

const TEXT_EFFECTS = [
  { key: "none", label: "None (clear effect)" },
  { key: "outline", label: "Outline" },
  { key: "shadow", label: "Shadow" },
  { key: "glow", label: "Glow" },
];

const BULLET_STYLES = [
  { key: "disc", label: "Filled Round Bullet", glyph: "●" },
  { key: "circle", label: "Hollow Round Bullet", glyph: "○" },
  { key: "square", label: "Square Bullet", glyph: "■" },
];

const NUMBER_STYLES = [
  { key: "decimal", label: "1.   2.   3." },
  { key: "upper-alpha", label: "A.   B.   C." },
  { key: "upper-roman", label: "I.   II.   III." },
  { key: "lower-alpha", label: "a.   b.   c." },
  { key: "lower-roman", label: "i.   ii.   iii." },
];

const MULTILEVEL_PRESETS = [
  { key: "legal-decimal", label: "1   1.1   1.1.1", hint: "Legal (decimal)" },
  { key: "legal-roman", label: "I   A   1   i", hint: "Legal (roman / alpha)" },
];

const LINE_SPACING_OPTIONS = [
  { value: "1", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
  { value: "2.5", label: "2.5" },
  { value: "3", label: "3.0" },
];

// Word-standard styles first (matching the requested gallery), then this
// app's real legal-drafting styles — kept rather than removed, since
// InsertTab/DesignTab/ReferencesTab/pdfExport.js all already depend on
// these legalStyle values existing.
const STYLE_GROUPS = [
  {
    label: "General",
    items: [
      { key: "normal", label: "Normal", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: null }) },
      {
        key: "no-spacing",
        label: "No Spacing",
        apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: null, lineSpacing: "1", spacingBefore: false, spacingAfter: false }),
      },
      { key: "heading1", label: "Heading 1", apply: (chain) => chain.setHeading({ level: 1 }).updateAttributes("heading", { legalStyle: null }) },
      { key: "heading2", label: "Heading 2", apply: (chain) => chain.setHeading({ level: 2 }).updateAttributes("heading", { legalStyle: null }) },
      { key: "heading3", label: "Heading 3", apply: (chain) => chain.setHeading({ level: 3 }).updateAttributes("heading", { legalStyle: null }) },
      { key: "title", label: "Title", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "title" }) },
      { key: "subtitle", label: "Subtitle", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "subtitle" }) },
    ],
  },
  {
    label: "Legal",
    items: [
      { key: "quote", label: "Quote", apply: (chain) => chain.toggleBlockquote() },
      { key: "legal-heading", label: "Legal Heading", apply: (chain) => chain.setHeading({ level: 2 }).updateAttributes("heading", { legalStyle: "legal-heading" }) },
      { key: "legal-paragraph", label: "Legal Paragraph", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "legal-paragraph" }) },
      { key: "prayer-relief", label: "Prayer / Relief", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "prayer-relief" }) },
      { key: "signature-block", label: "Signature Block", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "signature-block" }) },
    ],
  },
];
const ALL_STYLES = STYLE_GROUPS.flatMap((g) => g.items);

// LegalParagraph/LegalHeading (extensions.js) are Paragraph/Heading.extend()'d
// without a `name` override, so their real registered node types are still
// plain "paragraph"/"heading" — "legal-*" only ever appears as the
// `legalStyle` *attribute* value on those same two node types.
const BLOCK_TYPE_NAMES = ["paragraph", "heading"];

function currentStyleKey(editor) {
  if (editor.isActive("blockquote")) return "quote";
  if (editor.isActive("heading", { level: 1 })) return "heading1";
  if (editor.isActive("heading", { level: 3 })) return "heading3";
  if (editor.isActive("heading", { level: 2 })) {
    return editor.getAttributes("heading").legalStyle === "legal-heading" ? "legal-heading" : "heading2";
  }
  if (editor.isActive("paragraph")) {
    return editor.getAttributes("paragraph").legalStyle || "normal";
  }
  return "normal";
}

function activeBlockType(editor) {
  return editor.isActive("heading") ? "heading" : "paragraph";
}
function activeBlockAttrs(editor) {
  return editor.isActive("heading") ? editor.getAttributes("heading") : editor.getAttributes("paragraph");
}
function updateBlockAttrs(editor, patch) {
  editor.chain().focus().updateAttributes(activeBlockType(editor), patch).run();
}

// Every top-level paragraph/heading block touched by the current selection
// (a single entry for a collapsed cursor) — the basis for Borders, which
// (unlike every other paragraph control here) can span and address several
// blocks at once for its Outside/Inside Borders behavior.
function getSelectedBlockPositions(editor) {
  const { from, to } = editor.state.selection;
  const positions = [];
  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (BLOCK_TYPE_NAMES.includes(node.type.name)) {
      positions.push(pos);
      return false;
    }
    return true;
  });
  return positions;
}

function setBorderAtPos(chain, pos, border) {
  chain.command(({ tr }) => {
    const node = tr.doc.nodeAt(pos);
    if (!node) return false;
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, border });
    return true;
  });
}

// A single side toggles independently per block (click "Top Border" twice to
// add then remove it) — `border` is a space-separated side set, not a flag.
function toggleBorderSide(editor, side) {
  const positions = getSelectedBlockPositions(editor);
  const chain = editor.chain().focus();
  positions.forEach((pos) => {
    const node = editor.state.doc.nodeAt(pos);
    const current = new Set((node?.attrs.border || "").split(" ").filter(Boolean));
    if (current.has(side)) current.delete(side);
    else current.add(side);
    setBorderAtPos(chain, pos, Array.from(current).join(" "));
  });
  chain.run();
}

function setAllBlocksBorder(editor, border) {
  const positions = getSelectedBlockPositions(editor);
  const chain = editor.chain().focus();
  positions.forEach((pos) => setBorderAtPos(chain, pos, border));
  chain.run();
}

// Outside = one box drawn around the whole selected group (left+right on
// every block, top only on the first, bottom only on the last). Inside = a
// divider between each consecutive pair, no outer box — genuinely different
// blocks get genuinely different border attrs, not a single flag reused.
function setGroupBorder(editor, mode) {
  const positions = getSelectedBlockPositions(editor);
  const chain = editor.chain().focus();
  positions.forEach((pos, idx) => {
    let sides = [];
    if (mode === "outside") {
      sides = ["left", "right"];
      if (idx === 0) sides.push("top");
      if (idx === positions.length - 1) sides.push("bottom");
    } else if (idx < positions.length - 1) {
      sides = ["bottom"];
    }
    setBorderAtPos(chain, pos, sides.join(" "));
  });
  chain.run();
}

// Replaces the current selection's plain text with a transformed version —
// a genuine text-level operation (not just a visual style), matching Word's
// Change Case. Marks on the original run aren't reconstructed for a mixed-
// formatting selection, the same honest plain-text-operation trade-off used
// elsewhere in this editor (compare/merge, plain-text import).
function applyChangeCase(editor, transform) {
  const { from, to, empty } = editor.state.selection;
  if (empty) return;
  const text = editor.state.doc.textBetween(from, to, "\n");
  editor.chain().focus().insertContentAt({ from, to }, transform(text)).run();
}

// Real list reordering — walks the actual list node's children and rebuilds
// it sorted, so this is a genuine document mutation, not a cosmetic sort.
function sortList(editor, direction) {
  const { $from } = editor.state.selection;
  let depth = null;
  for (let d = $from.depth; d > 0; d -= 1) {
    if (["bulletList", "orderedList"].includes($from.node(d).type.name)) {
      depth = d;
      break;
    }
  }
  if (depth == null) return;
  const listNode = $from.node(depth);
  const listPos = $from.before(depth);
  const items = [];
  listNode.forEach((child) => items.push(child));
  const sorted = [...items].sort((a, b) => {
    const at = a.textContent.trim().toLowerCase();
    const bt = b.textContent.trim().toLowerCase();
    return direction === "asc" ? at.localeCompare(bt) : bt.localeCompare(at);
  });
  const newListNode = listNode.type.create(listNode.attrs, sorted);
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.replaceWith(listPos, listPos + listNode.nodeSize, newListNode);
      return true;
    })
    .run();
}

// Sinking a list item one level deeper (Increase Indent, or Tab) creates a
// brand-new nested orderedList node with the schema's *default* attrs — it
// does not inherit the parent list's `multilevel` scheme on its own. This
// re-tags the freshly created nested list with the same scheme right after
// sinking, so "1 → 1.1 → 1.1.1" genuinely continues at every depth instead
// of resetting to plain "1. 2. 3." the moment you indent.
function handleIndentChange(editor, direction) {
  if (editor.isActive("listItem")) {
    if (direction === "increase") {
      const { $from } = editor.state.selection;
      let multilevel = null;
      for (let d = $from.depth; d > 0; d -= 1) {
        if ($from.node(d).type.name === "orderedList") {
          multilevel = $from.node(d).attrs.multilevel;
          break;
        }
      }
      editor.chain().focus().sinkListItem("listItem").run();
      if (multilevel) editor.chain().focus().updateAttributes("orderedList", { multilevel }).run();
    } else {
      editor.chain().focus().liftListItem("listItem").run();
    }
    return;
  }
  const attrs = activeBlockAttrs(editor);
  const next = direction === "increase" ? Math.min((attrs.indent || 0) + 1, 8) : Math.max((attrs.indent || 0) - 1, 0);
  updateBlockAttrs(editor, { indent: next });
}

function applyBulletStyle(editor, markerStyle) {
  const chain = editor.chain().focus();
  if (!editor.isActive("bulletList")) chain.toggleBulletList();
  chain.updateAttributes("bulletList", { markerStyle }).run();
}

function applyNumberStyle(editor, markerStyle) {
  const chain = editor.chain().focus();
  if (!editor.isActive("orderedList")) chain.toggleOrderedList();
  chain.updateAttributes("orderedList", { markerStyle, multilevel: null }).run();
}

function applyMultilevel(editor, multilevel) {
  const chain = editor.chain().focus();
  if (!editor.isActive("orderedList")) chain.toggleOrderedList();
  chain.updateAttributes("orderedList", { multilevel }).run();
}

// The icon half of a Word-style split button (Bullets/Numbering apply their
// default style on a direct click; Font Color/Highlight reapply the last-
// picked color) — paired with a RibbonMenu in `chevronOnly` mode for the
// gallery/palette half.
function SplitButton({ icon: Icon, label, active, swatch, onMainClick, menuLabel, children }) {
  return (
    <div className="ribbon-split-btn">
      <button type="button" className={`ribbon-btn ribbon-btn-icon ribbon-split-main${active ? " active" : ""}`} onClick={onMainClick} title={label} aria-label={label}>
        <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
        {swatch && <span className="ribbon-split-swatch" style={{ background: swatch }} aria-hidden="true" />}
      </button>
      <RibbonMenu label={menuLabel || `${label} gallery`} chevronOnly active={active}>
        {children}
      </RibbonMenu>
    </div>
  );
}

function ColorSwatchGrid({ rows, labels, onPick, onClear, clearLabel, onMore }) {
  return (
    <div className="ribbon-swatch-grid" role="none">
      {onClear && (
        <button type="button" role="menuitem" className="ribbon-menu-item" onClick={onClear}>
          {clearLabel}
        </button>
      )}
      {rows.map((row, ri) => (
        <div className="ribbon-swatch-row" key={ri}>
          {row.map((hex, ci) => (
            <button
              key={`${ri}-${hex}`}
              type="button"
              role="menuitem"
              className="ribbon-swatch"
              style={{ background: hex }}
              title={labels[ci]}
              aria-label={labels[ci]}
              onClick={() => onPick(hex)}
            />
          ))}
        </div>
      ))}
      {onMore && (
        <button type="button" role="menuitem" className="ribbon-menu-item" onClick={onMore}>
          More Colors…
        </button>
      )}
    </div>
  );
}

export default function HomeTab({ editor, ui }) {
  const [paintedFormat, setPaintedFormat] = useState(null);
  const [clipboardNote, setClipboardNote] = useState("");
  const [lastFontColor, setLastFontColor] = useState("#dc2626");
  const [lastHighlightColor, setLastHighlightColor] = useState("#eab308");
  // null = not actively typing (display derives straight from editor state);
  // a string while the field has focus, so typing "1" then "11" doesn't
  // fight the editor's own value on every keystroke. Avoids a
  // useEffect+setState round trip entirely — no sync-effect footgun.
  const [editingSize, setEditingSize] = useState(null);
  const showMarks = !!ui?.showMarks;
  const noteTimerRef = useRef(null);
  const nativeColorInputRef = useRef(null);
  const nativeHighlightInputRef = useRef(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      underline: ed.isActive("underline"),
      strike: ed.isActive("strike"),
      subscript: ed.isActive("subscript"),
      superscript: ed.isActive("superscript"),
      alignLeft: ed.isActive({ textAlign: "left" }),
      alignCenter: ed.isActive({ textAlign: "center" }),
      alignRight: ed.isActive({ textAlign: "right" }),
      alignJustify: ed.isActive({ textAlign: "justify" }),
      bulletList: ed.isActive("bulletList"),
      orderedList: ed.isActive("orderedList"),
      inList: ed.isActive("listItem"),
      multilevel: ed.getAttributes("orderedList").multilevel || null,
      fontFamily: ed.getAttributes("textStyle").fontFamily || "",
      fontSize: ed.getAttributes("textStyle").fontSize || "",
      color: ed.getAttributes("textStyle").color || "",
      highlight: ed.getAttributes("highlight").color || "",
      textEffect: ed.getAttributes("textEffect").effect || "none",
      styleKey: currentStyleKey(ed),
      selectionEmpty: ed.state.selection.empty,
      border: activeBlockAttrs(ed).border || "",
      selectedBlockCount: getSelectedBlockPositions(ed).length,
    }),
  });

  const sizeDisplay = editingSize !== null ? editingSize : state.fontSize ? state.fontSize.replace("pt", "") : "";

  function flashNote(text) {
    setClipboardNote(text);
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(() => setClipboardNote(""), 2200);
  }

  async function handleCopy() {
    const { from, to } = editor.state.selection;
    if (from === to) return flashNote("Select text to copy");
    const text = editor.state.doc.textBetween(from, to, "\n");
    try {
      await navigator.clipboard.writeText(text);
      flashNote("Copied");
    } catch {
      flashNote("Clipboard access denied by browser");
    }
  }

  async function handleCut() {
    const { from, to } = editor.state.selection;
    if (from === to) return flashNote("Select text to cut");
    const text = editor.state.doc.textBetween(from, to, "\n");
    try {
      await navigator.clipboard.writeText(text);
      editor.chain().focus().deleteSelection().run();
      flashNote("Cut");
    } catch {
      flashNote("Clipboard access denied by browser");
    }
  }

  // "Keep Source Formatting" (the default — also what the large Paste icon's
  // direct click does): reads the rich text/html clipboard flavor when the
  // browser grants clipboard-read access, so pasted content keeps its bold/
  // italic/links/etc. Falls back to plain text if no html flavor is on the
  // clipboard, or if the browser denies the richer read permission — native
  // Ctrl+V always works regardless, since TipTap/ProseMirror intercepts the
  // browser's own paste event independently of this button.
  async function pasteRich() {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          const html = await blob.text();
          editor.chain().focus().insertContent(html).run();
          return;
        }
      }
      const text = await navigator.clipboard.readText();
      if (text) editor.chain().focus().insertContent(text).run();
    } catch {
      flashNote("Clipboard access denied by browser — use Ctrl+V instead");
    }
  }

  async function pastePlain() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) editor.chain().focus().insertContent(text).run();
    } catch {
      flashNote("Clipboard access denied by browser — use Ctrl+V instead");
    }
  }

  function handleFormatPainter() {
    if (!paintedFormat) {
      const marks = { bold: editor.isActive("bold"), italic: editor.isActive("italic"), underline: editor.isActive("underline"), strike: editor.isActive("strike") };
      const attrs = activeBlockAttrs(editor);
      setPaintedFormat({ marks, legalStyle: attrs.legalStyle || null, color: editor.getAttributes("textStyle").color || null });
      flashNote("Format captured — select target text, then click Format Painter again");
    } else {
      const { from, to } = editor.state.selection;
      if (from === to) {
        flashNote("Select target text to apply the painted format");
        return;
      }
      const chain = editor.chain().focus();
      Object.entries(paintedFormat.marks).forEach(([mark, active]) => {
        const commandName = `${active ? "set" : "unset"}${mark.charAt(0).toUpperCase()}${mark.slice(1)}`;
        if (typeof chain[commandName] === "function") chain[commandName]();
      });
      if (paintedFormat.color) chain.setColor(paintedFormat.color);
      chain.updateAttributes(activeBlockType(editor), { legalStyle: paintedFormat.legalStyle });
      chain.run();
      setPaintedFormat(null);
      flashNote("Format applied");
    }
  }

  function applyStyle(key) {
    const preset = ALL_STYLES.find((p) => p.key === key);
    if (!preset) return;
    preset.apply(editor.chain().focus()).run();
  }

  function stepFontSize(delta) {
    const current = parseInt(state.fontSize, 10) || 12;
    const next = Math.max(6, Math.min(96, current + delta));
    editor.chain().focus().setFontSize(`${next}pt`).run();
  }

  function commitSize(value) {
    setEditingSize(null);
    if (!value || !value.trim()) {
      editor.chain().focus().unsetFontSize().run();
      return;
    }
    const n = parseInt(value, 10);
    if (Number.isFinite(n) && n > 0) {
      editor.chain().focus().setFontSize(`${Math.max(6, Math.min(96, n))}pt`).run();
    }
  }

  function applyFontColor(c) {
    editor.chain().focus().setColor(c).run();
    setLastFontColor(c);
  }
  function applyHighlight(c) {
    editor.chain().focus().setHighlight({ color: c }).run();
    setLastHighlightColor(c);
  }

  function toggleShowMarks() {
    ui?.setShowMarks(!showMarks);
  }

  // Clicking anywhere in the ribbon (buttons, dropdown panels) must never
  // steal DOM focus away from the document — preventDefault on mousedown
  // stops the browser from blurring the contenteditable at all, so the
  // editor's native selection highlight never flashes/disappears, and every
  // command below (which calls .focus() before running) lands on exactly
  // the text the user had selected. Real inputs (font family/size, the
  // native color pickers) are excluded so they still receive focus normally.
  function handleRibbonMouseDown(event) {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    event.preventDefault();
  }

  return (
    <div className="ribbon-groups ribbon-groups-home" onMouseDown={handleRibbonMouseDown}>
      {/* Clipboard */}
      <div className="ribbon-group">
        <div className="ribbon-clipboard-layout">
          <div className="ribbon-paste-split">
            <button type="button" className="ribbon-btn-paste-icon" onClick={pasteRich} title="Paste (Ctrl+V)" aria-label="Paste">
              <ClipboardPaste size={22} strokeWidth={1.6} aria-hidden="true" />
            </button>
            <RibbonMenu label="Paste options" text="Paste" triggerClassName="ribbon-btn-paste-label" panelClassName="ribbon-paste-panel">
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={pasteRich}>
                Keep Source Formatting
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={pastePlain}>
                Keep Text Only
              </button>
            </RibbonMenu>
          </div>
          <div className="ribbon-clipboard-stack">
            <button type="button" className="ribbon-btn ribbon-btn-row" onClick={handleCut} title="Cut (Ctrl+X)" aria-label="Cut">
              <Scissors size={12} strokeWidth={2} aria-hidden="true" />
              <span>Cut</span>
            </button>
            <button type="button" className="ribbon-btn ribbon-btn-row" onClick={handleCopy} title="Copy (Ctrl+C)" aria-label="Copy">
              <Copy size={12} strokeWidth={2} aria-hidden="true" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-row${paintedFormat ? " active" : ""}`}
              onClick={handleFormatPainter}
              title={paintedFormat ? "Apply painted format" : "Format Painter"}
              aria-label={paintedFormat ? "Apply painted format" : "Format Painter"}
            >
              <Paintbrush size={12} strokeWidth={2} aria-hidden="true" />
              <span>Format Painter</span>
            </button>
          </div>
        </div>
        <div className="ribbon-group-label">Clipboard{clipboardNote ? ` — ${clipboardNote}` : ""}</div>
      </div>

      {/* Font */}
      <div className="ribbon-group">
        <div className="ribbon-group-rows">
          <div className="ribbon-group-body">
            <select className="ribbon-select" value={state.fontFamily} onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()} title="Font family" aria-label="Font family">
              <option value="">Aptos (Body)</option>
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <input
              className="ribbon-select ribbon-size-input"
              list="ribbon-font-size-list"
              value={sizeDisplay}
              placeholder="11"
              title="Font size"
              aria-label="Font size"
              onFocus={(e) => setEditingSize(e.target.value)}
              onChange={(e) => setEditingSize(e.target.value)}
              onBlur={(e) => commitSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitSize(e.currentTarget.value);
                  e.currentTarget.blur();
                }
              }}
            />
            <datalist id="ribbon-font-size-list">
              {FONT_SIZES.map((s) => (
                <option key={s} value={s.replace("pt", "")} />
              ))}
            </datalist>
            <button type="button" className="ribbon-btn ribbon-btn-icon" onClick={() => stepFontSize(1)} title="Increase font size" aria-label="Increase font size">
              <Plus size={13} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <button type="button" className="ribbon-btn ribbon-btn-icon" onClick={() => stepFontSize(-1)} title="Decrease font size" aria-label="Decrease font size">
              <Minus size={13} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <RibbonMenu label="Change case" icon={CaseSensitive}>
              {CASE_OPTIONS.map((opt) => (
                <button key={opt.key} type="button" role="menuitem" className="ribbon-menu-item" disabled={state.selectionEmpty} onClick={() => applyChangeCase(editor, opt.transform)}>
                  {opt.label}
                </button>
              ))}
            </RibbonMenu>
            <button
              type="button"
              className="ribbon-btn ribbon-btn-icon"
              title="Clear formatting"
              aria-label="Clear formatting"
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            >
              <Eraser size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="ribbon-group-body">
            <button type="button" className={`ribbon-btn ribbon-btn-icon${state.bold ? " active" : ""}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)" aria-label="Bold">
              <Bold size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <button type="button" className={`ribbon-btn ribbon-btn-icon${state.italic ? " active" : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)" aria-label="Italic">
              <Italic size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-icon${state.underline ? " active" : ""}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline (Ctrl+U)"
              aria-label="Underline"
            >
              <Underline size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-icon${state.strike ? " active" : ""}`}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
              aria-label="Strikethrough"
            >
              <Strikethrough size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-icon${state.subscript ? " active" : ""}`}
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              title="Subscript (Ctrl+,)"
              aria-label="Subscript"
            >
              <SubscriptIcon size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-icon${state.superscript ? " active" : ""}`}
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              title="Superscript (Ctrl+.)"
              aria-label="Superscript"
            >
              <SuperscriptIcon size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <RibbonMenu label="Text effects" icon={Sparkles} active={state.textEffect !== "none"}>
              {TEXT_EFFECTS.map((fx) => (
                <button
                  key={fx.key}
                  type="button"
                  role="menuitem"
                  className="ribbon-menu-item"
                  onClick={() => (fx.key === "none" ? editor.chain().focus().unsetTextEffect().run() : editor.chain().focus().setTextEffect(fx.key).run())}
                >
                  {fx.label}
                </button>
              ))}
            </RibbonMenu>
            <SplitButton icon={Highlighter} label="Text Highlight Color" swatch={lastHighlightColor} onMainClick={() => applyHighlight(lastHighlightColor)}>
              <ColorSwatchGrid
                rows={COLOR_ROWS}
                labels={COLOR_LABELS}
                onPick={applyHighlight}
                onClear={() => editor.chain().focus().unsetHighlight().run()}
                clearLabel="No Color"
                onMore={() => nativeHighlightInputRef.current?.click()}
              />
              <input
                ref={nativeHighlightInputRef}
                type="color"
                className="ribbon-color-input-hidden"
                aria-hidden="true"
                tabIndex={-1}
                value={state.highlight || lastHighlightColor}
                onChange={(e) => applyHighlight(e.target.value)}
              />
            </SplitButton>
            <SplitButton icon={Baseline} label="Font Color" swatch={lastFontColor} onMainClick={() => applyFontColor(lastFontColor)}>
              <ColorSwatchGrid
                rows={COLOR_ROWS}
                labels={COLOR_LABELS}
                onPick={applyFontColor}
                onClear={() => editor.chain().focus().unsetColor().run()}
                clearLabel="Automatic"
                onMore={() => nativeColorInputRef.current?.click()}
              />
              <input
                ref={nativeColorInputRef}
                type="color"
                className="ribbon-color-input-hidden"
                aria-hidden="true"
                tabIndex={-1}
                value={state.color || lastFontColor}
                onChange={(e) => applyFontColor(e.target.value)}
              />
            </SplitButton>
          </div>
        </div>
        <div className="ribbon-group-label">Font</div>
      </div>

      {/* Paragraph */}
      <div className="ribbon-group">
        <div className="ribbon-group-rows">
          <div className="ribbon-group-body">
            <SplitButton icon={List} label="Bullets" active={state.bulletList} onMainClick={() => editor.chain().focus().toggleBulletList().run()}>
              {BULLET_STYLES.map((s) => (
                <button key={s.key} type="button" role="menuitem" className="ribbon-menu-item" onClick={() => applyBulletStyle(editor, s.key)}>
                  <span className="ribbon-menu-glyph">{s.glyph}</span> {s.label}
                </button>
              ))}
              <hr className="ribbon-menu-divider" />
              <button type="button" role="menuitem" className="ribbon-menu-item" disabled={!state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                None
              </button>
            </SplitButton>
            <SplitButton icon={ListOrdered} label="Numbering" active={state.orderedList && !state.multilevel} onMainClick={() => editor.chain().focus().toggleOrderedList().run()}>
              {NUMBER_STYLES.map((s) => (
                <button key={s.key} type="button" role="menuitem" className="ribbon-menu-item" onClick={() => applyNumberStyle(editor, s.key)}>
                  {s.label}
                </button>
              ))}
              <hr className="ribbon-menu-divider" />
              <button type="button" role="menuitem" className="ribbon-menu-item" disabled={!state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                None
              </button>
            </SplitButton>
            <RibbonMenu label="Multilevel List" icon={ListTree} active={!!state.multilevel}>
              {MULTILEVEL_PRESETS.map((p) => (
                <button key={p.key} type="button" role="menuitem" className="ribbon-menu-item" onClick={() => applyMultilevel(editor, p.key)}>
                  <strong>{p.label}</strong>
                  <br />
                  <small>{p.hint}</small>
                </button>
              ))}
              <hr className="ribbon-menu-divider" />
              <button type="button" role="menuitem" className="ribbon-menu-item" disabled={!state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                Remove List
              </button>
            </RibbonMenu>
            <button type="button" className="ribbon-btn ribbon-btn-icon" onClick={() => handleIndentChange(editor, "decrease")} title="Decrease Indent" aria-label="Decrease indent">
              <IndentDecrease size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" className="ribbon-btn ribbon-btn-icon" onClick={() => handleIndentChange(editor, "increase")} title="Increase Indent" aria-label="Increase indent">
              <IndentIncrease size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <RibbonMenu label="Sort" icon={ArrowDownAZ} disabled={!state.inList}>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => sortList(editor, "asc")}>
                <ArrowDownAZ size={13} strokeWidth={2} aria-hidden="true" /> A to Z
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => sortList(editor, "desc")}>
                <ArrowUpAZ size={13} strokeWidth={2} aria-hidden="true" /> Z to A
              </button>
            </RibbonMenu>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-icon${showMarks ? " active" : ""}`}
              title="Show/Hide formatting marks"
              aria-label="Show or hide formatting marks"
              aria-pressed={showMarks}
              onClick={toggleShowMarks}
            >
              <Pilcrow size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="ribbon-group-body">
            <button type="button" className={`ribbon-btn ribbon-btn-icon${state.alignLeft ? " active" : ""}`} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left (Ctrl+L)" aria-label="Align left">
              <AlignLeft size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" className={`ribbon-btn ribbon-btn-icon${state.alignCenter ? " active" : ""}`} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Center (Ctrl+E)" aria-label="Center">
              <AlignCenter size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" className={`ribbon-btn ribbon-btn-icon${state.alignRight ? " active" : ""}`} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right (Ctrl+R)" aria-label="Align right">
              <AlignRight size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-icon${state.alignJustify ? " active" : ""}`}
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              title="Justify (Ctrl+J)"
              aria-label="Justify"
            >
              <AlignJustify size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <RibbonMenu label="Line and Paragraph Spacing" icon={WrapText}>
              {LINE_SPACING_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" role="menuitem" className="ribbon-menu-item" onClick={() => updateBlockAttrs(editor, { lineSpacing: opt.value })}>
                  {opt.label}
                </button>
              ))}
              <hr className="ribbon-menu-divider" />
              <button
                type="button"
                role="menuitem"
                className="ribbon-menu-item"
                onClick={() => {
                  const attrs = activeBlockAttrs(editor);
                  updateBlockAttrs(editor, { spacingBefore: !attrs.spacingBefore });
                }}
              >
                Add/Remove Space Before Paragraph
              </button>
              <button
                type="button"
                role="menuitem"
                className="ribbon-menu-item"
                onClick={() => {
                  const attrs = activeBlockAttrs(editor);
                  updateBlockAttrs(editor, { spacingAfter: !attrs.spacingAfter });
                }}
              >
                Add/Remove Space After Paragraph
              </button>
            </RibbonMenu>
            <RibbonMenu label="Shading" icon={PaintBucket}>
              <ColorSwatchGrid
                rows={[SHADING_COLORS.map((s) => s.value)]}
                labels={SHADING_COLORS.map((s) => s.label)}
                onPick={(c) => updateBlockAttrs(editor, { shading: c })}
                onClear={() => updateBlockAttrs(editor, { shading: null })}
                clearLabel="No Color"
              />
            </RibbonMenu>
            <RibbonMenu label="Borders" icon={Square} active={!!state.border}>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => toggleBorderSide(editor, "bottom")}>
                Bottom Border
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => toggleBorderSide(editor, "top")}>
                Top Border
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => toggleBorderSide(editor, "left")}>
                Left Border
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => toggleBorderSide(editor, "right")}>
                Right Border
              </button>
              <hr className="ribbon-menu-divider" />
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => setAllBlocksBorder(editor, "")}>
                No Border
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => setAllBlocksBorder(editor, "top bottom left right")}>
                All Borders
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => setGroupBorder(editor, "outside")}>
                Outside Borders
              </button>
              <button
                type="button"
                role="menuitem"
                className="ribbon-menu-item"
                disabled={state.selectedBlockCount < 2}
                title={state.selectedBlockCount < 2 ? "Select multiple paragraphs to add inside borders" : undefined}
                onClick={() => setGroupBorder(editor, "inside")}
              >
                Inside Borders
              </button>
            </RibbonMenu>
          </div>
        </div>
        <div className="ribbon-group-label">Paragraph</div>
      </div>

      {/* Styles */}
      <div className="ribbon-group ribbon-group-grow">
        <div className="ribbon-group-body">
          <RibbonMenu
            label="Styles gallery"
            text={ALL_STYLES.find((s) => s.key === state.styleKey)?.label || "Normal"}
            triggerClassName="ribbon-style-trigger"
            panelClassName="ribbon-styles-panel"
          >
            {STYLE_GROUPS.map((group) => (
              <div key={group.label} className="ribbon-menu-section">
                <div className="ribbon-menu-section-label">{group.label}</div>
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    className={`ribbon-menu-item${state.styleKey === item.key ? " active" : ""}`}
                    onClick={() => applyStyle(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </RibbonMenu>
        </div>
        <div className="ribbon-group-label">Styles</div>
      </div>
    </div>
  );
}
