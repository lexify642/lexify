"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, UserPlus, Clock, AlertTriangle, RefreshCw, CheckCircle2, MessageSquare, AtSign, Paperclip, Link2, CalendarPlus } from "lucide-react";
import { useTasks } from "./TasksContext";
import { useCases } from "@/components/cases/CasesContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { useChat } from "@/components/chat/ChatContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { buildConversations } from "@/components/chat/conversationUtils";
import { buildChatNotifications } from "@/components/chat/chatNotifications";
import { CURRENT_USER } from "@/data/team";
import { dueCategory } from "@/data/tasks";

const TYPE_ICONS = {
  assigned: UserPlus,
  due: Clock,
  overdue: AlertTriangle,
  status: RefreshCw,
  completed: CheckCircle2,
  message: MessageSquare,
  mention: AtSign,
  document: Paperclip,
  caseLinked: Link2,
  appointment: CalendarPlus,
};

// Purely a computed, session-local feed (no backend/push infra exists in
// this app) — derived fresh from the live Tasks store every render, so it
// can never drift out of sync with the tasks it's describing.
function buildNotifications(tasks) {
  const items = [];
  tasks.forEach((t) => {
    const cat = dueCategory(t);
    if (t.assignedToName === CURRENT_USER.name) {
      items.push({ id: `assigned-${t.id}`, type: "assigned", taskId: t.id, message: `New task assigned: "${t.title}"`, timestamp: t.assignedAt });
    }
    if (cat === "today") {
      items.push({ id: `due-${t.id}`, type: "due", taskId: t.id, message: `"${t.title}" is due today`, timestamp: `${t.dueDate}T12:00:00` });
    }
    if (cat === "overdue") {
      items.push({ id: `overdue-${t.id}`, type: "overdue", taskId: t.id, message: `"${t.title}" is overdue`, timestamp: `${t.dueDate}T12:00:00` });
    }
    if (t.activity.length > 1) {
      const latest = t.activity[0];
      items.push({ id: `status-${latest.id}`, type: "status", taskId: t.id, message: `"${t.title}" status changed to ${latest.statusTo}`, timestamp: latest.timestamp });
    }
    if (t.status === "Completed") {
      const completedEntry = t.activity.find((a) => a.statusTo === "Completed");
      items.push({
        id: `completed-${t.id}`,
        type: "completed",
        taskId: t.id,
        message: `"${t.title}" was completed`,
        timestamp: completedEntry?.timestamp || t.assignedAt,
      });
    }
  });
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);
}

export default function NotificationBell() {
  const { tasks } = useTasks();
  const { cases } = useCases();
  const { appointments } = useAppointments();
  const { messages, groups, directConversations, clientChatAssignments } = useChat();
  const { attachments } = useAttachments();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState(() => new Set());
  const containerRef = useRef(null);

  const notifications = useMemo(() => {
    const conversations = buildConversations({ cases, tasks, groups, directConversations, clientChatAssignments });
    const chatItems = buildChatNotifications({ messages, conversations, attachments, appointments });
    return [...buildNotifications(tasks), ...chatItems].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);
  }, [tasks, cases, groups, directConversations, clientChatAssignments, messages, attachments, appointments]);
  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) setSeenIds(new Set(notifications.map((n) => n.id)));
      return next;
    });
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button type="button" className="notification-bell-btn" onClick={toggleOpen} aria-label="Notifications">
        <Bell size={18} strokeWidth={2} aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-panel">
          <div className="notification-panel-head">Notifications</div>
          {notifications.length ? (
            <div className="notification-list">
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type];
                return (
                  <Link href={n.href || `/tasks/${n.taskId}`} className="notification-item" key={n.id} onClick={() => setOpen(false)}>
                    <Icon size={14} strokeWidth={2} aria-hidden="true" />
                    <span>{n.message}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-inline">No notifications.</div>
          )}
        </div>
      )}
    </div>
  );
}
