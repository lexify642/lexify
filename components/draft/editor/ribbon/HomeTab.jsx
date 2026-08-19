"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorState } from "@tiptap/react";
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

const FONT_FAMILIES = ["Georgia", "Times New Roman", "Arial", "Calibri", "Verdana"];
const FONT_SIZES = ["8pt", "9pt", "10pt", "11pt", "12pt", "14pt", "16pt", "18pt", "20pt", "24pt", "28pt", "32pt", "36pt", "48pt"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa"];
const SHADING_COLORS = ["#f6f9fc", "#eef2f6", "#e3e8ee", "#f2eef7", "#fde68a55"];
const FONT_COLORS = ["#0d253d", "#5E2B9D", "#16a34a", "#dc2626", "#b45309", "#3B82F6", "#64748d"];

const CASE_OPTIONS = [
  { key: "upper", label: "UPPERCASE", transform: (t) => t.toUpperCase() },
  { key: "lower", label: "lowercase", transform: (t) => t.toLowerCase() },
  { key: "capitalize", label: "Capitalize Each Word", transform: (t) => t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) },
  { key: "sentence", label: "Sentence case.", transform: (t) => t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()) },
  { key: "toggle", label: "tOGGLE cASE", transform: (t) => t.split("").map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("") },
];

const TEXT_EFFECTS = [
  { key: "none", label: "None (clear effect)" },
  { key: "outline", label: "Outline" },
  { key: "shadow", label: "Shadow" },
  { key: "glow", label: "Glow" },
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

function handleIndentChange(editor, direction) {
  if (editor.isActive("listItem")) {
    if (direction === "increase") editor.chain().focus().sinkListItem("listItem").run();
    else editor.chain().focus().liftListItem("listItem").run();
    return;
  }
  const attrs = activeBlockAttrs(editor);
  const next = direction === "increase" ? Math.min((attrs.indent || 0) + 1, 8) : Math.max((attrs.indent || 0) - 1, 0);
  updateBlockAttrs(editor, { indent: next });
}

function handleMultilevelList(editor) {
  if (editor.isActive("orderedList") || editor.isActive("bulletList")) {
    editor.chain().focus().sinkListItem("listItem").run();
  } else {
    editor.chain().focus().toggleOrderedList().run();
  }
}

// A small, reusable button + popover — every dropdown control in this
// ribbon (Change Case, Text Effects, colors, Shading, Sort, Styles) is one
// of these, closing on outside click or Escape. Defaults to an icon
// trigger; pass `text` instead for a label-style trigger (used by Styles).
// The panel renders `position:fixed` at a rect measured from the trigger
// button, rather than relying on normal absolute-in-flow positioning —
// .ribbon-panel (the ribbon's own horizontal-scroll container) computes an
// effective overflow:auto on both axes once overflow-x is set, which would
// otherwise clip any dropdown extending below the ribbon.
function RibbonMenu({ label, icon: Icon, text, active, disabled, triggerClassName, panelClassName, children }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (btnRef.current?.contains(event.target)) return;
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  }

  return (
    <div className="ribbon-menu">
      <button
        ref={btnRef}
        type="button"
        className={`ribbon-btn ribbon-btn-menu${text ? " ribbon-btn-menu-text" : " ribbon-btn-icon"}${active ? " active" : ""}${triggerClassName ? ` ${triggerClassName}` : ""}`}
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggleOpen}
      >
        {text ? <span className="ribbon-btn-menu-label">{text}</span> : Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
        <ChevronDown size={9} strokeWidth={3} className="ribbon-chevron" aria-hidden="true" />
      </button>
      {open && coords && (
        <div
          ref={panelRef}
          className={`ribbon-menu-panel ${panelClassName || ""}`}
          role="menu"
          style={{ top: coords.top, left: coords.left }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ColorSwatchGrid({ colors, onPick, onClear, clearLabel }) {
  return (
    <div className="ribbon-swatch-grid" role="none">
      {onClear && (
        <button type="button" role="menuitem" className="ribbon-menu-item" onClick={onClear}>
          {clearLabel}
        </button>
      )}
      <div className="ribbon-swatch-row">
        {colors.map((c) => (
          <button key={c} type="button" role="menuitem" className="ribbon-swatch" style={{ background: c }} aria-label={`Color ${c}`} onClick={() => onPick(c)} />
        ))}
      </div>
    </div>
  );
}

export default function HomeTab({ editor }) {
  const [paintedFormat, setPaintedFormat] = useState(null);
  const [clipboardNote, setClipboardNote] = useState("");
  const noteTimerRef = useRef(null);
  const nativeColorInputRef = useRef(null);

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
      fontFamily: ed.getAttributes("textStyle").fontFamily || "",
      fontSize: ed.getAttributes("textStyle").fontSize || "",
      color: ed.getAttributes("textStyle").color || "",
      textEffect: ed.getAttributes("textEffect").effect || "none",
      styleKey: currentStyleKey(ed),
      selectionEmpty: ed.state.selection.empty,
      border: !!activeBlockAttrs(ed).border,
    }),
  });

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

  async function handlePaste() {
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

  return (
    <div className="ribbon-groups ribbon-groups-home">
      {/* Clipboard */}
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn ribbon-btn-icon" onClick={handlePaste} title="Paste (Ctrl+V)" aria-label="Paste">
            <ClipboardPaste size={15} strokeWidth={2} aria-hidden="true" />
          </button>
          <button type="button" className="ribbon-btn ribbon-btn-icon" onClick={handleCut} title="Cut (Ctrl+X)" aria-label="Cut">
            <Scissors size={15} strokeWidth={2} aria-hidden="true" />
          </button>
          <button type="button" className="ribbon-btn ribbon-btn-icon" onClick={handleCopy} title="Copy (Ctrl+C)" aria-label="Copy">
            <Copy size={15} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`ribbon-btn ribbon-btn-icon${paintedFormat ? " active" : ""}`}
            onClick={handleFormatPainter}
            title={paintedFormat ? "Apply painted format" : "Format Painter"}
            aria-label={paintedFormat ? "Apply painted format" : "Format Painter"}
          >
            <Paintbrush size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div className="ribbon-group-label">Clipboard{clipboardNote ? ` — ${clipboardNote}` : ""}</div>
      </div>

      {/* Font */}
      <div className="ribbon-group">
        <div className="ribbon-group-rows">
          <div className="ribbon-group-body">
            <select className="ribbon-select" value={state.fontFamily} onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()} title="Font family" aria-label="Font family">
              <option value="">Font</option>
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              className="ribbon-select ribbon-select-narrow"
              value={state.fontSize}
              onChange={(e) => (e.target.value ? editor.chain().focus().setFontSize(e.target.value).run() : editor.chain().focus().unsetFontSize().run())}
              title="Font size"
              aria-label="Font size"
            >
              <option value="">Size</option>
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
            <RibbonMenu label="Text highlight color" icon={Highlighter}>
              <ColorSwatchGrid
                colors={HIGHLIGHT_COLORS}
                onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
                onClear={() => editor.chain().focus().unsetHighlight().run()}
                clearLabel="No Color"
              />
            </RibbonMenu>
            <RibbonMenu label="Font color" icon={Baseline}>
              <ColorSwatchGrid
                colors={FONT_COLORS}
                onPick={(c) => editor.chain().focus().setColor(c).run()}
                onClear={() => editor.chain().focus().unsetColor().run()}
                clearLabel="Automatic"
              />
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => nativeColorInputRef.current?.click()}>
                More Colors…
              </button>
              <input
                ref={nativeColorInputRef}
                type="color"
                className="ribbon-color-input-hidden"
                aria-hidden="true"
                tabIndex={-1}
                value={state.color || "#0d253d"}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              />
            </RibbonMenu>
          </div>
        </div>
        <div className="ribbon-group-label">Font</div>
      </div>

      {/* Paragraph */}
      <div className="ribbon-group">
        <div className="ribbon-group-rows">
          <div className="ribbon-group-body">
            <button type="button" className={`ribbon-btn ribbon-btn-icon${state.bulletList ? " active" : ""}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullets" aria-label="Bullets">
              <List size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-icon${state.orderedList ? " active" : ""}`}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbering"
              aria-label="Numbering"
            >
              <ListOrdered size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" className="ribbon-btn ribbon-btn-icon" onClick={() => handleMultilevelList(editor)} title="Multilevel List" aria-label="Multilevel list">
              <ListTree size={14} strokeWidth={2} aria-hidden="true" />
            </button>
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
              className="ribbon-btn ribbon-btn-icon"
              title="Show/Hide formatting marks"
              aria-label="Show or hide formatting marks"
              onClick={() => document.querySelector(".document")?.classList.toggle("show-marks")}
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
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => updateBlockAttrs(editor, { lineSpacing: "1" })}>
                Single
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => updateBlockAttrs(editor, { lineSpacing: "1.15" })}>
                1.15
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => updateBlockAttrs(editor, { lineSpacing: "1.5" })}>
                1.5
              </button>
              <button type="button" role="menuitem" className="ribbon-menu-item" onClick={() => updateBlockAttrs(editor, { lineSpacing: "2" })}>
                Double
              </button>
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
              <ColorSwatchGrid colors={SHADING_COLORS} onPick={(c) => updateBlockAttrs(editor, { shading: c })} onClear={() => updateBlockAttrs(editor, { shading: null })} clearLabel="No Color" />
            </RibbonMenu>
            <button
              type="button"
              className={`ribbon-btn ribbon-btn-icon${state.border ? " active" : ""}`}
              title="Borders"
              aria-label="Toggle paragraph border"
              onClick={() => {
                const attrs = activeBlockAttrs(editor);
                updateBlockAttrs(editor, { border: !attrs.border });
              }}
            >
              <Square size={14} strokeWidth={2} aria-hidden="true" />
            </button>
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
