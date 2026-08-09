"use client";

import { useState } from "react";
import { useEditorState } from "@tiptap/react";
import { collectHeadings, collectIndexEntries } from "../extensions";
import InsertFootnoteDialog from "../modals/InsertFootnoteDialog";
import TextFieldDialog from "../modals/TextFieldDialog";

function escapeHtml(text) {
  return (text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tocHtml(headings) {
  if (!headings.length) return "<p><i>No headings in document yet.</i></p>";
  const items = headings.map((h) => `<li style="margin-left:${(h.level - 1) * 16}px">${escapeHtml(h.text)}</li>`).join("");
  return `<p><b>TABLE OF CONTENTS</b></p><ul>${items}</ul>`;
}

function indexHtml(entries) {
  if (!entries.length) return "<p><i>No index entries marked yet.</i></p>";
  const items = entries.map((e) => `<li>${escapeHtml(e.term)} — ${e.count} occurrence${e.count === 1 ? "" : "s"}</li>`).join("");
  return `<p><b>INDEX</b></p><ul>${items}</ul>`;
}

const CITATION_TYPES = [
  { key: "legal", label: "Legal Citation", eyebrow: "REFERENCES", placeholder: "e.g. AIR 1973 SC 1461" },
  { key: "case", label: "Case Citation", eyebrow: "REFERENCES", placeholder: "e.g. Kesavananda Bharati v. State of Kerala" },
  { key: "statute", label: "Statute Citation", eyebrow: "REFERENCES", placeholder: "e.g. The Companies Act, 2013" },
  { key: "section", label: "Section Reference", eyebrow: "REFERENCES", placeholder: "e.g. Section 141, Companies Act 2013" },
];

export default function ReferencesTab({ editor, activePanel, onTogglePanel }) {
  const [footnoteKind, setFootnoteKind] = useState("footnote");
  const [openDialog, setOpenDialog] = useState(null);
  const [selectedHeading, setSelectedHeading] = useState("");

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const json = ed.getJSON();
      return { headings: collectHeadings(json), indexEntries: collectIndexEntries(json) };
    },
  });

  const activeCitation = CITATION_TYPES.find((c) => c.key === openDialog);
  const hasSelection = editor.state.selection.from !== editor.state.selection.to;

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={() => editor.chain().focus().insertContent(tocHtml(state.headings)).run()}>
            Insert TOC
          </button>
          <button type="button" className={`ribbon-btn${activePanel === "references" ? " active" : ""}`} onClick={() => onTogglePanel("references")}>
            Navigation Panel
          </button>
        </div>
        <div className="ribbon-group-label">Table of Contents</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button
            type="button"
            className="ribbon-btn"
            onClick={() => {
              setFootnoteKind("footnote");
              setOpenDialog("footnote");
            }}
          >
            Insert Footnote
          </button>
          <button
            type="button"
            className="ribbon-btn"
            onClick={() => {
              setFootnoteKind("endnote");
              setOpenDialog("footnote");
            }}
          >
            Insert Endnote
          </button>
        </div>
        <div className="ribbon-group-label">Footnotes</div>
      </div>

      <div className="ribbon-group ribbon-group-grow">
        <div className="ribbon-group-body ribbon-group-body-wrap">
          {CITATION_TYPES.map((c) => (
            <button key={c.key} type="button" className="ribbon-btn" onClick={() => setOpenDialog(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="ribbon-group-label">Citations</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <select className="ribbon-select" value={selectedHeading} onChange={(e) => setSelectedHeading(e.target.value)}>
            <option value="">Choose heading…</option>
            {state.headings.map((h, idx) => (
              <option key={idx} value={h.text}>
                {h.text}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ribbon-btn"
            disabled={!selectedHeading}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertReferenceField({ refType: "heading", target: selectedHeading, label: selectedHeading })
                .run()
            }
          >
            Insert Cross-Reference
          </button>
          <button type="button" className="ribbon-btn" onClick={() => setOpenDialog("custom-ref")}>
            Custom Reference
          </button>
        </div>
        <div className="ribbon-group-label">Cross References</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" disabled={!hasSelection} onClick={() => editor.chain().focus().toggleIndexEntry().run()}>
            Mark Entry
          </button>
          <button type="button" className="ribbon-btn" onClick={() => editor.chain().focus().insertContent(indexHtml(state.indexEntries)).run()}>
            Insert Index
          </button>
        </div>
        <div className="ribbon-group-label">Index</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={() => setOpenDialog("caption")}>
            Insert Caption
          </button>
        </div>
        <div className="ribbon-group-label">Table/Figure</div>
      </div>

      {openDialog === "footnote" && (
        <InsertFootnoteDialog
          kind={footnoteKind}
          onClose={() => setOpenDialog(null)}
          onInsert={(text) => {
            const noteId = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            editor.chain().focus().insertContent({ type: "footnoteRef", attrs: { noteId, text, kind: footnoteKind } }).run();
          }}
        />
      )}

      {activeCitation && (
        <TextFieldDialog
          eyebrow={activeCitation.eyebrow}
          title={`Insert ${activeCitation.label}`}
          label={activeCitation.label}
          placeholder={activeCitation.placeholder}
          onClose={() => setOpenDialog(null)}
          onSubmit={(text) => editor.chain().focus().insertReferenceField({ refType: "citation", target: null, label: text }).run()}
        />
      )}

      {openDialog === "custom-ref" && (
        <TextFieldDialog
          eyebrow="REFERENCES"
          title="Insert Custom Reference"
          label="Reference label"
          placeholder="e.g. Annexure A"
          onClose={() => setOpenDialog(null)}
          onSubmit={(text) => editor.chain().focus().insertReferenceField({ refType: "custom", target: null, label: text }).run()}
        />
      )}

      {openDialog === "caption" && (
        <TextFieldDialog
          eyebrow="REFERENCES"
          title="Insert Table/Figure Caption"
          label="Caption text"
          placeholder="e.g. Table 1: Summary of Claims"
          onClose={() => setOpenDialog(null)}
          onSubmit={(text) => editor.chain().focus().insertContent(`<p data-legal-style="caption">${escapeHtml(text)}</p>`).run()}
        />
      )}
    </div>
  );
}
