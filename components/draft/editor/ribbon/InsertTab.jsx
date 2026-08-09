"use client";

import { useState } from "react";
import { useCases } from "@/components/cases/CasesContext";
import { useDraftComments } from "../../DraftCommentsContext";
import InsertTableDialog from "../modals/InsertTableDialog";
import InsertHyperlinkDialog from "../modals/InsertHyperlinkDialog";
import InsertFootnoteDialog from "../modals/InsertFootnoteDialog";
import AddCommentDialog from "../modals/AddCommentDialog";
import HeaderFooterEditor from "../modals/HeaderFooterEditor";
import {
  courtHeadingSnippet,
  partyDetailsSnippet,
  caseNumberSnippet,
  filingDetailsSnippet,
  dateSnippet,
  placeSnippet,
  verificationBlockSnippet,
  signatureLineSnippet,
  advocateSignatureSnippet,
  clientSignatureSnippet,
} from "../legalSnippets";

const SYMBOLS = ["§", "¶", "©", "®", "™", "†", "‡", "—", "•", "½"];

export default function InsertTab({ editor, draft, activePanel, onTogglePanel }) {
  const { cases } = useCases();
  const { addComment } = useDraftComments();
  const [openDialog, setOpenDialog] = useState(null);
  const [pendingComment, setPendingComment] = useState(null);
  const [footnoteKind, setFootnoteKind] = useState("footnote");

  const linkedCase = cases.find((c) => c.no === draft.linkedCaseNo) || null;

  function insertHtml(html) {
    editor.chain().focus().insertContent(html).run();
  }

  function handleAddCommentClick() {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const quotedText = editor.state.doc.textBetween(from, to, " ");
    setPendingComment({ from, to, quotedText });
  }

  function submitComment(body) {
    if (!pendingComment) return;
    const commentId = addComment(draft.id, pendingComment.quotedText, body);
    editor.chain().focus().setTextSelection({ from: pendingComment.from, to: pendingComment.to }).setComment(commentId).run();
    setPendingComment(null);
  }

  const linkActive = editor.isActive("link");

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={() => editor.chain().focus().insertPageBreak("page").run()}>
            Page Break
          </button>
          <button type="button" className="ribbon-btn" onClick={() => editor.chain().focus().insertPageBreak("section").run()}>
            Section Break
          </button>
        </div>
        <div className="ribbon-group-label">Pages</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={() => setOpenDialog("table")}>
            Insert Table
          </button>
          <button
            type="button"
            className="ribbon-btn"
            disabled={!editor.isActive("table")}
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            +Row
          </button>
          <button type="button" className="ribbon-btn" disabled={!editor.isActive("table")} onClick={() => editor.chain().focus().deleteRow().run()}>
            −Row
          </button>
          <button
            type="button"
            className="ribbon-btn"
            disabled={!editor.isActive("table")}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            +Col
          </button>
          <button
            type="button"
            className="ribbon-btn"
            disabled={!editor.isActive("table")}
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            −Col
          </button>
          <button type="button" className="ribbon-btn" disabled={!editor.isActive("table")} onClick={() => editor.chain().focus().mergeCells().run()}>
            Merge
          </button>
          <button type="button" className="ribbon-btn" disabled={!editor.isActive("table")} onClick={() => editor.chain().focus().splitCell().run()}>
            Split
          </button>
          <button type="button" className="ribbon-btn" disabled={!editor.isActive("table")} onClick={() => editor.chain().focus().deleteTable().run()}>
            Delete Table
          </button>
        </div>
        <div className="ribbon-group-label">Table</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={() => setOpenDialog("headerFooter")}>
            Header &amp; Footer
          </button>
        </div>
        <div className="ribbon-group-label">Header / Footer</div>
      </div>

      <div className="ribbon-group ribbon-group-grow">
        <div className="ribbon-group-body ribbon-group-body-wrap">
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(courtHeadingSnippet(linkedCase))}>
            Court Heading
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(partyDetailsSnippet(linkedCase))}>
            Party Details
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(caseNumberSnippet(linkedCase))}>
            Case Number
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(filingDetailsSnippet(linkedCase))}>
            Filing Details
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(dateSnippet())}>
            Date
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(placeSnippet(linkedCase))}>
            Place
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(verificationBlockSnippet())}>
            Verification
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(signatureLineSnippet())}>
            Signature Line
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(advocateSignatureSnippet())}>
            Advocate Signature
          </button>
          <button type="button" className="ribbon-btn" onClick={() => insertHtml(clientSignatureSnippet(linkedCase))}>
            Client Signature
          </button>
        </div>
        <div className="ribbon-group-label">Legal Document Elements</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className={`ribbon-btn${activePanel === "comments" ? " active" : ""}`} onClick={() => onTogglePanel("comments")}>
            Comments Panel
          </button>
          <button type="button" className="ribbon-btn" onClick={handleAddCommentClick} title="Select text first">
            Add Comment
          </button>
        </div>
        <div className="ribbon-group-label">Comments</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className={`ribbon-btn${linkActive ? " active" : ""}`} onClick={() => setOpenDialog("link")}>
            {linkActive ? "Edit Link" : "Insert Link"}
          </button>
        </div>
        <div className="ribbon-group-label">Links</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body ribbon-group-body-wrap">
          {SYMBOLS.map((sym) => (
            <button key={sym} type="button" className="ribbon-btn ribbon-btn-icon" onClick={() => insertHtml(sym)}>
              {sym}
            </button>
          ))}
          <button type="button" className="ribbon-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            Line
          </button>
          <button
            type="button"
            className="ribbon-btn"
            onClick={() => {
              setFootnoteKind("footnote");
              setOpenDialog("footnote");
            }}
          >
            Footnote
          </button>
          <button
            type="button"
            className="ribbon-btn"
            onClick={() => {
              setFootnoteKind("endnote");
              setOpenDialog("footnote");
            }}
          >
            Endnote
          </button>
        </div>
        <div className="ribbon-group-label">Special Elements</div>
      </div>

      {openDialog === "table" && (
        <InsertTableDialog
          onClose={() => setOpenDialog(null)}
          onInsert={({ rows, cols, withHeaderRow }) => editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run()}
        />
      )}
      {openDialog === "headerFooter" && <HeaderFooterEditor draft={draft} onClose={() => setOpenDialog(null)} />}
      {openDialog === "link" && (
        <InsertHyperlinkDialog
          initialUrl={editor.getAttributes("link").href || ""}
          onClose={() => setOpenDialog(null)}
          onInsert={(url) => editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()}
          onRemove={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
        />
      )}
      {openDialog === "footnote" && (
        <InsertFootnoteDialog
          kind={footnoteKind}
          onClose={() => setOpenDialog(null)}
          onInsert={(text) => {
            const noteId = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            editor
              .chain()
              .focus()
              .insertContent({ type: "footnoteRef", attrs: { noteId, text, kind: footnoteKind } })
              .run();
          }}
        />
      )}
      {pendingComment && (
        <AddCommentDialog quotedText={pendingComment.quotedText} onClose={() => setPendingComment(null)} onSubmit={submitComment} />
      )}
    </div>
  );
}
