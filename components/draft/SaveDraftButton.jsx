"use client";

import { useState } from "react";

export default function SaveDraftButton({ className = "btn", children = "Save draft" }) {
  const [saved, setSaved] = useState(false);

  const handleClick = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {saved ? "Saved ✓" : children}
    </button>
  );
}
