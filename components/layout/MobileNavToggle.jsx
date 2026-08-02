"use client";

import { Menu } from "lucide-react";
import { useSidebarNav } from "./SidebarContext";

// Only visible below the mobile breakpoint (see .mobile-nav-toggle in
// globals.css) — costs nothing on desktop/tablet, where the sidebar stays
// exactly as it was.
export default function MobileNavToggle() {
  const { open } = useSidebarNav();
  return (
    <button type="button" className="mobile-nav-toggle" onClick={open} aria-label="Open navigation menu">
      <Menu size={20} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
