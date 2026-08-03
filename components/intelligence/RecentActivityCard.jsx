"use client";

import Link from "next/link";
import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { computeRecentActivity } from "./activity";

export default function RecentActivityCard({ limit = 8 }) {
  const { cases, auditLog } = useCases();
  const { tasks } = useTasks();
  const { attachments } = useAttachments();

  const items = computeRecentActivity({ tasks, cases, attachments, auditLog }, limit);

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">Recent Activity</h2>
      </div>
      {items.length ? (
        items.map((item) => (
          <Link className="list-item" href={item.href} key={item.id}>
            <div className="item-main">
              <strong>
                {item.user} {item.action}
              </strong>
              <span>
                {item.caseLabel ? `${item.caseLabel} · ` : ""}
                {new Date(item.timestamp).toLocaleString("en-IN")}
              </span>
            </div>
          </Link>
        ))
      ) : (
        <div className="empty-inline">No recent activity yet.</div>
      )}
    </section>
  );
}
