"use client";

import CaseOverview from "./CaseOverview";

export default function CaseDrawer({
  caseData,
  open,
  onClose,
  onEdit,
  onDelete,
  onAdd,
  onViewDocument,
  onEditCase,
  onAdvanceTaskStatus,
}) {
  return (
    <>
      <div className={`drawer-backdrop${open ? " show" : ""}`} onClick={onClose} />
      <aside className={`case-drawer${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">CASE ANALYTICS</p>
            <h2>{caseData?.parties ?? "Case details"}</h2>
            <span>{caseData ? `${caseData.number} · Active matter` : ""}</span>
          </div>
          <button className="drawer-close" aria-label="Close case panel" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="drawer-content">
          <CaseOverview
            caseData={caseData}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDocument={onViewDocument}
            onEditCase={onEditCase}
            onAdvanceTaskStatus={onAdvanceTaskStatus}
          />
        </div>
      </aside>
    </>
  );
}
