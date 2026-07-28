"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { displayDate, toneForDisposition } from "./utils";

const NOT_GENERATED = "Not yet generated — full judgment text required.";

function AiBlock({ title, text }) {
  return (
    <section className="drawer-section">
      <h3>{title}</h3>
      {text ? <p className="ai-block-text">{text}</p> : <div className="empty-inline">{NOT_GENERATED}</div>}
    </section>
  );
}

export default function CaseResearchDetail({ caseId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    fetch(`/api/cases/${caseId}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.error) setError(body.error.message);
        else setData(body.data);
      })
      .catch(() => setError("Could not reach the case service."));
  }, [caseId]);

  if (error) {
    return (
      <div className="page">
        <div className="empty-inline">{error}</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="page">
        <p className="page-subtitle">Loading case…</p>
      </div>
    );
  }

  const ai = data.aiAnalysis;
  const isGenerated = ai?.status === "COMPLETED";
  const acts = data.referencedActs || [];
  const sections = data.referencedSections || [];

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">CASE RESEARCH</p>
          <h1 className="page-title">{data.caseTitle}</h1>
          <p className="page-subtitle">
            {data.neutralCitation || data.lawReportCitation || data.cnrNumber || data.docketNumber}
          </p>
        </div>
        <div className="header-actions">
          <span className={`badge ${toneForDisposition(data.dispositionText)}`}>{data.dispositionText || "Status unknown"}</span>
          <Link className="btn btn-outline" href="/case-research">
            ← Back to search
          </Link>
        </div>
      </div>

      <div className="matter-meta">
        <span>
          <b>{data.courtName}</b>
          {data.benchName || "—"}
        </span>
        <span>
          <b>{data.coramMembersText || data.presidingJudge || "Not recorded"}</b>
          Judge(s)
        </span>
        <span>
          <b>{displayDate(data.decisionDate)}</b>
          Decision date
        </span>
      </div>

      <div className="calculator-estimate-grid">
        <div className="calculator-estimate-main">
          <section className="card">
            <h2 className="panel-title">Parties</h2>
            <div className="matter-meta">
              <span>
                <b>{data.partyPetitioner || "—"}</b>
                Petitioner / Appellant
              </span>
              <span>
                <b>{data.partyRespondent || "—"}</b>
                Respondent
              </span>
            </div>
          </section>

          <section className="card">
            <h2 className="panel-title">Full Judgment</h2>
            {data.sourcePdfS3Url ? (
              <a className="btn btn-block" href={data.sourcePdfS3Url} target="_blank" rel="noopener noreferrer">
                ▤ View original PDF
              </a>
            ) : (
              <div className="empty-inline">No PDF link available for this judgment.</div>
            )}
            <p className="hint" style={{ marginTop: 12 }}>
              {data.indexableText}
            </p>
          </section>

          <section className="card">
            <h2 className="panel-title">AI Summary</h2>
            {isGenerated ? <p className="ai-block-text">{ai.summary}</p> : <div className="empty-inline">{NOT_GENERATED}</div>}
          </section>

          <AiBlock title="Facts" text={isGenerated ? ai.facts : null} />
          <AiBlock title="Issues" text={isGenerated ? ai.issues : null} />

          <section className="card">
            <h2 className="panel-title">Arguments</h2>
            <div className="field-row">
              <div>
                <h4 style={{ margin: "0 0 8px", color: "#8493aa", fontSize: 12, textTransform: "uppercase" }}>Petitioner</h4>
                {isGenerated && ai.argumentsPetitioner ? (
                  <p className="ai-block-text">{ai.argumentsPetitioner}</p>
                ) : (
                  <div className="empty-inline">{NOT_GENERATED}</div>
                )}
              </div>
              <div>
                <h4 style={{ margin: "0 0 8px", color: "#8493aa", fontSize: 12, textTransform: "uppercase" }}>Respondent</h4>
                {isGenerated && ai.argumentsRespondent ? (
                  <p className="ai-block-text">{ai.argumentsRespondent}</p>
                ) : (
                  <div className="empty-inline">{NOT_GENERATED}</div>
                )}
              </div>
            </div>
          </section>

          <AiBlock title="Decision" text={isGenerated ? ai.decision : null} />
          <AiBlock title="Ratio Decidendi" text={isGenerated ? ai.ratioDecidendi : null} />
          <AiBlock title="Obiter Dicta" text={isGenerated ? ai.obiterDicta : null} />

          <section className="card">
            <h2 className="panel-title">Key Takeaways</h2>
            {isGenerated && ai.keyTakeaways?.length ? (
              <ul className="insight-list-plain">
                {ai.keyTakeaways.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : (
              <div className="empty-inline">{NOT_GENERATED}</div>
            )}
          </section>

          <section className="card">
            <h2 className="panel-title">Important Paragraphs</h2>
            {isGenerated && ai.importantParagraphs?.length ? (
              ai.importantParagraphs.map((p, i) => (
                <div className="explanation-item" key={i}>
                  <div className="explanation-item-head">
                    <b>Paragraph {p.paragraphNumber ?? "—"}</b>
                  </div>
                  <p>{p.text}</p>
                </div>
              ))
            ) : (
              <div className="empty-inline">{NOT_GENERATED}</div>
            )}
          </section>
        </div>

        <div className="calculator-estimate-side">
          <section className="card">
            <h2 className="panel-title">Acts &amp; Sections</h2>
            {acts.length || sections.length ? (
              <div className="document-chips">
                {acts.map((act) => (
                  <Link className="chip-link" key={act} href={`/case-research?act=${encodeURIComponent(act)}`}>
                    {act}
                  </Link>
                ))}
                {sections.map((section) => (
                  <Link className="chip-link" key={section} href={`/case-research?section=${encodeURIComponent(section)}`}>
                    § {section}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-inline">No acts or sections extracted yet for this judgment.</div>
            )}
          </section>

          <section className="card">
            <h2 className="panel-title">Citation Analysis</h2>
            <div className="cost-row">
              <span>Neutral citation</span>
              <b>{data.neutralCitation || "—"}</b>
            </div>
            <div className="cost-row">
              <span>Law report citation</span>
              <b>{data.lawReportCitation || "—"}</b>
            </div>
            <div className="cost-row">
              <span>CNR number</span>
              <b>{data.cnrNumber || "—"}</b>
            </div>
            <div className="cost-row">
              <span>Docket number</span>
              <b>{data.docketNumber || "—"}</b>
            </div>
          </section>

          <section className="card">
            <h2 className="panel-title">Cited Cases</h2>
            {data.citationsFrom?.length ? (
              data.citationsFrom.map((c) => (
                <div className="empty-inline" key={c.id}>
                  {c.toCase?.caseTitle || c.citationTextRaw}
                </div>
              ))
            ) : (
              <div className="empty-inline">Not yet generated — citation extraction required.</div>
            )}
          </section>

          <section className="card">
            <h2 className="panel-title">Similar Judgments</h2>
            <div className="empty-inline">Not yet generated — requires AI semantic similarity.</div>
          </section>

          <section className="card">
            <h2 className="panel-title">Related Cases</h2>
            {data.relatedCases?.length ? (
              data.relatedCases.map((rc) => (
                <Link className="research-option" key={rc.id} href={`/case-research/${rc.id}`} style={{ display: "block" }}>
                  <strong>{rc.caseTitle}</strong>
                  <p>
                    {rc.courtName} · {displayDate(rc.decisionDate)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="empty-inline">No related cases found by matching parties or docket.</div>
            )}
          </section>

          <section className="card">
            <h2 className="panel-title">Reading Time &amp; Keywords</h2>
            <div className="cost-row">
              <span>Estimated reading time</span>
              <b>{isGenerated && ai.readingTimeMinutes ? `${ai.readingTimeMinutes} min` : "—"}</b>
            </div>
            {isGenerated && ai.aiKeywords?.length ? (
              <div className="document-chips" style={{ marginTop: 10 }}>
                {ai.aiKeywords.map((k) => (
                  <span className="chip-link" key={k}>
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty-inline" style={{ marginTop: 10 }}>
                {NOT_GENERATED}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
