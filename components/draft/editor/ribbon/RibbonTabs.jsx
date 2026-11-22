"use client";

import { useState } from "react";
import { useEditorState } from "@tiptap/react";
import { Undo2, Redo2 } from "lucide-react";
import FileTab from "./FileTab";
import HomeTab from "./HomeTab";
import InsertTab from "./InsertTab";
import DesignTab from "./DesignTab";
import LayoutTab from "./LayoutTab";
import ReferencesTab from "./ReferencesTab";
import MailingsTab from "./MailingsTab";
import ReviewTab from "./ReviewTab";
import ViewTab from "./ViewTab";
import HelpTab from "./HelpTab";

// Word's ribbon, in Word's order. Each entry is a genuinely wired panel.
const TABS = [
  { key: "file", label: "File", Component: FileTab },
  { key: "home", label: "Home", Component: HomeTab },
  { key: "insert", label: "Insert", Component: InsertTab },
  { key: "design", label: "Design", Component: DesignTab },
  { key: "layout", label: "Layout", Component: LayoutTab },
  { key: "references", label: "References", Component: ReferencesTab },
  { key: "mailings", label: "Mailings", Component: MailingsTab },
  { key: "review", label: "Review", Component: ReviewTab },
  { key: "view", label: "View", Component: ViewTab },
  { key: "help", label: "Help", Component: HelpTab },
];

export default function RibbonTabs({ editor, draft, activePanel, onTogglePanel, zoom, onZoomChange, ui }) {
  const [activeTab, setActiveTab] = useState("home");
  const active = TABS.find((t) => t.key === activeTab) || TABS[0];
  const ActivePanel = active.Component;

  const historyState = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({ canUndo: ed.can().undo(), canRedo: ed.can().redo() }),
  });

  return (
    <div className="ribbon">
      <div className="ribbon-tabbar" role="tablist">
        <div className="ribbon-quick-access">
          <button
            type="button"
            className="ribbon-btn ribbon-btn-icon"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            disabled={!historyState.canUndo}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={14} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="ribbon-btn ribbon-btn-icon"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            disabled={!historyState.canRedo}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === activeTab}
            className={`ribbon-tab${tab.key === activeTab ? " active" : ""}${tab.key === "file" ? " ribbon-tab-file" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="ribbon-panel" role="tabpanel">
        <ActivePanel
          editor={editor}
          draft={draft}
          activePanel={activePanel}
          onTogglePanel={onTogglePanel}
          zoom={zoom}
          onZoomChange={onZoomChange}
          ui={ui}
          onSwitchTab={setActiveTab}
        />
      </div>
    </div>
  );
}
