"use client";

import { CASE_PROGRESS_STAGES, caseProgressIndex } from "./caseHealth";

export default function CaseProgressTracker({ caseData }) {
  const currentIndex = caseProgressIndex(caseData);

  return (
    <div className="case-progress-tracker">
      {CASE_PROGRESS_STAGES.map((stage, i) => (
        <div
          key={stage}
          className={`case-progress-step${i === currentIndex ? " current" : ""}${i < currentIndex ? " done" : ""}`}
        >
          <span className="case-progress-dot" />
          <span className="case-progress-label">{stage}</span>
          {i < CASE_PROGRESS_STAGES.length - 1 && <span className="case-progress-connector" />}
        </div>
      ))}
    </div>
  );
}
