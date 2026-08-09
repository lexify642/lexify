"use client";

import { useEffect, useState } from "react";

// Scoped to the Template Bank page only, now that Draft Editor/Clause Bank/
// Template Bank are separate pages — the only sub-view left to distinguish
// is the Partnership Deed generator, reached via "Use draft →".
export function useDraftView() {
  const [view, setView] = useState("templates");

  useEffect(() => {
    function syncFromHash() {
      setView(window.location.hash.slice(1) === "generator" ? "generator" : "templates");
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return view;
}
