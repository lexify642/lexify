"use client";

export default function CaseSelectorBar({ cases, linkedCase, onLink, onUnlink }) {
  if (!linkedCase) {
    return (
      <div className="card case-selector">
        <span className="case-selector-label">No case linked</span>
        <select defaultValue="" onChange={(e) => e.target.value && onLink(e.target.value)}>
          <option value="" disabled>
            Link a case…
          </option>
          {cases.map((c) => (
            <option key={c.no} value={c.no}>
              {c.parties} · {c.number}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="card case-selector case-selector-active">
      <span className="case-selector-label">Selected Case</span>
      <div className="case-banner-fields">
        <div>
          <small>Case Title</small>
          <strong>{linkedCase.parties}</strong>
        </div>
        <div>
          <small>Case Number</small>
          <strong>{linkedCase.number}</strong>
        </div>
        <div>
          <small>Case Type</small>
          <strong>{linkedCase.filing}</strong>
        </div>
        <div>
          <small>Court</small>
          <strong>
            {linkedCase.court}, {linkedCase.city}
          </strong>
        </div>
      </div>
      <button type="button" className="btn btn-outline" onClick={onUnlink}>
        ⇄ Change Case
      </button>
    </div>
  );
}
