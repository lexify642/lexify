"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { initialCases, TODAY } from "@/data/cases";
import { displayDate, toneForStage } from "./utils";
import CaseDrawer from "./CaseDrawer";
import CaseModal from "./CaseModal";

function getInitialValues(type, index, current) {
  if (index === null || index === undefined) return null;
  if (type === "client") return current?.client ?? null;
  if (type === "note") return { date: "", text: current.notes[index][1] };
  if (type === "task")
    return { due: current.tasks[index][0], text: current.tasks[index][1], priority: current.tasks[index][2] };
  if (type === "document") return { name: current.docs[index] };
  if (type === "case") return current;
  return null;
}

export default function CaseDiary() {
  const [cases, setCases] = useState(initialCases);
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCaseNo, setSelectedCaseNo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState({ message: "", visible: false });
  const toastTimer = useRef(null);

  const current = useMemo(() => cases.find((c) => c.no === selectedCaseNo) ?? null, [cases, selectedCaseNo]);

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
        setModal(null);
        setDrawerOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  function showToast(message) {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }

  function openDrawer(no) {
    setSelectedCaseNo(no);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function openModal(type, index = null) {
    setModal({ type, index });
  }

  function closeModal() {
    setModal(null);
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

  function handleModalSubmit(data) {
    const { type, index } = modal;

    if (type === "case" && index === null) {
      setCases((prev) => [
        ...prev,
        {
          no: String(prev.length + 1).padStart(2, "0"),
          ...data,
          tone: toneForStage(data.stage),
          activity: "Case created",
          history: [],
          notes: [],
          tasks: [],
          docs: [],
          client: null,
        },
      ]);
      closeModal();
      showToast("Changes saved.");
      return;
    }

    setCases((prev) =>
      prev.map((c) => {
        if (c.no !== selectedCaseNo) return c;
        switch (type) {
          case "case":
            return { ...c, ...data, tone: toneForStage(data.stage), activity: "Case details updated" };
          case "client":
            return { ...c, client: data };
          case "note": {
            const entry = [data.date ? displayDate(data.date) : "Today", data.text];
            return {
              ...c,
              notes: index === null ? [entry, ...c.notes] : c.notes.map((n, i) => (i === index ? entry : n)),
            };
          }
          case "task": {
            const entry = [data.due, data.text, data.priority];
            return {
              ...c,
              tasks: index === null ? [...c.tasks, entry] : c.tasks.map((t, i) => (i === index ? entry : t)),
            };
          }
          case "document": {
            const name = data.file?.name || data.name;
            return {
              ...c,
              docs: index === null ? [...c.docs, name] : c.docs.map((d, i) => (i === index ? name : d)),
            };
          }
          default:
            return c;
        }
      })
    );
    closeModal();
    showToast("Changes saved.");
  }

  function handleDelete(type, index) {
    if (!window.confirm(`Delete this ${type}?`)) return;
    if (type === "case") {
      setCases((prev) => prev.filter((c) => c.no !== selectedCaseNo));
      setDrawerOpen(false);
      setSelectedCaseNo(null);
    } else {
      setCases((prev) =>
        prev.map((c) => {
          if (c.no !== selectedCaseNo) return c;
          if (type === "client") return { ...c, client: null };
          if (type === "note") return { ...c, notes: c.notes.filter((_, i) => i !== index) };
          if (type === "task") return { ...c, tasks: c.tasks.filter((_, i) => i !== index) };
          if (type === "document") return { ...c, docs: c.docs.filter((_, i) => i !== index) };
          return c;
        })
      );
    }
    showToast(`${type} deleted.`);
  }

  function handleRecordHearing() {
    const date = window.prompt("Hearing date (for example, 22 Jul 2026):");
    const outcome = date && window.prompt("What happened on this date?");
    if (!outcome) return;
    setCases((prev) =>
      prev.map((c) =>
        c.no === selectedCaseNo ? { ...c, history: [[date, "Hearing outcome", outcome], ...c.history] } : c
      )
    );
  }

  function handleViewDocument(name) {
    window.alert(`Previewing ${name}\n\nIn a connected application, the selected file opens in the document viewer.`);
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
        onRecordHearing={handleRecordHearing}
        onViewDocument={handleViewDocument}
      />

      <CaseModal
        modal={modal}
        initialValues={modal ? getInitialValues(modal.type, modal.index, current) : null}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />

      <div className={`toast${toast.visible ? " show" : ""}`} role="status">
        {toast.message}
      </div>
    </div>
  );
}
