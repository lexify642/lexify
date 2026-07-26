"use client";

import { useDraftView } from "./useDraftView";

export default function GoBackButton() {
  const view = useDraftView();

  if (view !== "generator") return null;

  return (
    <button
      className="btn btn-outline"
      onClick={() => {
        window.location.hash = "#templates";
      }}
    >
      ← Go Back
    </button>
  );
}
