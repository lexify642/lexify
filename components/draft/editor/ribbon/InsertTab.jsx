"use client";

import { useState } from "react";
import { useEditorState } from "@tiptap/react";
import {
  BookOpen,
  File,
  FileX2,
  Table as TableIcon,
  Image as ImageIcon,
  Shapes,
  Smile,
  ChartColumn,
  Link2,
  Bookmark as BookmarkIcon,
  Crosshair,
  MessageSquarePlus,
  PanelTop,
  PanelBottom,
  Hash,
  TextCursorInput,
  Sigma,
  Omega,
  Scale,
  Minus,
} from "lucide-react";
import { useCases } from "@/components/cases/CasesContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { useDrafts } from "../../DraftsContext";
import { useDraftComments } from "../../DraftCommentsContext";
import RibbonMenu from "./RibbonMenu";
import InsertTableDialog from "../modals/InsertTableDialog";
import InsertHyperlinkDialog from "../modals/InsertHyperlinkDialog";
import InsertFootnoteDialog from "../modals/InsertFootnoteDialog";
import AddCommentDialog from "../modals/AddCommentDialog";
import HeaderFooterEditor from "../modals/HeaderFooterEditor";
import { InsertPictureDialog, InsertChartDialog, InsertEquationDialog, BookmarkDialog, CrossReferenceDialog } from "../modals/EditorDialogs";
import { SHAPES, ICONS, shapeImage, iconImage } from "../graphics";
import { PAGE_NUMBER_FORMATS } from "../pagination";
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

const SYMBOLS = ["§", "¶", "©", "®", "™", "†", "‡", "—", "–", "•", "½", "¼", "¾", "₹", "€", "£", "$", "°", "±", "×", "÷", "≠", "≤", "≥", "∞", "√", "…", "«", "»", "✓"];

const PAGE_NUMBER_POSITIONS = [
  { key: "header-right", label: "Top of page — right" },
  { key: "header-left", label: "Top of page — left" },
  { key: "footer-right", label: "Bottom of page — right" },
  { key: "footer-left", label: "Bottom of page — left" },
];

