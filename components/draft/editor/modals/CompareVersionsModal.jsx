"use client";

import { useMemo, useState } from "react";
import { useDrafts } from "../../DraftsContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { diffVersions, applyDecisions, summarizeDiff } from "../diffEngine";
import { plainTextToDoc } from "../extensions";
import { canAcceptRejectChanges } from "../../permissions";

export default function CompareVersionsModal({ draft, versionAId, versionBId, onClose }) {
  const { saveVersion } = useDrafts();
  const currentUser = useCurrentUser();
  const versionA = draft.versions.find((v) => v.id === versionAId);
  const versionB = draft.versions.find((v) => v.id === versionBId);
  const [oldVersion, newVersion] = versionA.number <= versionB.number ? [versionA, versionB] : [versionB, versionA];

  const changes = useMemo(() => diffVersions(oldVersion.contentText, newVersion.contentText), [oldVersion, newVersion]);
  const summary = useMemo(() => summarizeDiff(changes), [changes]);
  const [decisions, setDecisions] = useState({});
  const [saved, setSaved] = useState(false);

  function setDecision(changeId, value) {
    setDecisions((prev) => ({ ...prev, [changeId]: value }));
  }

  function acceptAll() {
    const next = {};
    changes.forEach((c) => (next[c.id] = "accept"));
    setDecisions(next);
  }

  function rejectAll() {
    const next = {};
    changes.forEach((c) => (next[c.id] = "reject"));
    setDecisions(next);
  }

  function handleSaveMerged() {
    const decisionMap = new Map(Object.entries(decisions));
    const mergedText = applyDecisions(changes, decisionMap);
    saveVersion(draft.id, plainTextToDoc(mergedText), `Changes reviewed — merged ${oldVersion.label} vs ${newVersion.label}`);
    setSaved(true);
    setTimeout(onClose, 900);
  }

  function renderWords(words, changeId) {
    return words.map((w, idx) => {
      if (w.type === "equal") return <span key={idx}>{w.oldValue}</span>;
      if (w.type === "removed") return <s key={idx} className="redline-removed">{w.oldValue}</s>;
      return <span key={idx} className="redline-added">{w.newValue}</span>;
    });
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">REVIEW — COMPARE VERSIONS</p>
            <h2>{oldVersion.label} → {newVersion.label}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {saved ? (
            <div className="empty-inline">Merged version saved.</div>
          ) : (
            <>
              <div className="redline-summary">
                <span className="badge green">+{summary.added} added</span>
                <span className="badge red">−{summary.removed} removed</span>
                <span className="badge orange">{summary.modified} modified</span>
                {canAcceptRejectChanges(currentUser) && (
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={acceptAll}>
                      Accept All
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={rejectAll}>
                      Reject All
                    </button>
                  </div>
                )}
              </div>
              <p className="page-subtitle" style={{ margin: "8px 0" }}>
                Only text content is merged into the new version — table/formatting structure from either version isn&apos;t reconstructed here.
              </p>
              <div className="redline-body">
                {changes
                  .filter((c) => c.type !== "equal")
                  .map((change) => {
                    const decision = decisions[change.id] || "accept";
                    return (
                      <div key={change.id} className="redline-change">
                        <div className="redline-change-text">
                          {change.type === "added" && <span className="redline-added">{change.text}</span>}
                          {change.type === "removed" && <s className="redline-removed">{change.text}</s>}
                          {change.type === "modified" && renderWords(change.words, change.id)}
                        </div>
                        {canAcceptRejectChanges(currentUser) && (
                          <div className="redline-change-actions">
                            <button
                              type="button"
                              className={`btn btn-sm ${decision === "accept" ? "" : "btn-outline"}`}
                              onClick={() => setDecision(change.id, "accept")}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${decision === "reject" ? "" : "btn-outline"}`}
                              onClick={() => setDecision(change.id, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                {changes.every((c) => c.type === "equal") && <div className="empty-inline">No differences between these versions.</div>}
              </div>
            </>
          )}
        </div>
        {!saved && (
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {canAcceptRejectChanges(currentUser) ? "Cancel" : "Close"}
            </button>
            {canAcceptRejectChanges(currentUser) && (
              <button type="button" className="btn" onClick={handleSaveMerged}>
                Save as New Version
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
