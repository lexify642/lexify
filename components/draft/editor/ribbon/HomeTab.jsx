"use client";

import { useRef, useState } from "react";
import { useEditorState } from "@tiptap/react";

const FONT_FAMILIES = ["Georgia", "Times New Roman", "Arial", "Calibri", "Verdana"];
const FONT_SIZES = ["8pt", "9pt", "10pt", "11pt", "12pt", "14pt", "16pt", "18pt", "20pt", "24pt", "28pt", "32pt", "36pt", "48pt"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa"];

const STYLE_PRESETS = [
  { key: "normal", label: "Normal", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: null }) },
  { key: "title", label: "Title", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "title" }) },
  { key: "subtitle", label: "Subtitle", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "subtitle" }) },
  { key: "heading1", label: "Heading 1", apply: (chain) => chain.setHeading({ level: 1 }).updateAttributes("heading", { legalStyle: null }) },
  { key: "heading2", label: "Heading 2", apply: (chain) => chain.setHeading({ level: 2 }).updateAttributes("heading", { legalStyle: null }) },
  { key: "heading3", label: "Heading 3", apply: (chain) => chain.setHeading({ level: 3 }).updateAttributes("heading", { legalStyle: null }) },
  { key: "quote", label: "Quote", apply: (chain) => chain.toggleBlockquote() },
  { key: "legal-heading", label: "Legal Heading", apply: (chain) => chain.setHeading({ level: 2 }).updateAttributes("heading", { legalStyle: "legal-heading" }) },
  { key: "legal-paragraph", label: "Legal Paragraph", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "legal-paragraph" }) },
  { key: "prayer-relief", label: "Prayer / Relief", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "prayer-relief" }) },
  { key: "signature-block", label: "Signature Block", apply: (chain) => chain.setParagraph().updateAttributes("paragraph", { legalStyle: "signature-block" }) },
];

function currentStyleKey(editor) {
  if (editor.isActive("blockquote")) return "quote";
  if (editor.isActive("heading", { level: 1 })) return "heading1";
  if (editor.isActive("heading", { level: 3 })) return "heading3";
  if (editor.isActive("heading", { level: 2 })) {
    return editor.getAttributes("heading").legalStyle === "legal-heading" ? "legal-heading" : "heading2";
  }
  if (editor.isActive("paragraph")) {
    const style = editor.getAttributes("paragraph").legalStyle;
    if (style) return style;
    return "normal";
  }
  return "normal";
}