function Big({ icon: Icon, label, onClick, disabled, title, active }) {
  return (
    <button type="button" className={`ribbon-btn ribbon-btn-big${active ? " active" : ""}`} onClick={onClick} disabled={disabled} title={title || label}>
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function esc(text) {
  return String(text ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function todayLong() {
  return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// Cover pages: inserted at the very start of the document, followed by a
// page break so the existing content starts on page 2.
function coverPageHtml(kind, { draft, linkedCase, currentUser }) {
  const title = esc(draft.title || "Untitled");
  if (kind === "court") {
    return `
      <p style="text-align:center"><strong>IN THE ${esc((linkedCase?.court || "HIGH COURT").toUpperCase())}${linkedCase?.city ? ` AT ${esc(linkedCase.city.toUpperCase())}` : ""}</strong></p>
      <p style="text-align:center">${esc(linkedCase?.filing || "")} ${esc(linkedCase?.number || "No. ____ of ____")}</p>
      <p></p><p></p>
      <p style="text-align:center"><strong>${esc(linkedCase?.parties || "Petitioner vs. Respondent")}</strong></p>
      <p></p><p></p>
      <h1 style="text-align:center">${title}</h1>
      <p></p><p></p><p></p>
      <p style="text-align:right">Filed by: ${esc(currentUser?.name || "Advocate")}</p>
      <p style="text-align:right">Date: ${todayLong()}</p>`;
  }
  if (kind === "agreement") {
    return `
      <p></p><p></p><p></p>
      <h1 style="text-align:center">${title}</h1>
      <p style="text-align:center">between</p>
      <p style="text-align:center"><strong>${esc(linkedCase?.parties?.split(/\s+vs?\.?\s+/i)[0] || "First Party")}</strong></p>
      <p style="text-align:center">and</p>
      <p style="text-align:center"><strong>${esc(linkedCase?.parties?.split(/\s+vs?\.?\s+/i)[1] || "Second Party")}</strong></p>
      <p></p><p></p>
      <p style="text-align:center">Dated ${todayLong()}</p>`;
  }
  return `
    <p></p><p></p><p></p><p></p>
    <h1 style="text-align:center">${title}</h1>
    <p style="text-align:center">${esc(draft.description || "")}</p>
    <p></p><p></p><p></p>
    <p style="text-align:center">Prepared by ${esc(currentUser?.name || "")}</p>
    <p style="text-align:center">${todayLong()}</p>`;
}

function bookmarkNames(editor) {
  const names = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === "bookmark" && node.attrs.name) names.push(node.attrs.name);
  });
  return names;
}

export default function InsertTab({ editor, draft, activePanel, onTogglePanel }) {
  const { cases } = useCases();
  const currentUser = useCurrentUser();
  const { updateDraftLayout } = useDrafts();
  const { addComment } = useDraftComments();
  const [openDialog, setOpenDialog] = useState(null);
  const [pendingComment, setPendingComment] = useState(null);
  const [footnoteKind, setFootnoteKind] = useState("footnote");

  const linkedCase = cases.find((c) => c.no === draft.linkedCaseNo) || null;
  const { inTable, hasSelection, linkActive } = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({ inTable: ed.isActive("table"), hasSelection: !ed.state.selection.empty, linkActive: ed.isActive("link") }),
  });

  function insertHtml(html) {
    editor.chain().focus().insertContent(html).run();
  }

  function insertImage(attrs) {
    editor.chain().focus().setImage(attrs).run();
  }

  function insertCoverPage(kind) {
    const html = coverPageHtml(kind, { draft, linkedCase, currentUser });
    editor
      .chain()
      .focus()
      .insertContentAt(0, `${html}<div data-break-type="page"></div>`)
      .setTextSelection(1)
      .scrollIntoView()
      .run();
  }

  function insertBlankPage() {
    editor
      .chain()
      .focus()
      .insertContent([{ type: "pageBreak", attrs: { breakType: "page" } }, { type: "paragraph" }, { type: "pageBreak", attrs: { breakType: "page" } }, { type: "paragraph" }])
      .run();
  }

  function handleAddCommentClick() {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    setPendingComment({ from, to, quotedText: editor.state.doc.textBetween(from, to, " ") });
  }

  function submitComment(body) {
    if (!pendingComment) return;
    const commentId = addComment(draft.id, pendingComment.quotedText, body);
    editor.chain().focus().setTextSelection({ from: pendingComment.from, to: pendingComment.to }).setComment(commentId).run();
    setPendingComment(null);
    if (activePanel !== "comments") onTogglePanel("comments");
  }

  function goToBookmark(name) {
    let pos = null;
    editor.state.doc.descendants((node, p) => {
      if (pos === null && node.type.name === "bookmark" && node.attrs.name === name) pos = p;
    });
    if (pos !== null) editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  }

  function deleteBookmark(name) {
    let range = null;
    editor.state.doc.descendants((node, p) => {
      if (!range && node.type.name === "bookmark" && node.attrs.name === name) range = { from: p, to: p + node.nodeSize };
    });
    if (range) editor.chain().focus().deleteRange(range).run();
  }

  const pn = draft.layout.pageNumbers;

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <RibbonMenu label="Cover Page" icon={BookOpen} big>
            <button type="button" className="ribbon-menu-item" onClick={() => insertCoverPage("court")}>
              <Scale size={14} aria-hidden="true" /> Court filing
            </button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertCoverPage("agreement")}>
              <BookOpen size={14} aria-hidden="true" /> Agreement
            </button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertCoverPage("simple")}>
              <File size={14} aria-hidden="true" /> Simple title page
            </button>
          </RibbonMenu>
          <Big icon={File} label="Blank Page" onClick={insertBlankPage} />
          <Big icon={FileX2} label="Page Break" title="Page Break (Ctrl+Enter)" onClick={() => editor.chain().focus().insertPageBreak("page").run()} />
        </div>
        <div className="ribbon-group-label">Pages</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={TableIcon} label="Table" onClick={() => setOpenDialog("table")} />
          <div className="ribbon-stack">
            <div className="ribbon-row">
              <button type="button" className="ribbon-btn" disabled={!inTable} onClick={() => editor.chain().focus().addRowAfter().run()} title="Insert row below">
                +Row
              </button>
              <button type="button" className="ribbon-btn" disabled={!inTable} onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
                −Row
              </button>
              <button type="button" className="ribbon-btn" disabled={!inTable} onClick={() => editor.chain().focus().mergeCells().run()}>
                Merge
              </button>
            </div>
            <div className="ribbon-row">
              <button type="button" className="ribbon-btn" disabled={!inTable} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Insert column right">
                +Col
              </button>
              <button type="button" className="ribbon-btn" disabled={!inTable} onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">
                −Col
              </button>
              <button type="button" className="ribbon-btn" disabled={!inTable} onClick={() => editor.chain().focus().splitCell().run()}>
                Split
              </button>
            </div>
            <button type="button" className="ribbon-btn" disabled={!inTable} onClick={() => editor.chain().focus().deleteTable().run()}>
              Delete Table
            </button>
          </div>
        </div>
        <div className="ribbon-group-label">Tables</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={ImageIcon} label="Pictures" onClick={() => setOpenDialog("picture")} />
          <RibbonMenu label="Shapes" icon={Shapes} big panelClassName="ribbon-grid-panel">
            <div className="ribbon-menu-section-label">Shapes</div>
            <div className="ribbon-icon-grid">
              {SHAPES.map((s) => {
                const img = shapeImage(s.key);
                return (
                  <button key={s.key} type="button" className="ribbon-icon-cell" title={s.label} onClick={() => insertImage(img)}>
                    <img src={img.src} alt="" />
                  </button>
                );
              })}
            </div>
          </RibbonMenu>
          <RibbonMenu label="Icons" icon={Smile} big panelClassName="ribbon-grid-panel">
            <div className="ribbon-menu-section-label">Icons</div>
            <div className="ribbon-icon-grid">
              {ICONS.map(({ key, label, Icon }) => (
                <button key={key} type="button" className="ribbon-icon-cell" title={label} onClick={() => insertImage(iconImage(key))}>
                  <Icon size={20} aria-hidden="true" />
                </button>
              ))}
            </div>
          </RibbonMenu>
          <Big icon={ChartColumn} label="Chart" onClick={() => setOpenDialog("chart")} />
        </div>
        <div className="ribbon-group-label">Illustrations</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={Link2} label={linkActive ? "Edit Link" : "Link"} active={linkActive} onClick={() => setOpenDialog("link")} />
          <Big icon={BookmarkIcon} label="Bookmark" onClick={() => setOpenDialog("bookmark")} />
          <Big icon={Crosshair} label="Cross-reference" onClick={() => setOpenDialog("crossref")} />
        </div>
        <div className="ribbon-group-label">Links</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={MessageSquarePlus} label="Comment" title={hasSelection ? "New comment on the selection" : "Select text first"} disabled={!hasSelection} onClick={handleAddCommentClick} />
        </div>
        <div className="ribbon-group-label">Comments</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={PanelTop} label="Header" onClick={() => setOpenDialog("headerFooter")} />
          <Big icon={PanelBottom} label="Footer" onClick={() => setOpenDialog("headerFooter")} />
          <RibbonMenu label="Page Number" icon={Hash} big panelClassName="ribbon-page-number-panel">
            {PAGE_NUMBER_POSITIONS.map((pos) => (
              <div key={pos.key} className="ribbon-menu-section">
                <div className="ribbon-menu-section-label">{pos.label}</div>
                {Object.entries(PAGE_NUMBER_FORMATS).map(([format, pattern]) => (
                  <button
                    key={format}
                    type="button"
                    className={`ribbon-menu-item${pn?.position === pos.key && pn?.format === format ? " active" : ""}`}
                    onClick={() => updateDraftLayout(draft.id, { pageNumbers: { position: pos.key, format } })}
                  >
                    {pattern.replace("{page}", "1").replace("{total}", "3")}
                  </button>
                ))}
              </div>
            ))}
            <hr className="ribbon-menu-divider" />
            <button type="button" className="ribbon-menu-item" disabled={!pn} onClick={() => updateDraftLayout(draft.id, { pageNumbers: null })}>
              Remove page numbers
            </button>
          </RibbonMenu>
        </div>
        <div className="ribbon-group-label">Header &amp; Footer</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={TextCursorInput} label="Text Box" onClick={() => editor.chain().focus().insertTextBox().run()} />
          <RibbonMenu label="Legal elements" text="Legal Elements" icon={Scale} big>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(courtHeadingSnippet(linkedCase))}>Court Heading</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(partyDetailsSnippet(linkedCase))}>Party Details</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(caseNumberSnippet(linkedCase))}>Case Number</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(filingDetailsSnippet(linkedCase))}>Filing Details</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(dateSnippet())}>Date</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(placeSnippet(linkedCase))}>Place</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(verificationBlockSnippet())}>Verification</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(signatureLineSnippet())}>Signature Line</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(advocateSignatureSnippet(currentUser))}>Advocate Signature</button>
            <button type="button" className="ribbon-menu-item" onClick={() => insertHtml(clientSignatureSnippet(linkedCase))}>Client Signature</button>
          </RibbonMenu>
          <div className="ribbon-stack">
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
        </div>
        <div className="ribbon-group-label">Text</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={Sigma} label="Equation" onClick={() => setOpenDialog("equation")} />
          <RibbonMenu label="Symbol" icon={Omega} big panelClassName="ribbon-grid-panel">
            <div className="ribbon-menu-section-label">Symbols</div>
            <div className="ribbon-icon-grid ribbon-symbol-grid">
              {SYMBOLS.map((sym) => (
                <button key={sym} type="button" className="ribbon-icon-cell" onClick={() => insertHtml(sym)} title={sym}>
                  {sym}
                </button>
              ))}
            </div>
          </RibbonMenu>
          <Big icon={Minus} label="Line" title="Horizontal line" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        </div>
        <div className="ribbon-group-label">Symbols</div>
      </div>

      {openDialog === "table" && (
        <InsertTableDialog onClose={() => setOpenDialog(null)} onInsert={({ rows, cols, withHeaderRow }) => editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run()} />
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
            editor.chain().focus().insertContent({ type: "footnoteRef", attrs: { noteId, text, kind: footnoteKind } }).run();
          }}
        />
      )}
      {openDialog === "picture" && <InsertPictureDialog onClose={() => setOpenDialog(null)} onInsert={insertImage} />}
      {openDialog === "chart" && <InsertChartDialog onClose={() => setOpenDialog(null)} onInsert={insertImage} />}
      {openDialog === "equation" && (
        <InsertEquationDialog
          onClose={() => setOpenDialog(null)}
          onInsert={({ latex, display }) => {
            if (display) editor.chain().focus().insertBlockMath({ latex }).run();
            else editor.chain().focus().insertInlineMath({ latex }).run();
          }}
        />
      )}
      {openDialog === "bookmark" && (
        <BookmarkDialog
          existing={bookmarkNames(editor)}
          onClose={() => setOpenDialog(null)}
          onAdd={(name) => editor.chain().focus().insertBookmark(name).run()}
          onGoTo={(name) => {
            goToBookmark(name);
            setOpenDialog(null);
          }}
          onDelete={deleteBookmark}
        />
      )}
      {openDialog === "crossref" && (
        <CrossReferenceDialog editor={editor} bookmarks={bookmarkNames(editor)} onClose={() => setOpenDialog(null)} onInsert={(attrs) => editor.chain().focus().insertReferenceField(attrs).run()} />
      )}
      {pendingComment && <AddCommentDialog quotedText={pendingComment.quotedText} onClose={() => setPendingComment(null)} onSubmit={submitComment} />}
    </div>
  );
}
