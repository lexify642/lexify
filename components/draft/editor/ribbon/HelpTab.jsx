"use client";

import { useState } from "react";
import { Keyboard, CircleHelp } from "lucide-react";
import { ShortcutsDialog } from "../modals/EditorDialogs";

const TIPS = [
  "Drafts save automatically a moment after you stop typing; Ctrl+S saves a version straight away.",
  "Drag the grey ends of the rulers to change the margins.",
  "Review → Track Changes records edits as suggestions others can accept or reject.",
  "Ctrl+Enter starts a new page.",
  "File → Open .docx brings in a Word document as a new draft.",
];

export default function HelpTab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn ribbon-btn-big" onClick={() => setOpen(true)}>
            <Keyboard size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Shortcuts</span>
          </button>
        </div>
        <div className="ribbon-group-label">Help</div>
      </div>
      <div className="ribbon-group ribbon-group-grow">
        <div className="ribbon-group-body ribbon-help-tips">
          <CircleHelp size={16} aria-hidden="true" />
          <ul>
            {TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="ribbon-group-label">Tips</div>
      </div>
      {open && <ShortcutsDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
