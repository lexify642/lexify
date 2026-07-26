import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";

export default function LexiAiPage() {
  return (
    <AppShell>
      <Topbar>
        <span>◌</span>
        <div className="avatar">JA</div>
      </Topbar>
      <div className="page">
        <div className="heading-row">
          <div>
            <h1 className="page-title">Lexi AI</h1>
            <p className="page-subtitle">AI-powered legal research and drafting companion.</p>
          </div>
          <button className="btn btn-outline">+ New conversation</button>
        </div>

        <div className="chat-layout">
          <section className="card chat-card">
            <div className="chat-head">
              <h2>✦ Lexi AI - Your AI Legal Assistant</h2>
              <p>Ask about Indian law, find case law, or prepare a first draft.</p>
            </div>
            <div className="messages">
              <div className="message">
                <div className="bot-icon">✦</div>
                <div className="bubble">
                  Hello John. I can help you research a legal question, analyse a document, or
                  generate a starting point for your next draft. What would you like to work on?
                </div>
              </div>
              <div className="message user">
                <div className="avatar">JA</div>
                <div className="bubble">
                  Find recent authorities on enforcement of arbitration clauses in commercial
                  contracts.
                </div>
              </div>
              <div className="message">
                <div className="bot-icon">✦</div>
                <div className="bubble">
                  I can help structure that research. Would you like authorities from the Supreme
                  Court only, or should I include relevant High Court decisions and a short ratio
                  summary for each?
                </div>
              </div>
            </div>
            <div className="composer">
              <div className="chips">
                <button className="chip">Find Case Law Citation</button>
                <button className="chip">Draft Legal Notice</button>
                <button className="chip">Summarize Judgement</button>
              </div>
              <div className="compose-row">
                <input aria-label="Ask Lexi AI" placeholder="Ask Lexi AI anything about your legal work..." />
                <button className="btn">Send ↑</button>
              </div>
            </div>
          </section>

          <aside className="card ai-card">
            <h3 className="ai-heading">✦ Quick Research</h3>
            <div className="research-option">
              <strong>Search case law</strong>
              <p>Find authorities by issue, court or citation.</p>
            </div>
            <div className="research-option">
              <strong>Analyse a judgement</strong>
              <p>Extract issues, holding and key paragraphs.</p>
            </div>
            <div className="research-option">
              <strong>Compare precedents</strong>
              <p>Contrast rulings across similar legal questions.</p>
            </div>
            <div className="accordion">
              <h4>SUGGESTIONS FOR THIS MATTER</h4>
              <button>
                Arbitration &amp; Conciliation Act <span>+</span>
              </button>
              <button>
                Commercial Courts Act <span>+</span>
              </button>
              <button>
                Recent Supreme Court rulings <span>+</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
