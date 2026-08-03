"use client";

import { useEffect, useRef, useState } from "react";
import { useTasks } from "@/components/tasks/TasksContext";
import TaskModal from "@/components/tasks/TaskModal";
import AddEventModal from "@/components/calendar/AddEventModal";

const MENU_ITEMS = [
  { key: "task", label: "Create Task" },
  { key: "Appointment", label: "Create Appointment" },
  { key: "Reminder", label: "Create Reminder" },
  { key: "Hearing", label: "Create Hearing" },
  { key: "Deadline", label: "Create Deadline" },
];

function messageTitle(message) {
  if (message.text) return message.text.length > 60 ? `${message.text.slice(0, 60)}…` : message.text;
  return "Follow up on shared attachment";
}

// Right-click on any message → Create Task / Appointment / Reminder /
// Hearing / Deadline, pre-populated from the message and the conversation
// it's in — reuses the existing TaskModal/AddEventModal (via their new
// prefill props) rather than building separate modals.
export default function MessageContextMenu({ message, conversation, position, onClose }) {
  const { addTask } = useTasks();
  const ref = useRef(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (modal) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modal, onClose]);

  const caseNo = conversation.kind === "case" ? conversation.caseNo : null;
  const clientName = conversation.kind === "client" ? conversation.clientName : "";

  const taskPrefill = { title: messageTitle(message), description: message.text || "", caseNo, clientName };

  function eventPrefillFor(eventType) {
    return { title: messageTitle(message), eventType, caseNo, clientName, notes: message.text || "" };
  }

  function handleAddTask(data) {
    addTask(data);
    setModal(null);
    onClose();
  }

  return (
    <>
      {!modal && (
        <div className="message-context-menu" style={{ top: position.y, left: position.x }} ref={ref}>
          {MENU_ITEMS.map((item) => (
            <button type="button" key={item.key} onClick={() => setModal(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {modal === "task" && (
        <TaskModal
          open
          prefill={taskPrefill}
          onClose={() => {
            setModal(null);
            onClose();
          }}
          onSubmit={handleAddTask}
        />
      )}
      {modal && modal !== "task" && (
        <AddEventModal
          open
          initialKind="event"
          eventPrefill={eventPrefillFor(modal)}
          onClose={() => {
            setModal(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
