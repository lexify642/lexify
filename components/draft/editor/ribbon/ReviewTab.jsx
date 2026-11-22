"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorState } from "@tiptap/react";
import {
  SpellCheck,
  Hash,
  Volume2,
  Square,
  MessageSquarePlus,
  MessageSquareX,
  ChevronLeft,
  ChevronRight,
  MessagesSquare,
  FilePenLine,
  Eye,
  PanelRight,
  Check,
  X,
  GitCompare,
  Lock,
  LockOpen,
  Send,
  FileInput,
  History,
  LayoutDashboard,
} from "lucide-react";
import { useDrafts } from "../../DraftsContext";
import { useDraftComments } from "../../DraftCommentsContext";
import { useDraftReview } from "../../DraftReviewContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import RibbonMenu from "./RibbonMenu";
import SendForReviewModal from "../modals/SendForReviewModal";
import ImportUpdatedDraftModal from "../modals/ImportUpdatedDraftModal";
import VersionHistoryPanel from "../modals/VersionHistoryPanel";
import CompareVersionsModal from "../modals/CompareVersionsModal";
import AddCommentDialog from "../modals/AddCommentDialog";
import { WordCountDialog } from "../modals/EditorDialogs";
import { canSendForReview, canEditDraft, canAcceptRejectChanges, canDeleteComment } from "../../permissions";
import { collectChanges } from "../trackChanges";

const MARKUP_OPTIONS = [
  { key: "all", label: "All Markup", hint: "Show every insertion and deletion" },
  { key: "simple", label: "Simple Markup", hint: "Show the result, with a bar beside changed lines" },
  { key: "none", label: "No Markup", hint: "Show the result as if all changes were accepted" },
  { key: "original", label: "Original", hint: "Show the text before the changes" },
];

