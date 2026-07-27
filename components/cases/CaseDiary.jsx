"use client";

import { useEffect, useMemo, useState } from "react";
import { TODAY } from "@/data/cases";
import { useCases } from "./CasesContext";
import { useCaseActions } from "./useCaseActions";
import { displayDate } from "./utils";
import CaseDrawer from "./CaseDrawer";
import CaseModal from "./CaseModal";
import EditCaseModal from "./EditCaseModal";

export default function CaseDiary() {
  const { cases } = useCases();
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCaseNo, setSelectedCaseNo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
  } = useCaseActions(selectedCaseNo);

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cases.filter(
      (c) =>
        (!selectedDate || c.date === selectedDate) &&
        `${c.number} ${c.court} ${c.city} ${c.parties}`.toLowerCase().includes(term)
    );
  }, [cases, selectedDate, search]);

  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") {
        closeModal();
        setDrawerOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openDrawer(no) {
    setSelectedCaseNo(no);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function handleDateNav(kind) {
    if (kind === "today") {
      setSelectedDate(TODAY);
      return;
    }
    const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date(`${TODAY}T00:00:00`);
    base.setDate(base.getDate() + (kind === "previous" ? -1 : 1));
    setSelectedDate(base.toISOString().slice(0, 10));
  }

  const summaryText = selectedDate
    ? `Showing ${filteredCases.length} active case${filteredCases.length === 1 ? "" : "s"} scheduled for ${displayDate(
        selectedDate
      )}.`
    : "Showing all active cases across all courts.";

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Case Diary</h1>
          <p className="page-subtitle">Your daily court schedule and matter activity.</p>
        </div>
        <button className="btn" onClick={() => openModal("case")}>
          + Add Case
        </button>
      </div>

      <div className="diary-datebar">
        <div className="date-nav">
          <button onClick={() => handleDateNav("previous")}>← Previous Day</button>
          <button className="active" onClick={() => handleDateNav("today")}>
            Today · 21 Jul 2026
          </button>
          <button onClick={() => handleDateNav("tomorrow")}>Tomorrow →</button>
        </div>
        <label className="date-picker">
          <span>▣</span>
          <input
            id="diary-date"
            type="date"
            aria-label="Filter cases by date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          <b>Pick a date</b>
        </label>
        {selectedDate && (
          <button className="clear-date" onClick={() => setSelectedDate("")}>
            Clear date ×
          </button>
        )}
      </div>

      <p className="diary-summary">{summaryText}</p>

      <div className="filter-row">
        <div className="search">
          <span>⌕</span>
          <input
            id="diary-search"
            placeholder="Search in case diary..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button className="btn btn-outline">⚙ Filters</button>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table className="data-table case-diary-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Case Number</th>
                <th>Court</th>
                <th>Parties</th>
                <th>Next Date</th>
                <th>Stage</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr className="case-row" tabIndex={0} key={c.no} onClick={() => openDrawer(c.no)}>
                  <td>{c.no}</td>
                  <td>
                    <strong>{c.number}</strong>
                    <br />
                    <small>View analytics →</small>
                  </td>
                  <td>
                    <strong>{c.court}</strong>
                    <br />
                    <small>{c.city}</small>
                  </td>
                  <td>
                    <strong>{c.parties}</strong>
                  </td>
                  <td>
                    {displayDate(c.date)}
                    <br />
                    <small>{c.time}</small>
                  </td>
                  <td>
                    <span className={`badge ${c.tone}`}>{c.stage}</span>
                  </td>
                  <td>{c.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredCases.length && (
          <div className="no-cases">
            <b>No hearings scheduled</b>
            <span>Try a different date or clear the date filter to view all active cases.</span>
          </div>
        )}
      </section>

      <CaseDrawer
        caseData={current}
        open={drawerOpen}
        onClose={closeDrawer}
        onEdit={openModal}
        onDelete={handleDelete}
        onAdd={openModal}
        onViewDocument={handleViewDocument}
        onEditCase={openEditCase}
      />

      <CaseModal modal={modal} initialValues={initialValues} onClose={closeModal} onSubmit={handleModalSubmit} />

      <EditCaseModal open={editCaseOpen} caseData={current} onClose={closeEditCase} onSave={handleSaveCaseDetails} />

      <div className={`toast${toast.visible ? " show" : ""}`} role="status">
        {toast.message}
      </div>
    </div>
  );
}
