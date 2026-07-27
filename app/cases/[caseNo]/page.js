"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import CaseModal from "@/components/cases/CaseModal";
import EditCaseModal from "@/components/cases/EditCaseModal";
import CaseOverview from "@/components/cases/CaseOverview";
import { useCaseActions } from "@/components/cases/useCaseActions";

export default function CaseDetailsPage() {
  const { caseNo } = useParams();
  const {
    current,
    modal,
    openModal,
    closeModal,
    initialValues,
    handleModalSubmit,
    handleDelete,
    handleViewDocument,
    editCaseOpen,
    openEditCase,
    closeEditCase,
    handleSaveCaseDetails,
    toast,
  } = useCaseActions(caseNo);

  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <div className="page">
        <div className="heading-row">
          <div>
            <p className="eyebrow">CASE DETAILS</p>
            <h1 className="page-title">{current?.parties ?? "Case not found"}</h1>
            <p className="page-subtitle">{current ? `${current.number} · ${current.filing}` : ""}</p>
          </div>
          <Link className="btn btn-outline" href="/cases">
            ← Back to Case Diary
          </Link>
        </div>

        {current ? (
          <section className="card">
            <CaseOverview
              caseData={current}
              onAdd={openModal}
              onEdit={openModal}
              onDelete={handleDelete}
              onViewDocument={handleViewDocument}
              onEditCase={openEditCase}
              showCaseDetailsLink={false}
            />
          </section>
        ) : (
          <div className="empty-inline">No case found for number {caseNo}.</div>
        )}
      </div>

      <CaseModal modal={modal} initialValues={initialValues} onClose={closeModal} onSubmit={handleModalSubmit} />

      <EditCaseModal open={editCaseOpen} caseData={current} onClose={closeEditCase} onSave={handleSaveCaseDetails} />

      <div className={`toast${toast.visible ? " show" : ""}`} role="status">
        {toast.message}
      </div>
    </AppShell>
  );
}