function Big({ icon: Icon, label, onClick, disabled, title, active }) {
  return (
    <button type="button" className={`ribbon-btn ribbon-btn-big${active ? " active" : ""}`} onClick={onClick} disabled={disabled} title={title || label} aria-pressed={active === undefined ? undefined : !!active}>
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function Small({ icon: Icon, label, onClick, disabled, title }) {
  return (
    <button type="button" className="ribbon-btn ribbon-btn-row-icon" onClick={onClick} disabled={disabled} title={title || label}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

// Comment anchors in document order: [{ id, from, to }].
function commentRanges(doc) {
  const ranges = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const mark = node.marks.find((m) => m.type.name === "comment");
    if (!mark) return;
    const last = ranges[ranges.length - 1];
    if (last && last.id === mark.attrs.commentId && last.to === pos) last.to = pos + node.nodeSize;
    else ranges.push({ id: mark.attrs.commentId, from: pos, to: pos + node.nodeSize });
  });
  return ranges;
}

export default function ReviewTab({ editor, draft, activePanel, onTogglePanel, ui }) {
  const router = useRouter();
  const { updateDraftLayout } = useDrafts();
  const { commentsForDraft, addComment, deleteComment, threads } = useDraftComments();
  const { reviewRequests } = useDraftReview();
  const currentUser = useCurrentUser();
  const [openModal, setOpenModal] = useState(null);
  const [pendingComment, setPendingComment] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [wordStats, setWordStats] = useState(null);

  const sel = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      empty: ed.state.selection.empty,
      head: ed.state.selection.head,
      commentId: ed.getAttributes("comment").commentId || null,
      changeCount: collectChanges(ed.state.doc).length,
    }),
  });

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const openComments = commentsForDraft(draft.id).filter((t) => t.status === "Open").length;
  const pendingReviews = reviewRequests.filter((r) => r.draftId === draft.id && !["Approved", "Rejected"].includes(r.status)).length;
  const canEdit = canEditDraft(currentUser);
  const canDecide = canAcceptRejectChanges(currentUser);

  function newComment() {
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

  function deleteCurrentComment() {
    const id = sel.commentId;
    if (!id) return;
    const thread = threads?.[id];
    if (thread && !canDeleteComment(thread, currentUser)) return;
    const { tr } = editor.state;
    commentRanges(editor.state.doc)
      .filter((r) => r.id === id)
      .forEach((r) => tr.removeMark(r.from, r.to, editor.schema.marks.comment));
    editor.view.dispatch(tr);
    deleteComment(id);
  }

  function jumpComment(direction) {
    const ranges = commentRanges(editor.state.doc);
    if (!ranges.length) return;
    const head = editor.state.selection.from;
    const target = direction > 0 ? ranges.find((r) => r.from > head) || ranges[0] : [...ranges].reverse().find((r) => r.from < head) || ranges[ranges.length - 1];
    editor.chain().focus().setTextSelection({ from: target.from, to: target.to }).scrollIntoView().run();
  }

  function jumpChange(direction) {
    const changes = collectChanges(editor.state.doc);
    if (!changes.length) return;
    const head = editor.state.selection.from;
    const target = direction > 0 ? changes.find((c) => c.from > head) || changes[0] : [...changes].reverse().find((c) => c.from < head) || changes[changes.length - 1];
    editor.chain().focus().setTextSelection({ from: target.from, to: target.to }).scrollIntoView().run();
  }

  // The change under the cursor (or the selection), else nothing.
  function currentChangeRange() {
    const { from, to } = editor.state.selection;
    if (from !== to) return { from, to };
    const hit = collectChanges(editor.state.doc).find((c) => from >= c.from && from <= c.to);
    return hit ? { from: hit.from, to: hit.to } : null;
  }

  function readAloud() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const { from, to, empty } = editor.state.selection;
    const text = empty ? editor.state.doc.textBetween(from, editor.state.doc.content.size, "\n") : editor.state.doc.textBetween(from, to, "\n");
    if (!text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setSpeaking(true);
  }

  const versions = draft.versions;
  const activeIndex = Math.max(0, versions.findIndex((v) => v.id === draft.activeVersionId));
  const activeVersionForCompare = versions[activeIndex] || versions[versions.length - 1];
  const previousVersion = activeIndex > 0 ? versions[activeIndex - 1] : versions.find((v) => v.id !== activeVersionForCompare?.id);
  const canCompare = versions.length >= 2 && !!previousVersion;

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big
            icon={SpellCheck}
            label="Spelling & Grammar"
            active={ui.spellcheck}
            title={ui.spellcheck ? "Spelling check is on — misspellings are underlined; right-click a word for suggestions" : "Turn on spelling check"}
            onClick={() => ui.setSpellcheck(!ui.spellcheck)}
          />
          <Big icon={Hash} label="Word Count" onClick={() => setWordStats(ui.wordStats())} />
        </div>
        <div className="ribbon-group-label">Proofing</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={speaking ? Square : Volume2} label={speaking ? "Stop" : "Read Aloud"} active={speaking} onClick={readAloud} title="Reads the selection, or from the cursor to the end" />
        </div>
        <div className="ribbon-group-label">Speech</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={MessageSquarePlus} label="New Comment" disabled={sel.empty} title={sel.empty ? "Select text first" : "Comment on the selection"} onClick={newComment} />
          <div className="ribbon-stack">
            <Small icon={MessageSquareX} label="Delete" disabled={!sel.commentId} title="Delete the comment at the cursor" onClick={deleteCurrentComment} />
            <Small icon={ChevronLeft} label="Previous" onClick={() => jumpComment(-1)} />
            <Small icon={ChevronRight} label="Next" onClick={() => jumpComment(1)} />
          </div>
          <Big icon={MessagesSquare} label={`Show Comments${openComments ? ` (${openComments})` : ""}`} active={activePanel === "comments"} onClick={() => onTogglePanel("comments")} />
        </div>
        <div className="ribbon-group-label">Comments</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={FilePenLine} label="Track Changes" active={ui.trackChanges} disabled={!canEdit} onClick={() => ui.setTrackChanges(!ui.trackChanges)} />
          <div className="ribbon-stack">
            <RibbonMenu label="Markup to show" text={MARKUP_OPTIONS.find((m) => m.key === ui.markup)?.label} icon={Eye}>
              {MARKUP_OPTIONS.map((m) => (
                <button key={m.key} type="button" className={`ribbon-menu-item ribbon-menu-item-2line${ui.markup === m.key ? " active" : ""}`} onClick={() => ui.setMarkup(m.key)}>
                  <b>{m.label}</b>
                  <small>{m.hint}</small>
                </button>
              ))}
            </RibbonMenu>
            <Small icon={PanelRight} label="Reviewing Pane" onClick={() => onTogglePanel("reviewing")} />
          </div>
        </div>
        <div className="ribbon-group-label">Tracking</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <RibbonMenu label="Accept" icon={Check} big disabled={!canDecide || !sel.changeCount}>
            <button type="button" className="ribbon-menu-item" onClick={() => { const r = currentChangeRange(); if (r) editor.chain().focus().acceptChanges(r).run(); }}>
              Accept this change
            </button>
            <button type="button" className="ribbon-menu-item" onClick={() => { const r = currentChangeRange(); if (r) editor.chain().focus().acceptChanges(r).run(); jumpChange(1); }}>
              Accept and move to next
            </button>
            <button type="button" className="ribbon-menu-item" onClick={() => editor.chain().focus().acceptChanges().run()}>
              Accept all changes
            </button>
          </RibbonMenu>
          <RibbonMenu label="Reject" icon={X} big disabled={!canDecide || !sel.changeCount}>
            <button type="button" className="ribbon-menu-item" onClick={() => { const r = currentChangeRange(); if (r) editor.chain().focus().rejectChanges(r).run(); }}>
              Reject this change
            </button>
            <button type="button" className="ribbon-menu-item" onClick={() => { const r = currentChangeRange(); if (r) editor.chain().focus().rejectChanges(r).run(); jumpChange(1); }}>
              Reject and move to next
            </button>
            <button type="button" className="ribbon-menu-item" onClick={() => editor.chain().focus().rejectChanges().run()}>
              Reject all changes
            </button>
          </RibbonMenu>
          <div className="ribbon-stack">
            <Small icon={ChevronLeft} label="Previous" disabled={!sel.changeCount} onClick={() => jumpChange(-1)} />
            <Small icon={ChevronRight} label="Next" disabled={!sel.changeCount} onClick={() => jumpChange(1)} />
          </div>
        </div>
        <div className="ribbon-group-label">Changes</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={GitCompare} label="Compare" disabled={!canCompare} title={canCompare ? "Compare the previous version with this one" : "Needs at least two saved versions"} onClick={() => setOpenModal("compare")} />
          <Big
            icon={draft.layout.protected ? LockOpen : Lock}
            label={draft.layout.protected ? "Unprotect" : "Protect"}
            active={!!draft.layout.protected}
            disabled={!canEdit}
            title={draft.layout.protected ? "Allow editing again" : "Make the document read-only for everyone"}
            onClick={() => updateDraftLayout(draft.id, { protected: !draft.layout.protected })}
          />
        </div>
        <div className="ribbon-group-label">Compare &amp; Protect</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          {canSendForReview(currentUser) && (
            <>
              <Big icon={Send} label="Send for Review" onClick={() => setOpenModal("send")} />
              <Big icon={FileInput} label="Import Updated" title="Import an updated draft received back" onClick={() => setOpenModal("import")} />
            </>
          )}
          <div className="ribbon-stack">
            <Small icon={History} label="Versions" onClick={() => setOpenModal("versions")} />
            <Small icon={LayoutDashboard} label="Review Dashboard" onClick={() => router.push("/draft/reviews")} />
            {pendingReviews > 0 && <span className="badge orange">{pendingReviews} pending</span>}
          </div>
        </div>
        <div className="ribbon-group-label">Review Workflow</div>
      </div>

      {openModal === "send" && <SendForReviewModal draft={draft} onClose={() => setOpenModal(null)} />}
      {openModal === "import" && <ImportUpdatedDraftModal draft={draft} onClose={() => setOpenModal(null)} />}
      {openModal === "versions" && <VersionHistoryPanel draft={draft} onClose={() => setOpenModal(null)} />}
      {openModal === "compare" && canCompare && (
        <CompareVersionsModal draft={draft} versionAId={previousVersion.id} versionBId={activeVersionForCompare.id} onClose={() => setOpenModal(null)} />
      )}
      {pendingComment && <AddCommentDialog quotedText={pendingComment.quotedText} onClose={() => setPendingComment(null)} onSubmit={submitComment} />}
      {wordStats && <WordCountDialog stats={wordStats} onClose={() => setWordStats(null)} />}
    </div>
  );
}
