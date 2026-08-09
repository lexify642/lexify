// A real, self-contained LCS (longest common subsequence) diff — no external
// dependency. Two-tier: paragraphs are matched first (so unrelated edits
// elsewhere in a long document don't scramble the comparison), then any
// paragraph present in both but changed gets a second, word-level pass so
// the redline can show exactly which words were added/removed inside it.

function lcsDiff(a, b, isEqual = (x, y) => x === y) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = isEqual(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (isEqual(a[i], b[j])) {
      ops.push({ type: "equal", oldValue: a[i], newValue: b[j] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "removed", oldValue: a[i] });
      i += 1;
    } else {
      ops.push({ type: "added", newValue: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ type: "removed", oldValue: a[i] });
    i += 1;
  }
  while (j < m) {
    ops.push({ type: "added", newValue: b[j] });
    j += 1;
  }
  return ops;
}

function tokenizeWords(text) {
  return (text || "").split(/(\s+)/).filter((t) => t.length > 0);
}

function tokenizeParagraphs(text) {
  return (text || "").split("\n").filter((p, idx, arr) => !(p === "" && idx === arr.length - 1));
}

// Merges an "removed" immediately followed by "added" into one "modified"
// paragraph carrying a word-level diff — otherwise a one-word edit would
// render as a whole deleted paragraph plus a whole new one, which reads
// nothing like a real redline.
export function diffVersions(oldText, newText) {
  const oldParas = tokenizeParagraphs(oldText);
  const newParas = tokenizeParagraphs(newText);
  const paraOps = lcsDiff(oldParas, newParas);

  const changes = [];
  let idCounter = 0;

  for (let k = 0; k < paraOps.length; k += 1) {
    const op = paraOps[k];
    const next = paraOps[k + 1];

    if (op.type === "equal") {
      changes.push({ id: `chg-${idCounter++}`, type: "equal", text: op.oldValue });
      continue;
    }

    if (op.type === "removed" && next && next.type === "added") {
      const wordOps = lcsDiff(tokenizeWords(op.oldValue), tokenizeWords(next.newValue));
      changes.push({
        id: `chg-${idCounter++}`,
        type: "modified",
        oldText: op.oldValue,
        newText: next.newValue,
        words: wordOps,
      });
      k += 1; // consume the paired "added"
      continue;
    }

    if (op.type === "removed") {
      changes.push({ id: `chg-${idCounter++}`, type: "removed", text: op.oldValue });
      continue;
    }

    changes.push({ id: `chg-${idCounter++}`, type: "added", text: op.newValue });
  }

  return changes;
}

// Applies a set of accept/reject decisions (Map<changeId, "accept"|"reject">)
// to a change list, producing the resulting plain text. Unresolved changes
// default to "accept" (i.e. the new version's text) so "Accept All" needs no
// per-item bookkeeping — this only ever builds a NEW working copy; neither
// compared version is mutated.
export function applyDecisions(changes, decisions) {
  const lines = [];
  changes.forEach((change) => {
    const decision = decisions.get(change.id) || "accept";
    if (change.type === "equal") {
      lines.push(change.text);
    } else if (change.type === "added") {
      if (decision === "accept") lines.push(change.text);
    } else if (change.type === "removed") {
      if (decision === "reject") lines.push(change.text);
    } else if (change.type === "modified") {
      lines.push(decision === "reject" ? change.oldText : change.newText);
    }
  });
  return lines.join("\n");
}

export function summarizeDiff(changes) {
  return changes.reduce(
    (acc, c) => {
      if (c.type === "added") acc.added += 1;
      else if (c.type === "removed") acc.removed += 1;
      else if (c.type === "modified") acc.modified += 1;
      return acc;
    },
    { added: 0, removed: 0, modified: 0 }
  );
}
