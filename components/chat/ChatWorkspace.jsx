"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useChat } from "./ChatContext";
import { buildConversations } from "./conversationUtils";
import ChatSidebarList from "./ChatSidebarList";
import ConversationView from "./ConversationView";
import ChatRightPanel from "./ChatRightPanel";
import NewChatModal from "./NewChatModal";

export default function ChatWorkspace() {
  const { cases } = useCases();
  const { tasks } = useTasks();
  const { messages, groups, directConversations, clientChatAssignments, readState, online } = useChat();
  const searchParams = useSearchParams();

  const conversations = useMemo(
    () => buildConversations({ cases, tasks, groups, directConversations, clientChatAssignments }),
    [cases, tasks, groups, directConversations, clientChatAssignments]
  );

  const [activeId, setActiveId] = useState(null);
  const [mobileView, setMobileView] = useState("list");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    const requested = searchParams.get("c");
    if (requested && conversations.some((c) => c.id === requested)) {
      setActiveId(requested);
      setMobileView("conversation");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  function handleSelect(id) {
    setActiveId(id);
    setMobileView("conversation");
  }

  function handleCreated(id) {
    setShowNewChat(false);
    setActiveId(id);
    setMobileView("conversation");
  }

  return (
    <div className={`chat-shell${rightPanelOpen && activeConversation ? " with-right-panel" : ""}`} data-mobile-view={mobileView}>
      <ChatSidebarList
        conversations={conversations}
        messages={messages}
        readState={readState}
        online={online}
        activeId={activeId}
        onSelect={handleSelect}
        onNewChat={() => setShowNewChat(true)}
      />

      {activeConversation ? (
        <ConversationView
          key={activeConversation.id}
          conversation={activeConversation}
          allConversations={conversations}
          onBack={() => setMobileView("list")}
          rightPanelOpen={rightPanelOpen}
          onToggleRightPanel={() => setRightPanelOpen((v) => !v)}
        />
      ) : (
        <div className="chat-conversation chat-empty-state">
          <div>
            <h3>Select a chat</h3>
            <p className="page-subtitle">Pick a conversation on the left, or start a new one.</p>
          </div>
        </div>
      )}

      {rightPanelOpen && activeConversation && (
        <ChatRightPanel
          conversation={activeConversation}
          conversations={conversations.filter((c) => c.id !== activeConversation.id)}
          onClose={() => setRightPanelOpen(false)}
        />
      )}

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onCreated={handleCreated} />}
    </div>
  );
}
