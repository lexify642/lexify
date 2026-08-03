"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTasks } from "@/components/tasks/TasksContext";
import { useCases } from "@/components/cases/CasesContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { useChat, caseConversationId, clientConversationId } from "@/components/chat/ChatContext";
import { messagesFor } from "@/components/chat/conversationUtils";
import { accessListForCase } from "@/components/chat/permissions";
import { computeCaseHealth, toneForHealthLevel } from "@/components/intelligence/caseHealth";
import { computeRecentActivity } from "@/components/intelligence/activity";
import { displayDate } from "./utils";
import CaseProgressTracker from "@/components/intelligence/CaseProgressTracker";

export default function CaseInsightsPanel({ caseData, caseTasks, hasDiscussionRoom }) {
  const { tasks } = useTasks();
  const { cases, auditLog } = useCases();
  const { attachments } = useAttachments();
  const { messages } = useChat();

  const linkedAttachments = useMemo(() => attachments.filter((a) => a.linkedCaseNo === caseData.no), [attachments, caseData.no]);
  const health = useMemo(() => computeCaseHealth(caseData, { tasks, attachments, messages }), [caseData, tasks, attachments, messages]);
  const team = useMemo(() => accessListForCase(caseData, tasks), [caseData, tasks]);
  const recentActivity = useMemo(
    () => computeRecentActivity({ tasks, cases, attachments, auditLog }, 50).filter((item) => item.caseNo === caseData.no).slice(0, 6),
    [tasks, cases, attachments, auditLog, caseData.no]
  );

  const roomId = caseConversationId(caseData.no);
  const clientId = caseData.client?.name ? clientConversationId(caseData.client.name) : null;
  const roomMessages = messagesFor(roomId, messages);
  const clientMessages = clientId ? messagesFor(clientId, messages) : [];
  const lastComm = [...roomMessages, ...clientMessages].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const pendingTasks = caseTasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
  const researchAttached = linkedAttachments.filter((a) => a.category === "Research" || a.linkedDraftSlug);
  const searchQuery = caseData.caseDetails?.practiceArea || caseData.parties;

  return (
    <section className="drawer-section">
      <div className="case-insights-grid">
        <div className="case-insights-health">
          <div className="drawer-section-title">
            <h3>Case Health</h3>
          </div>
          <div className="case-health-score-row">
            <span className={`badge ${toneForHealthLevel(health.level)} case-health-score-badge`}>{health.score}%</span>
            <strong>{health.level}</strong>
          </div>
          {health.metChecks.length > 0 && (
            <ul className="case-health-list">
              {health.metChecks.map((m) => (
                <li key={m}>✓ {m}</li>
              ))}
            </ul>
          )}
          {health.issues.length > 0 && (
            <ul className="case-health-list issues">
              {health.issues.map((i) => (
                <li key={i}>• {i}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="case-insights-progress">
          <div className="drawer-section-title">
            <h3>Progress Tracker</h3>
          </div>
          <CaseProgressTracker caseData={caseData} />
        </div>
      </div>

      <div className="drawer-section-title" style={{ marginTop: 22 }}>
        <h3>Pending Tasks ({pendingTasks.length})</h3>
        <Link className="link" href="/tasks">
          View all →
        </Link>
      </div>
      {pendingTasks.length ? (
        pendingTasks.slice(0, 5).map((t) => (
          <div className="list-item" key={t.id}>
            <div className="item-main">
              <strong>{t.title}</strong>
              <span>
                {t.assignedToName} · Due {displayDate(t.dueDate)}
              </span>
            </div>
            <span className="badge grey">{t.status}</span>
          </div>
        ))
      ) : (
        <div className="empty-inline">No pending tasks.</div>
      )}

      <div className="drawer-section-title" style={{ marginTop: 22 }}>
        <h3>Research Attached ({researchAttached.length})</h3>
        <Link className="link" href={`/case-research?q=${encodeURIComponent(searchQuery)}`}>
          Search Related Case Law →
        </Link>
      </div>
      {researchAttached.length ? (
        researchAttached.map((a) => (
          <div className="chat-linked-row" key={a.id}>
            <strong>{a.name}</strong>
            <span>{a.category || "Linked draft"}</span>
          </div>
        ))
      ) : (
        <div className="empty-inline">No research attached yet — use "Save to Case" on a chat attachment, or search related case law.</div>
      )}

      <div className="drawer-section-title" style={{ marginTop: 22 }}>
        <h3>Recent Communication</h3>
        {hasDiscussionRoom && (
          <Link className="link" href={`/chat?c=${roomId}`}>
            Open Discussion Room →
          </Link>
        )}
      </div>
      {lastComm ? (
        <div className="chat-linked-row">
          <strong>{lastComm.senderName}</strong>
          <span>{lastComm.deleted ? "This message was deleted" : lastComm.text || "Attachment"}</span>
        </div>
      ) : (
        <div className="empty-inline">No communication logged for this matter yet.</div>
      )}

      <div className="drawer-section-title" style={{ marginTop: 22 }}>
        <h3>Latest Activity</h3>
      </div>
      {recentActivity.length ? (
        recentActivity.map((item) => (
          <div className="list-item" key={item.id}>
            <div className="item-main">
              <strong>
                {item.user} {item.action}
              </strong>
              <span>{new Date(item.timestamp).toLocaleString("en-IN")}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-inline">No activity logged yet.</div>
      )}

      <div className="drawer-section-title" style={{ marginTop: 22 }}>
        <h3>Team Members</h3>
      </div>
      <div className="chat-member-chips">
        {team.length ? team.map((name) => <span className="badge grey" key={name}>{name}</span>) : <div className="empty-inline">No team assigned.</div>}
      </div>
    </section>
  );
}
