"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SidebarContext = createContext(null);

// Drives the mobile hamburger + slide-out drawer. Desktop/tablet sidebar
// rendering is unaffected — this only matters below the mobile breakpoint.
export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeydown(event) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [mobileOpen]);

  const value = {
    mobileOpen,
    open: () => setMobileOpen(true),
    close: () => setMobileOpen(false),
    toggle: () => setMobileOpen((prev) => !prev),
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebarNav() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebarNav must be used within a SidebarProvider");
  return ctx;
}
