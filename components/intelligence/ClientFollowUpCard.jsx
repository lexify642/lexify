"use client";

import Link from "next/link";
import { useCases } from "@/components/cases/CasesContext";
import { useChat } from "@/components/chat/ChatContext";
import { computeClientFollowUps } from "./reminders";

export default function ClientFollowUpCard() {
  const { cases } = useCases();
  const { messages } = useChat();

  const items = computeClientFollowUps({ cases, messages });

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">Clients Requiring Follow-up</h2>
        <Link className="link" href="/clients">
          View all →
        </Link>
      </div>
      {items.length ? (
        items.map((c) => (
          <Link className="list-item" href={c.href} key={c.clientName}>
            <div className="item-main">
              <strong>{c.clientName}</strong>
              <span>Last contacted: {c.lastContactedDaysAgo === null ? "Never" : `${c.lastContactedDaysAgo} days ago`}</span>
            </div>
            <span className="badge orange">{c.nextAction}</span>
          </Link>
        ))
      ) : (
        <div className="empty-inline">All clients are up to date.</div>
      )}
    </section>
  );
}
