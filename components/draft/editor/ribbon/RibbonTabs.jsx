"use client";

import { useState } from "react";
import HomeTab from "./HomeTab";
import InsertTab from "./InsertTab";
import DesignTab from "./DesignTab";
import LayoutTab from "./LayoutTab";
import ReferencesTab from "./ReferencesTab";
import MailingsTab from "./MailingsTab";
import ReviewTab from "./ReviewTab";
import ViewTab from "./ViewTab";

// Each entry is a genuinely wired tab panel — a tab only appears here once
// its controls are real. New tabs are added as they're built rather than
// showing an empty/placeholder panel for work not done yet.
const TABS = [
  { key: "home", label: "Home", Component: HomeTab },
  { key: "insert", label: "Insert", Component: InsertTab },
  { key: "design", label: "Design", Component: DesignTab },
  { key: "layout", label: "Layout", Component: LayoutTab },
  { key: "references", label: "References", Component: ReferencesTab },
  { key: "mailings", label: "Mailings", Component: MailingsTab },
  { key: "review", label: "Review", Component: ReviewTab },
  { key: "view", label: "View", Component: ViewTab },
];

export default function RibbonTabs({ editor, draft, activePanel, onTogglePanel, zoom, onZoomChange }) {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const active = TABS.find((t) => t.key === activeTab) || TABS[0];
  const ActivePanel = active.Component;

  return (
    <div className="ribbon">
      <div className="ribbon-tabbar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === activeTab}
            className={`ribbon-tab${tab.key === activeTab ? " active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="ribbon-panel" role="tabpanel">
        <ActivePanel editor={editor} draft={draft} activePanel={activePanel} onTogglePanel={onTogglePanel} zoom={zoom} onZoomChange={onZoomChange} />
      </div>
    </div>
  );
}
