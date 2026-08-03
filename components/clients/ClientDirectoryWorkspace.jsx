"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCases } from "@/components/cases/CasesContext";
import { buildClientDirectory, checkConflicts } from "@/components/cases/clientDirectory";
import { clientConversationId, useChat } from "@/components/chat/ChatContext";
import { computeClientFollowUps } from "@/components/intelligence/reminders";

export default function ClientDirectoryWorkspace() {
  const { cases } = useCases();
  const { messages } = useChat();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [conflictQuery, setConflictQuery] = useState("");
  const [conflictResults, setConflictResults] = useState(null);
  const [expandedClient, setExpandedClient] = useState(searchParams.get("name") || null);

  useEffect(() => {
    const requested = searchParams.get("name");
    if (requested) {
      setExpandedClient(requested);
      document.getElementById(`client-${requested}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const directory = useMemo(() => buildClientDirectory(cases), [cases]);
  const followUpByClient = useMemo(() => {
    const map = new Map();
    computeClientFollowUps({ cases, messages }, 0).forEach((f) => map.set(f.clientName, f));
    return map;
  }, [cases, messages]);
  const filteredDirectory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return directory;
    return directory.filter((c) => c.name.toLowerCase().includes(term));
  }, [directory, search]);

  function handleConflictCheck(event) {
    event.preventDefault();
    setConflictResults(checkConflicts(conflictQuery, cases));
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Clients &amp; Conflict Check</h1>
          <p className="page-subtitle">
            Client database built from the Case Diary, with a quick conflict-of-interest check before accepting a new matter.
          </p>
        </div>
      </div>

      <section className="card">
        <h2 className="panel-title">Conflict Check</h2>
        <form className="conflict-check-form" onSubmit={handleConflictCheck}>
          <input
            placeholder="Enter a name to check against existing clients, parties, and opposing counsel..."
            value={conflictQuery}
            onChange={(e) => setConflictQuery(e.target.value)}
          />
          <button type="submit" className="btn">
            Check
          </button>
        </form>
        {conflictResults !== null &&
          (conflictResults.length ? (
            <div className="alert-list" style={{ marginTop: 16 }}>
              {conflictResults.map((m, i) => (
                <div className="alert-item warning" key={i}>
                  <span>
                    <b>{m.matchedName}</b> matches as {m.matchedAs} in{" "}
                    <Link href={`/cases/${m.caseNo}`}>
                      {m.parties} ({m.number})
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-inline" style={{ marginTop: 16 }}>
              No conflicts found for &quot;{conflictQuery}&quot;.
            </div>
          ))}
      </section>

      <section className="card">
        <div className="section-head">
          <h2 className="section-title">Client Directory</h2>
        </div>
        <div className="search" style={{ width: "100%", marginBottom: 18 }}>
          <span>⌕</span>
          <input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {filteredDirectory.length ? (
          <div className="client-directory-list">
            {filteredDirectory.map((client) => {
              const expanded = expandedClient === client.name;
              const followUp = followUpByClient.get(client.name);
              return (
                <article className="client-directory-card" id={`client-${client.name}`} key={client.name}>
                  <button
                    type="button"
                    className="client-directory-head"
                    onClick={() => setExpandedClient(expanded ? null : client.name)}
                    aria-expanded={expanded}
                  >
                    <div>
                      <b>{client.name}</b>
                      <span className="previous-date-meta">
                        {client.phone} · {client.matters.length} matter{client.matters.length === 1 ? "" : "s"}
                      </span>
                      <span className="previous-date-meta">
                        Last contacted:{" "}
                        {followUp?.lastContactedDaysAgo === null || followUp?.lastContactedDaysAgo === undefined
                          ? "Never"
                          : followUp.lastContactedDaysAgo === 0
                          ? "Today"
                          : `${followUp.lastContactedDaysAgo} days ago`}
                      </span>
                    </div>
                    <span className="previous-date-expand">{expanded ? "▾" : "▸"}</span>
                  </button>
                  {expanded && (
                    <div className="client-directory-matters">
                      <p className="hint">{client.address}</p>
                      <Link href={`/chat?c=${clientConversationId(client.name)}`} className="btn btn-outline" style={{ marginBottom: 12 }}>
                        💬 Open Chat
                      </Link>
                      {client.matters.map((m) => (
                        <Link className="research-option" href={`/cases/${m.caseNo}`} key={m.caseNo} style={{ display: "block" }}>
                          <strong>{m.parties}</strong>
                          <p>
                            {m.number} · {m.court}
                          </p>
                          <span className={`badge ${m.tone}`}>{m.stage}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-inline">No clients found.</div>
        )}
      </section>
    </div>
  );
}
