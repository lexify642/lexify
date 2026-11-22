"use client";

import { useState } from "react";
import { useEditorState } from "@tiptap/react";
import { PanelsTopLeft, RectangleVertical, RectangleHorizontal, FileText, Columns2, SeparatorHorizontal, ListOrdered, WrapText } from "lucide-react";
import { useDrafts } from "../../DraftsContext";
import RibbonMenu from "./RibbonMenu";
import { MARGIN_PRESETS, PAGE_DIMENSIONS, PX_PER_CM, marginsFor } from "../pagination";

function cm(px) {
  return +(px / PX_PER_CM).toFixed(2);
}

function CustomMarginsDialog({ layout, onClose, onSave }) {
  const current = marginsFor(layout);
  const [values, setValues] = useState({ top: cm(current.top), bottom: cm(current.bottom), left: cm(current.left), right: cm(current.right) });
  const sides = ["top", "bottom", "left", "right"];
  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal" role="dialog" aria-label="Custom margins">
        <div className="modal-head">
          <div>
            <p className="eyebrow">LAYOUT</p>
            <h2>Custom Margins</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            {sides.map((side) => (
              <label key={side} className="form-field">
                {side[0].toUpperCase() + side.slice(1)} (cm)
                <input type="number" min={0} max={10} step={0.1} value={values[side]} onChange={(e) => setValues((v) => ({ ...v, [side]: e.target.value }))} />
              </label>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const px = Object.fromEntries(sides.map((s) => [s, Math.round(Math.min(10, Math.max(0, Number(values[s]) || 0)) * PX_PER_CM)]));
              onSave(px);
              onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// Indent/spacing of the paragraph(s) under the cursor, applied to every
// paragraph and heading in the selection.
function useParagraphFormat(editor) {
  return useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const attrs = ed.isActive("heading") ? ed.getAttributes("heading") : ed.getAttributes("paragraph");
      const toPt = (v) => (v === true ? 12 : Number(v) || 0);
      return {
        indentLeftCm: +(((attrs.indent || 0) * 32) / PX_PER_CM).toFixed(2),
        indentRightCm: +((attrs.indentRight || 0) / PX_PER_CM).toFixed(2),
        before: toPt(attrs.spacingBefore),
        after: toPt(attrs.spacingAfter),
      };
    },
  });
}

function setBlockAttrs(editor, attrs) {
  editor.chain().focus().updateAttributes("paragraph", attrs).updateAttributes("heading", attrs).run();
}

function NumberField({ label, value, unit, step, min, max, onCommit }) {
  const [draftValue, setDraftValue] = useState(null);
  const shown = draftValue ?? value;
  function commit() {
    if (draftValue === null) return;
    const n = Math.min(max, Math.max(min, Number(draftValue) || 0));
    setDraftValue(null);
    onCommit(n);
  }
  return (
    <label className="ribbon-number-field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={shown}
        onChange={(e) => setDraftValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
      <small>{unit}</small>
    </label>
  );
}

export default function LayoutTab({ editor, draft }) {
  const { updateDraftLayout } = useDrafts();
  const [customOpen, setCustomOpen] = useState(false);
  const layout = draft.layout;
  const fmt = useParagraphFormat(editor) || { indentLeftCm: 0, indentRightCm: 0, before: 0, after: 0 };
  const set = (patch) => updateDraftLayout(draft.id, patch);

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <RibbonMenu label="Margins" icon={PanelsTopLeft} big>
            {Object.entries(MARGIN_PRESETS).map(([key, m]) => (
              <button key={key} type="button" className={`ribbon-menu-item ribbon-menu-item-2line${layout.margin === key ? " active" : ""}`} onClick={() => set({ margin: key })}>
                <b>{m.label}</b>
                <small>
                  Top {cm(m.top)} cm · Bottom {cm(m.bottom)} cm · Left {cm(m.left)} cm · Right {cm(m.right)} cm
                </small>
              </button>
            ))}
            <hr className="ribbon-menu-divider" />
            <button type="button" className={`ribbon-menu-item${layout.margin === "custom" ? " active" : ""}`} onClick={() => setCustomOpen(true)}>
              Custom Margins…
            </button>
          </RibbonMenu>
          <RibbonMenu label="Orientation" icon={layout.orientation === "landscape" ? RectangleHorizontal : RectangleVertical} big>
            <button type="button" className={`ribbon-menu-item${layout.orientation !== "landscape" ? " active" : ""}`} onClick={() => set({ orientation: "portrait" })}>
              <RectangleVertical size={14} aria-hidden="true" /> Portrait
            </button>
            <button type="button" className={`ribbon-menu-item${layout.orientation === "landscape" ? " active" : ""}`} onClick={() => set({ orientation: "landscape" })}>
              <RectangleHorizontal size={14} aria-hidden="true" /> Landscape
            </button>
          </RibbonMenu>
          <RibbonMenu label="Size" icon={FileText} big>
            {Object.entries(PAGE_DIMENSIONS).map(([key, d]) => (
              <button key={key} type="button" className={`ribbon-menu-item${layout.pageSize === key ? " active" : ""}`} onClick={() => set({ pageSize: key })}>
                {d.label}
              </button>
            ))}
          </RibbonMenu>
          <RibbonMenu label="Columns" icon={Columns2} big>
            {[1, 2, 3].map((c) => (
              <button key={c} type="button" className={`ribbon-menu-item${(layout.columns || 1) === c ? " active" : ""}`} onClick={() => set({ columns: c })}>
                {c === 1 ? "One" : c === 2 ? "Two" : "Three"}
              </button>
            ))}
            <p className="ribbon-menu-note">More than one column shows the document as a single continuous page.</p>
          </RibbonMenu>
          <RibbonMenu label="Breaks" icon={SeparatorHorizontal} big>
            <div className="ribbon-menu-section-label">Page breaks</div>
            <button type="button" className="ribbon-menu-item" onClick={() => editor.chain().focus().insertPageBreak("page").run()}>
              Page
            </button>
            <button type="button" className="ribbon-menu-item" onClick={() => editor.chain().focus().insertPageBreak("column").run()} disabled={(layout.columns || 1) < 2}>
              Column
            </button>
            <div className="ribbon-menu-section-label">Section breaks</div>
            <button type="button" className="ribbon-menu-item" onClick={() => editor.chain().focus().insertPageBreak("section").run()}>
              Next Page
            </button>
          </RibbonMenu>
          <RibbonMenu label="Line Numbers" icon={ListOrdered} big active={!!layout.lineNumbers}>
            <button type="button" className={`ribbon-menu-item${!layout.lineNumbers ? " active" : ""}`} onClick={() => set({ lineNumbers: false })}>
              None
            </button>
            <button type="button" className={`ribbon-menu-item${layout.lineNumbers ? " active" : ""}`} onClick={() => set({ lineNumbers: true })}>
              Continuous
            </button>
          </RibbonMenu>
          <RibbonMenu label="Hyphenation" icon={WrapText} big active={!!layout.hyphenation}>
            <button type="button" className={`ribbon-menu-item${!layout.hyphenation ? " active" : ""}`} onClick={() => set({ hyphenation: false })}>
              None
            </button>
            <button type="button" className={`ribbon-menu-item${layout.hyphenation ? " active" : ""}`} onClick={() => set({ hyphenation: true })}>
              Automatic
            </button>
          </RibbonMenu>
        </div>
        <div className="ribbon-group-label">Page Setup</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body ribbon-paragraph-fields">
          <div className="ribbon-field-col">
            <div className="ribbon-field-col-label">Indent</div>
            <NumberField label="Left" unit="cm" step={0.25} min={0} max={10} value={fmt.indentLeftCm} onCommit={(v) => setBlockAttrs(editor, { indent: +((v * PX_PER_CM) / 32).toFixed(3) })} />
            <NumberField label="Right" unit="cm" step={0.25} min={0} max={10} value={fmt.indentRightCm} onCommit={(v) => setBlockAttrs(editor, { indentRight: Math.round(v * PX_PER_CM) })} />
          </div>
          <div className="ribbon-field-col">
            <div className="ribbon-field-col-label">Spacing</div>
            <NumberField label="Before" unit="pt" step={6} min={0} max={96} value={fmt.before} onCommit={(v) => setBlockAttrs(editor, { spacingBefore: v || false })} />
            <NumberField label="After" unit="pt" step={6} min={0} max={96} value={fmt.after} onCommit={(v) => setBlockAttrs(editor, { spacingAfter: v || false })} />
          </div>
        </div>
        <div className="ribbon-group-label">Paragraph</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className={`ribbon-btn${layout.differentFirstPage ? " active" : ""}`} onClick={() => set({ differentFirstPage: !layout.differentFirstPage })} title="No header, footer or page number on page 1">
            Different First Page
          </button>
        </div>
        <div className="ribbon-group-label">Header &amp; Footer</div>
      </div>

      {customOpen && <CustomMarginsDialog layout={layout} onClose={() => setCustomOpen(false)} onSave={(px) => set({ margin: "custom", customMargins: px })} />}
    </div>
  );
}
