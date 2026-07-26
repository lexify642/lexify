"use client";

import { useEffect, useState } from "react";

export function useDraftView() {
  const [view, setView] = useState("draft");

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.slice(1);
      setView(["clauses", "templates", "generator"].includes(hash) ? hash : "draft");
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return view;
}
