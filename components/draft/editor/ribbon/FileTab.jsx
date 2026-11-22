"use client";

import { useState } from "react";
import { FilePlus2, FolderOpen, Pencil, Save, FileUp, FileDown, FileText, Printer, History } from "lucide-react";
import { useDrafts } from "../../DraftsContext";
import RibbonMenu from "./RibbonMenu";
import TextFieldDialog from "../modals/TextFieldDialog";
import VersionHistoryPanel from "../modals/VersionHistoryPanel";
import { ImportDocxDialog } from "../modals/EditorDialogs";

function BigButton({ icon: Icon, label, onClick, disabled, title }) {
  return (
    <button type="button" className="ribbon-btn ribbon-btn-big" onClick={onClick} disabled={disabled} title={title || label}>
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function FileTab({ draft, ui }) {
  const { drafts, addDraft, setActiveDraftId, updateDraftMeta } = useDrafts();
  const [dialog, setDialog] = useState(null);

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <BigButton icon={FilePlus2} label="New" title="New blank draft" onClick={() => addDraft({ title: "Untitled Draft", type: "Draft" })} />
          <RibbonMenu label="Open a draft" text="Open" icon={FolderOpen} big panelClassName="ribbon-open-panel">
            <div className="ribbon-menu-section-label">Recent drafts</div>
            {drafts.map((d) => (
              <button key={d.id} type="button" className={`ribbon-menu-item${d.id === draft.id ? " active" : ""}`} onClick={() => setActiveDraftId(d.id)}>
                <FolderOpen size={14} aria-hidden="true" />
                <span className="ribbon-menu-item-text">{d.title}</span>
              </button>
            ))}
          </RibbonMenu>
          <BigButton icon={Pencil} label="Rename" onClick={() => setDialog("rename")} />
          <BigButton icon={Save} label="Save" title="Save a version now (Ctrl+S). Drafts also save automatically." onClick={() => ui.onSaveNow?.()} />
        </div>
        <div className="ribbon-group-label">Draft</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <BigButton icon={FileUp} label="Open .docx" title="Open a Word document as a new draft" onClick={() => setDialog("import")} />
        </div>
        <div className="ribbon-group-label">Import</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <BigButton icon={FileDown} label="Word (.docx)" onClick={() => ui.onExportDocx?.()} />
          <BigButton icon={FileText} label="PDF" onClick={() => ui.onExportPdf?.()} />
          <BigButton icon={Printer} label="Print" title="Print (Ctrl+P)" onClick={() => ui.onPrint?.()} />
        </div>
        <div className="ribbon-group-label">Export &amp; Print</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <BigButton icon={History} label="Versions" title="Version history" onClick={() => setDialog("versions")} />
          <div className="ribbon-file-info">
            <span>
              <b>{draft.versions.length}</b> version{draft.versions.length === 1 ? "" : "s"}
            </span>
            <span>Created {formatDate(draft.createdAt)}</span>
            <span>Last saved {formatDate(draft.updatedAt)}</span>
          </div>
        </div>
        <div className="ribbon-group-label">Info</div>
      </div>

      {dialog === "rename" && (
        <TextFieldDialog
          eyebrow="FILE"
          title="Rename draft"
          label="Title"
          initialValue={draft.title}
          submitLabel="Rename"
          onClose={() => setDialog(null)}
          onSubmit={(title) => {
            if (title.trim()) updateDraftMeta(draft.id, { title: title.trim() });
          }}
        />
      )}
      {dialog === "import" && <ImportDocxDialog onClose={() => setDialog(null)} onImport={(file) => ui.onImportDocx?.(file)} />}
      {dialog === "versions" && <VersionHistoryPanel draft={draft} onClose={() => setDialog(null)} />}
    </div>
  );
}
