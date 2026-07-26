"use client";

import { useRef } from "react";
import ClauseBank from "./ClauseBank";
import TemplateBank from "./TemplateBank";
import PartnershipDeedEngine from "./PartnershipDeedEngine";
import { useDraftView } from "./useDraftView";

const INITIAL_DRAFT_HTML = `<h3>IN THE HIGH COURT OF JUDICATURE AT MUMBAI</h3><h3>ORDINARY ORIGINAL CIVIL JURISDICTION</h3><p>SUIT NO. ______ OF 2026</p><br><p><b>ABC CORPORATION LIMITED</b><br>...Plaintiff</p><p><b>VERSUS</b></p><p><b>XYZ LIMITED</b><br>...Defendant</p><p style="margin-top:35px"><b>PLAINT</b></p><p class="doc-body">The Plaintiff above named respectfully submits as follows: The Plaintiff is a company incorporated under the Companies Act, 2013 and carries on business from its registered office at Mumbai.</p>`;

const TABS = [
  { key: "draft", label: "Draft editor" },
  { key: "clauses", label: "Clause Bank" },
  { key: "templates", label: "Template Bank" },
];

export default function LexiDraftWorkspace() {
  const view = useDraftView();
  const editorRef = useRef(null);

  function openGenerator() {
    window.location.hash = "#generator";
  }

  function insertClauseIntoDraft(text) {
    const el = editorRef.current;
    if (el) {
      const paragraph = document.createElement("p");
      paragraph.className = "doc-body";
      paragraph.style.whiteSpace = "pre-line";
      paragraph.textContent = text;
      el.appendChild(paragraph);
    }
    window.location.hash = "#draft";
  }

  return (
    <div className="page">
      {view !== "generator" && (
        <>
          <div className="heading-row">
            <div>
              <h1 className="page-title">Lexi Draft</h1>
              <p className="page-subtitle">ABC Corp. vs. XYZ Ltd. · Plaint draft</p>
            </div>
            <div className="header-actions">
              <button className="btn" onClick={() => window.print()}>
                Export PDF
              </button>
            </div>
          </div>

          <div className="workspace-tabs">
            {TABS.map((tab) => (
              <a key={tab.key} className={view === tab.key ? "active" : ""} href={`#${tab.key}`}>
                {tab.label}
              </a>
            ))}
          </div>
        </>
      )}

      <section className={`library-view${view === "draft" ? " active" : ""}`}>
        <div className="editor-layout">
          <section className="card editor-card">
            <div className="toolbar">
              <button className="tool select">Georgia⌄</button>
              <button className="tool select">12 pt⌄</button>
              <button className="tool">
                <b>B</b>
              </button>
              <button className="tool">
                <i>I</i>
              </button>
              <button className="tool">U</button>
              <button className="tool">≡</button>
            </div>
            <article
              className="document"
              contentEditable
              suppressContentEditableWarning
              ref={editorRef}
              dangerouslySetInnerHTML={{ __html: INITIAL_DRAFT_HTML }}
            />
          </section>
          <aside className="card ai-card">
            <h3 className="ai-heading">✦ AI Assist</h3>
            <div className="ai-actions">
              <button>Explain</button>
              <button>Reword</button>
              <button>Insert Citation</button>
              <button>Check Risks</button>
            </div>
            <div className="accordion">
              <h4>CLAUSE &amp; TEMPLATE LIBRARY</h4>
              <button>
                Jurisdiction <span>+</span>
              </button>
              <button>
                Cause of Action <span>+</span>
              </button>
              <button>
                Prayer for Relief <span>+</span>
              </button>
            </div>
          </aside>
        </div>
      </section>

      <PartnershipDeedEngine active={view === "generator"} />
      <ClauseBank active={view === "clauses"} onInsert={insertClauseIntoDraft} />
      <TemplateBank active={view === "templates"} onSelect={openGenerator} />
    </div>
  );
}
