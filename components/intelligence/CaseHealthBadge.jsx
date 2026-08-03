"use client";

import { useTasks } from "@/components/tasks/TasksContext";
import { useAttachments } from "@/components/chat/AttachmentsContext";
import { useChat } from "@/components/chat/ChatContext";
import { computeCaseHealth, toneForHealthLevel } from "./caseHealth";

// Drop-in badge — pulls Tasks/Attachments/Chat state itself so callers (Case
// Diary list rows, Case Overview header, Case Insights) don't each need to
// wire the same three contexts through just to show a score.
export default function CaseHealthBadge({ caseData, showLevel = false }) {
  const { tasks } = useTasks();
  const { attachments } = useAttachments();
  const { messages } = useChat();
  const { score, level } = computeCaseHealth(caseData, { tasks, attachments, messages });

  return (
    <span className={`badge ${toneForHealthLevel(level)}`} title={`Case health: ${level}`}>
      {score}%{showLevel ? ` · ${level}` : ""}
    </span>
  );
}
