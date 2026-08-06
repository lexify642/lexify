"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WORKSPACE_ITEMS, NAV_GROUPS, SYSTEM_ITEMS, activeKeyForPath } from "./navItems";
import { LOGO_URL } from "@/lib/brand";

// Desktop/tablet only — on mobile this is hidden entirely (see the
// max-width:768px rule in globals.css) in favor of BottomNav + the Topbar's
// pill row.
export default function Sidebar() {
  const pathname = usePathname();
  const activeKey = activeKeyForPath(pathname);
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(NAV_GROUPS.map((group) => [group.key, group.activePaths.some((p) => pathname.startsWith(p))]))
  );

  function toggleGroup(key) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <img className="brand-logo" src={LOGO_URL} alt="LEXIFY" />
        <span>LEXIFY</span>
      </Link>
      <div className="sidebar-scroll">
        <div className="nav-label">WORKSPACE</div>
        <ul className="nav-list">
          {WORKSPACE_ITEMS.map((item) => (
            <li key={item.key}>
              <Link className={item.key === activeKey ? "active" : ""} href={item.href}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          {NAV_GROUPS.map((group) => {
            const isOpen = openGroups[group.key];
            const isActive = group.activePaths.some((p) => pathname.startsWith(p));
            return (
              <li key={group.key}>
                <button
                  type="button"
                  className={`nav-group-toggle${isActive ? " active" : ""}`}
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={isOpen}
                >
                  <span className="nav-icon">{group.icon}</span>
                  <span>{group.label}</span>
                  <span className="nav-caret">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <ul className="nav-sublist">
                    {group.items.map((item) => (
                      <li key={item.key}>
                        <Link href={item.href}>
                          <span className="nav-icon">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <div className="nav-label">SYSTEM</div>
        <ul className="nav-list">
          {SYSTEM_ITEMS.map((item) => (
            <li key={item.key}>
              <Link className={item.key === activeKey ? "active" : ""} href={item.href}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
