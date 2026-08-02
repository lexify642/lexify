"use client";

import { useEffect, useRef, useState } from "react";

function caseLabel(c) {
  return `${c.number} – ${c.parties} – ${c.court}`;
}

// Type-to-filter combobox over the Case Diary's cases, formatted as
// "Case Number – Case Title – Court" per the Add Event spec. Controlled
// (value/onChange) so it can be driven by the parent's caseNo state.
export default function CaseSearchSelect({ cases, value, onChange, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = cases.find((c) => c.no === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const term = query.trim().toLowerCase();
  const filtered = term ? cases.filter((c) => caseLabel(c).toLowerCase().includes(term)) : cases;

  function handleSelect(c) {
    onChange(c.no);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="case-search-select" ref={containerRef}>
      <input
        type="text"
        autoComplete="off"
        placeholder={placeholder || "Search by case number, parties, or court..."}
        value={open ? query : selected ? caseLabel(selected) : ""}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
      />
      {open && (
        <div className="case-search-dropdown">
          {filtered.length ? (
            filtered.map((c) => (
              <button type="button" key={c.no} className="case-search-option" onClick={() => handleSelect(c)}>
                <strong>{c.number}</strong> – {c.parties} – {c.court}
              </button>
            ))
          ) : (
            <div className="case-search-empty">No matching cases.</div>
          )}
        </div>
      )}
    </div>
  );
}
