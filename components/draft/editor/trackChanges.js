// Word-style Track Changes for the live TipTap document.
//
// Two marks carry the suggestions inside the document itself (so they're
// saved with every version and survive reloads): `insertion` (rendered as
// <ins>) and `deletion` (rendered as <del>). docx/html's htmlToContent turns
// those very tags into real Word tracked changes on .docx export.
//
// While tracking is on, the plugin's appendTransaction rewrites each user
// edit after the fact: newly typed/pasted text gets the insertion mark, and
// anything the edit removed is put back in place carrying the deletion mark
// instead of disappearing. Removing text that is itself still an unaccepted
// insertion just removes it (Word does the same — you can't "delete" a
// suggestion you haven't accepted, it simply goes away).
import { Mark, Extension, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { ReplaceStep } from "@tiptap/pm/transform";

export const trackChangesKey = new PluginKey("trackChanges");
const SKIP_META = "trackChangesSkip";

function changeAttributes() {
  return {
    author: { default: "", parseHTML: (el) => el.getAttribute("data-author") || "", renderHTML: (a) => (a.author ? { "data-author": a.author } : {}) },
    date: { default: "", parseHTML: (el) => el.getAttribute("datetime") || "", renderHTML: (a) => (a.date ? { datetime: a.date } : {}) },
  };
}

export const InsertionMark = Mark.create({
  name: "insertion",
  inclusive: false,
  excludes: "deletion",
  addAttributes: changeAttributes,
  parseHTML() {
    // Above Underline's priority so <ins> is always a tracked insertion.
    return [{ tag: "ins", priority: 60 }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["ins", mergeAttributes(HTMLAttributes, { class: "tc-insert" }), 0];
  },
});

export const DeletionMark = Mark.create({
  name: "deletion",
  inclusive: false,
  excludes: "insertion",
  addAttributes: changeAttributes,
  parseHTML() {
    // Above Strike's (StarterKit also parses <del>) so pasted/imported
    // tracked deletions stay tracked deletions, not plain strikethrough.
    return [{ tag: "del", priority: 60 }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["del", mergeAttributes(HTMLAttributes, { class: "tc-delete" }), 0];
  },
});

function sliceIsOnlyInsertions(slice, schema) {
  let hasText = false;
  let allInserted = true;
  slice.content.descendants((node) => {
    if (node.isText) {
      hasText = true;
      if (!schema.marks.insertion.isInSet(node.marks)) allInserted = false;
    } else if (node.isLeaf && !node.isText) {
      allInserted = false;
    }
  });
  return hasText && allInserted;
}

export const TrackChanges = Extension.create({
  name: "trackChanges",

  addOptions() {
    return { author: "" };
  },

  addStorage() {
    return { enabled: false };
  },

  addCommands() {
    return {
      setTrackChanges:
        (enabled) =>
        ({ editor }) => {
          editor.storage.trackChanges.enabled = !!enabled;
          return true;
        },
      // Accept/reject everything in [from, to) — or the whole document when
      // no range is given.
      acceptChanges:
        (range) =>
        ({ state, tr, dispatch }) => applyDecision(state, tr, dispatch, range, "accept"),
      rejectChanges:
        (range) =>
        ({ state, tr, dispatch }) => applyDecision(state, tr, dispatch, range, "reject"),
    };
  },

  addProseMirrorPlugins() {
    const ext = this;
    return [
      new Plugin({
        key: trackChangesKey,
        appendTransaction(transactions, oldState, newState) {
          if (!ext.storage.enabled) return null;
          const schema = newState.schema;
          const ins = schema.marks.insertion;
          const del = schema.marks.deletion;
          // Loading a whole document (version restore, import) isn't an
          // edit, so a step that replaces everything is never tracked.
          const replacesWholeDoc = (tr) =>
            tr.steps.some((step, i) => step instanceof ReplaceStep && step.from === 0 && step.to === tr.docs[i].content.size);
          const userTrs = transactions.filter(
            (tr) => tr.docChanged && !tr.getMeta(SKIP_META) && !tr.getMeta("preventUpdate") && tr.getMeta("addToHistory") !== false && !replacesWholeDoc(tr)
          );
          if (!userTrs.length) return null;

          const author = ext.options.author || "";
          const date = new Date().toISOString();
          const out = newState.tr;
          let pureDeletionAt = null;

          // Positions in the doc just after step N are mapped through every
          // later step to reach newState.doc, then through whatever `out`
          // has already changed.
          const allSteps = [];
          transactions.forEach((tr) => tr.steps.forEach((step, i) => allSteps.push({ tr, step, i, user: userTrs.includes(tr) })));
          const total = allSteps.length;
          const mappings = [];
          transactions.forEach((tr) => tr.mapping.maps.forEach((m) => mappings.push(m)));

          allSteps.forEach(({ tr, step, i, user }, globalIndex) => {
            if (!user || !(step instanceof ReplaceStep)) return;
            const docBefore = tr.docs[i];
            const { from, to } = step;
            const restMap = (pos, assoc) => {
              let p = pos;
              for (let k = globalIndex + 1; k < total; k += 1) p = mappings[k].map(p, assoc);
              return out.mapping.map(p, assoc);
            };
            const insStart = restMap(from, -1);
            const insEnd = restMap(from + step.slice.size, 1);

            if (insEnd > insStart) {
              out.removeMark(insStart, insEnd, del);
              out.addMark(insStart, insEnd, ins.create({ author, date }));
            }

            if (to > from) {
              const removed = docBefore.slice(from, to);
              if (sliceIsOnlyInsertions(removed, schema)) return;
              const before = out.doc.content.size;
              out.replace(insStart, insStart, removed);
              const added = out.doc.content.size - before;
              if (added > 0) {
                out.removeMark(insStart, insStart + added, ins);
                out.addMark(insStart, insStart + added, del.create({ author, date }));
                if (step.slice.size === 0) pureDeletionAt = insStart;
              }
            }
          });

          if (!out.docChanged) return null;
          if (pureDeletionAt !== null) {
            // Backspace/Delete: keep the caret where the user expects it
            // rather than after the now-struck-through text.
            const pos = Math.min(pureDeletionAt, out.doc.content.size);
            out.setSelection(TextSelection.near(out.doc.resolve(pos)));
          }
          out.setMeta(SKIP_META, true);
          return out;
        },
      }),
    ];
  },
});

function applyDecision(state, tr, dispatch, range, decision) {
  const { insertion: ins, deletion: del } = state.schema.marks;
  const from = range?.from ?? 0;
  const to = range?.to ?? state.doc.content.size;
  const toDelete = [];
  const toUnmark = [];
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText) return;
    const start = Math.max(pos, from);
    const end = Math.min(pos + node.nodeSize, to);
    if (ins.isInSet(node.marks)) (decision === "accept" ? toUnmark : toDelete).push({ start, end, mark: ins });
    if (del.isInSet(node.marks)) (decision === "accept" ? toDelete : toUnmark).push({ start, end, mark: del });
  });
  if (!toDelete.length && !toUnmark.length) return false;
  if (!dispatch) return true;
  toUnmark.forEach(({ start, end, mark }) => tr.removeMark(start, end, mark));
  toDelete
    .sort((a, b) => b.start - a.start)
    .forEach(({ start, end }) => tr.delete(tr.mapping.map(start), tr.mapping.map(end)));
  tr.setMeta(SKIP_META, true);
  dispatch(tr);
  return true;
}

// Every tracked change in document order, merging adjacent text nodes that
// carry the same change into one entry (for the Reviewing Pane and
// Next/Previous navigation).
export function collectChanges(doc) {
  const out = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const mark = node.marks.find((m) => m.type.name === "insertion" || m.type.name === "deletion");
    if (!mark) return;
    const last = out[out.length - 1];
    if (last && last.type === mark.type.name && last.to === pos && last.author === mark.attrs.author) {
      last.to = pos + node.nodeSize;
      last.text += node.text;
    } else {
      out.push({ type: mark.type.name, from: pos, to: pos + node.nodeSize, text: node.text, author: mark.attrs.author, date: mark.attrs.date });
    }
  });
  return out;
}

export { SKIP_META as TRACK_CHANGES_SKIP_META };
