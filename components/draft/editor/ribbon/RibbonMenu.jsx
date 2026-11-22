"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// A small, reusable button + popover — every dropdown control in this
// ribbon (Change Case, Text Effects, colors, Shading, Sort, Styles, Bullets,
// Numbering, Multilevel, Borders) is one of these, closing on outside click
// or Escape. Pass `text` for a label-style trigger (Styles, Paste), or
// `chevronOnly` for a bare arrow sliver attached to a separate split button
// (Font Color / Highlight / Bullets / Numbering's main-click icon). The
// panel renders `position:fixed` at a rect measured from the trigger
// button, rather than relying on normal absolute-in-flow positioning —
// .ribbon-panel (the ribbon's own horizontal-scroll container) computes an
// effective overflow:auto on both axes once overflow-x is set, which would
// otherwise clip any dropdown extending below the ribbon.
export default function RibbonMenu({ label, icon: Icon, text, chevronOnly, big, active, disabled, triggerClassName, panelClassName, children }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (btnRef.current?.contains(event.target)) return;
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  }

  const modeClass = big ? " ribbon-btn-big" : chevronOnly ? " ribbon-btn-menu-chevron" : text ? " ribbon-btn-menu-text" : " ribbon-btn-icon";

  return (
    <div className="ribbon-menu">
      <button
        ref={btnRef}
        type="button"
        className={`ribbon-btn ribbon-btn-menu${modeClass}${active ? " active" : ""}${triggerClassName ? ` ${triggerClassName}` : ""}`}
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggleOpen}
      >
        {big ? (
          <>
            {Icon && <Icon size={20} strokeWidth={1.75} aria-hidden="true" />}
            <span>{text || label}</span>
          </>
        ) : (
          !chevronOnly && (text ? <span className="ribbon-btn-menu-label">{text}</span> : Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />)
        )}
        <ChevronDown size={9} strokeWidth={3} className="ribbon-chevron" aria-hidden="true" />
      </button>
      {open && coords && (
        <div
          ref={panelRef}
          className={`ribbon-menu-panel ${panelClassName || ""}`}
          role="menu"
          style={{ top: coords.top, left: coords.left }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