export default function HomeTab({ editor }) {
  const [paintedFormat, setPaintedFormat] = useState(null);
  const [clipboardNote, setClipboardNote] = useState("");
  const noteTimerRef = useRef(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      underline: ed.isActive("underline"),
      strike: ed.isActive("strike"),
      alignLeft: ed.isActive({ textAlign: "left" }),
      alignCenter: ed.isActive({ textAlign: "center" }),
      alignRight: ed.isActive({ textAlign: "right" }),
      alignJustify: ed.isActive({ textAlign: "justify" }),
      bulletList: ed.isActive("bulletList"),
      orderedList: ed.isActive("orderedList"),
      fontFamily: ed.getAttributes("textStyle").fontFamily || "",
      fontSize: ed.getAttributes("textStyle").fontSize || "",
      color: ed.getAttributes("textStyle").color || "",
      styleKey: currentStyleKey(ed),
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
      const attrs = editor.isActive("heading") ? editor.getAttributes("heading") : editor.getAttributes("paragraph");
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
      if (editor.isActive("paragraph")) chain.updateAttributes("paragraph", { legalStyle: paintedFormat.legalStyle });
      if (editor.isActive("heading")) chain.updateAttributes("heading", { legalStyle: paintedFormat.legalStyle });
      chain.run();
      setPaintedFormat(null);
      flashNote("Format applied");
    }
  }

  function applyStyle(key) {
    const preset = STYLE_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    preset.apply(editor.chain().focus()).run();
  }

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={handlePaste} title="Paste (Ctrl+V)">
            Paste
          </button>
          <button type="button" className="ribbon-btn" onClick={handleCut} title="Cut (Ctrl+X)">
            Cut
          </button>
          <button type="button" className="ribbon-btn" onClick={handleCopy} title="Copy (Ctrl+C)">
            Copy
          </button>
          <button
            type="button"
            className={`ribbon-btn${paintedFormat ? " active" : ""}`}
            onClick={handleFormatPainter}
            title="Format Painter"
          >
            {paintedFormat ? "Apply Format" : "Format Painter"}
          </button>
        </div>
        <div className="ribbon-group-label">Clipboard</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body ribbon-group-body-wrap">
          <select
            className="ribbon-select"
            value={state.fontFamily}
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          >
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
          >
            <option value="">Size</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.bold ? " active" : ""}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
            <b>B</b>
          </button>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.italic ? " active" : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
            <i>I</i>
          </button>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.underline ? " active" : ""}`} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
            <u>U</u>
          </button>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.strike ? " active" : ""}`} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
            <s>S</s>
          </button>
          <label className="ribbon-color-swatch" title="Highlight color">
            H
            <select onChange={(e) => (e.target.value ? editor.chain().focus().toggleHighlight({ color: e.target.value }).run() : editor.chain().focus().unsetHighlight().run())} defaultValue="">
              <option value="">None</option>
              {HIGHLIGHT_COLORS.map((c) => (
                <option key={c} value={c} style={{ background: c }}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <input
            type="color"
            className="ribbon-color-input"
            title="Font color"
            value={state.color || "#0d253d"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
          <button
            type="button"
            className="ribbon-btn"
            title="Clear formatting"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            Clear
          </button>
        </div>
        <div className="ribbon-group-label">Font</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body ribbon-group-body-wrap">
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.alignLeft ? " active" : ""}`} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
            ≡◄
          </button>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.alignCenter ? " active" : ""}`} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Center">
            ≡
          </button>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.alignRight ? " active" : ""}`} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
            ►≡
          </button>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.alignJustify ? " active" : ""}`} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify">
            ≡≡
          </button>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.bulletList ? " active" : ""}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullets">
            •≡
          </button>
          <button type="button" className={`ribbon-btn ribbon-btn-icon${state.orderedList ? " active" : ""}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbering">
            1≡
          </button>
          <button
            type="button"
            className="ribbon-btn"
            title="Increase list level (multilevel)"
            onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
          >
            →List
          </button>
          <button
            type="button"
            className="ribbon-btn"
            title="Decrease list level"
            onClick={() => editor.chain().focus().liftListItem("listItem").run()}
          >
            ←List
          </button>
          <button
            type="button"
            className="ribbon-btn"
            title="Increase indent"
            onClick={() => {
              const attrs = editor.isActive("heading") ? editor.getAttributes("heading") : editor.getAttributes("paragraph");
              const type = editor.isActive("heading") ? "heading" : "paragraph";
              editor.chain().focus().updateAttributes(type, { indent: Math.min((attrs.indent || 0) + 1, 8) }).run();
            }}
          >
            Indent+
          </button>
          <button
            type="button"
            className="ribbon-btn"
            title="Decrease indent"
            onClick={() => {
              const attrs = editor.isActive("heading") ? editor.getAttributes("heading") : editor.getAttributes("paragraph");
              const type = editor.isActive("heading") ? "heading" : "paragraph";
              editor.chain().focus().updateAttributes(type, { indent: Math.max((attrs.indent || 0) - 1, 0) }).run();
            }}
          >
            Indent-
          </button>
          <select
            className="ribbon-select ribbon-select-narrow"
            title="Line spacing"
            defaultValue=""
            onChange={(e) => {
              const type = editor.isActive("heading") ? "heading" : "paragraph";
              editor.chain().focus().updateAttributes(type, { lineSpacing: e.target.value || null }).run();
            }}
          >
            <option value="">Spacing</option>
            <option value="1">Single</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
            <option value="2">Double</option>
          </select>
          <button
            type="button"
            className="ribbon-btn"
            title="Toggle paragraph spacing before/after"
            onClick={() => {
              const type = editor.isActive("heading") ? "heading" : "paragraph";
              const attrs = editor.isActive("heading") ? editor.getAttributes("heading") : editor.getAttributes("paragraph");
              editor.chain().focus().updateAttributes(type, { spacingBefore: !attrs.spacingBefore, spacingAfter: !attrs.spacingAfter }).run();
            }}
          >
            ¶ Spacing
          </button>
          <button
            type="button"
            className="ribbon-btn"
            title="Toggle paragraph border"
            onClick={() => {
              const type = editor.isActive("heading") ? "heading" : "paragraph";
              const attrs = editor.isActive("heading") ? editor.getAttributes("heading") : editor.getAttributes("paragraph");
              editor.chain().focus().updateAttributes(type, { border: !attrs.border }).run();
            }}
          >
            Border
          </button>
          <button
            type="button"
            className="ribbon-btn"
            title="Show/hide formatting marks"
            onClick={() => document.querySelector(".document")?.classList.toggle("show-marks")}
          >
            ¶ Marks
          </button>
        </div>
        <div className="ribbon-group-label">Paragraph</div>
      </div>

      <div className="ribbon-group ribbon-group-grow">
        <div className="ribbon-group-body">
          <select className="ribbon-select ribbon-style-select" value={state.styleKey} onChange={(e) => applyStyle(e.target.value)}>
            {STYLE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ribbon-group-label">Styles{clipboardNote ? ` — ${clipboardNote}` : ""}</div>
      </div>
    </div>
  );
}
