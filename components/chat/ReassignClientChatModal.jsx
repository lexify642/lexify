"use client";

import { useStaffDirectory } from "@/components/staff/StaffDirectoryContext";
import { ROLE_LABELS } from "@/lib/roles";
import { useChat } from "./ChatContext";

export default function ReassignClientChatModal({ conversation, onClose }) {
  const { reassignClientChat } = useChat();
  const { staff } = useStaffDirectory();
  const teamMembers = staff.map((p) => ({ id: p.id, name: p.full_name, role: ROLE_LABELS[p.role] || p.role }));

  function handleAssign(member) {
    reassignClientChat(conversation.clientName, member.name, member.role);
    onClose();
  }

  return (
    <div className="case-modal-backdrop show" onClick={onClose}>
      <div className="case-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Reassign {conversation.clientName}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {conversation.assignment && (
            <div className="empty-inline" style={{ marginBottom: 14 }}>
              Currently handled by {conversation.assignment.assignedToName} ({conversation.assignment.assignedToRole}).
              Only the assigned member (and Admins/Senior Advocates) receive notifications for this chat.
            </div>
          )}
          <div className="new-chat-member-list">
            {teamMembers.map((m) => (
              <div className="new-chat-member-row" key={m.id}>
                <div>
                  <strong>{m.name}</strong>
                  <span>{m.role}</span>
                </div>
                <button
                  type="button"
                  className={`btn ${conversation.assignment?.assignedToName === m.name ? "btn-soft" : "btn-outline"}`}
                  onClick={() => handleAssign(m)}
                >
                  {conversation.assignment?.assignedToName === m.name ? "Assigned" : "Assign"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
