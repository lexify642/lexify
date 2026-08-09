"use client";

import { useEditorState } from "@tiptap/react";
import { collectHeadings, collectFootnotes, collectIndexEntries } from "../extensions";

function scrollToMatchingText(editor, text) {
  if (!editor) return;
  const headings = editor.view.dom.querySelectorAll("h1, h2, h3");
  const match = Array.from(headings).find((el) => el.textContent.trim() === text.trim());
  if (match) {
    match.scrollIntoView({ behavior: "smooth", block: "center" });
    match.classList.add("doc-comment-focused");
    setTimeout(() => match.classList.remove("doc-comment-focused"), 1200);
  }
}

function scrollToNote(editor, noteId) {
  const el = editor?.view?.dom?.querySelector(`[data-note-id="${noteId}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Real, live navigation over the document's own headings/footnotes/index
// marks — this is the "TableOfContentsPanel"/footnote list from the plan;
// it always reflects current content since it's computed from
// editor.getJSON() on every transaction rather than a static snapshot.
export default function ReferencesPanel({ editor, onClose }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const json = ed.getJSON();
      return {
        headings: collectHeadings(json),
        footnotes: collectFootnotes(json),
        indexEntries: collectIndexEntries(json),
      };
    },
  });

  function updateNoteText(noteId, text) {
    editor
      .chain()
      .command(({ tr }) => {
        tr.doc.descendants((node, pos) => {
          if (node.type.name === "footnoteRef" && node.attrs.noteId === noteId) {
            tr.setNodeAttribute(pos, "text", text);
          }
        });
        return true;
      })
      .run();
  }

  return (
    <aside className="card comments-panel">
      <div className="comments-panel-head">
        <h3>References</h3>
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div>
        <h4 className="references-panel-heading">Table of Contents ({state.headings.length})</h4>
        {state.headings.length === 0 && <div className="empty-inline">No headings yet.</div>}
        {state.headings.map((h, idx) => (
          <button
            key={idx}
            type="button"
            className="comment-quote"
            style={{ paddingLeft: 8 + (h.level - 1) * 12 }}
            onClick={() => scrollToMatchingText(editor, h.text)}
          >
            {h.text}
          </button>
        ))}
      </div>

      <div>
        <h4 className="references-panel-heading">Footnotes &amp; Endnotes ({state.footnotes.length})</h4>
        {state.footnotes.length === 0 && <div className="empty-inline">None inserted yet.</div>}
        {state.footnotes.map((note) => (
          <div key={note.noteId} className="comment-thread">
            <button type="button" className="comment-quote" onClick={() => scrollToNote(editor, note.noteId)}>
              {note.kind === "endnote" ? "Endnote" : "Footnote"}
            </button>
            <input
              className="comment-reply-input"
              defaultValue={note.text}
              onBlur={(e) => updateNoteText(note.noteId, e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        ))}
      </div>

      <div>
        <h4 className="references-panel-heading">Index ({state.indexEntries.length})</h4>
        {state.indexEntries.length === 0 && <div className="empty-inline">Select text and use References → Mark Entry.</div>}
        {state.indexEntries.map((entry) => (
          <div key={entry.term} className="index-entry-row">
            <span>{entry.term}</span>
            <span className="index-entry-count">{entry.count}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
