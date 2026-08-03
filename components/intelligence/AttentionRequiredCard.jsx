"use client";

import Link from "next/link";
import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { useChat } from "@/components/chat/ChatContext";
import { computeAttentionItems } from "./attention";

export default function AttentionRequiredCard() {
  const { cases } = useCases();
  const { tasks } = useTasks();
  const { attachments } = useAttachments();
  const { messages } = useChat();

  const items = computeAttentionItems({ cases, tasks, attachments, messages });

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">Attention Required</h2>
      </div>
      {items.length ? (
        items.map((item) => (
          <Link className="list-item" href={item.href} key={item.id}>
            <div className="stat-icon orange">!</div>
            <div className="item-main">
              <strong>{item.label}</strong>
            </div>
          </Link>
        ))
      ) : (
        <div className="empty-inline">Nothing needs attention right now.</div>
      )}
    </section>
  );
}
