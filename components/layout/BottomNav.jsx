"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Calendar, ListChecks } from "lucide-react";
import { activeKeyForPath } from "./navItems";

// The handful of pages worth a thumb-reach on a phone — everything else
// lives in the Topbar's scrollable pill row instead (see MOBILE_PILL_ITEMS).
const LEFT_ITEMS = [
  { key: "cases", href: "/cases", icon: FolderKanban, label: "Cases" },
  { key: "calendar", href: "/calendar", icon: Calendar, label: "Calendar" },
];
const RIGHT_ITEMS = [{ key: "task", href: "/tasks", icon: ListChecks, label: "Tasks" }];

export default function BottomNav() {
  const pathname = usePathname();
  const activeKey = activeKeyForPath(pathname);

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {LEFT_ITEMS.map((item) => (
        <Link key={item.key} href={item.href} className={`bottom-nav-item${activeKey === item.key ? " active" : ""}`}>
          <item.icon size={20} strokeWidth={2} aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      ))}

      <Link href="/" className={`bottom-nav-dashboard${activeKey === "dashboard" ? " active" : ""}`}>
        <span className="bottom-nav-dashboard-badge">
          <LayoutDashboard size={18} strokeWidth={2} aria-hidden="true" />
        </span>
        <span>Dashboard</span>
      </Link>

      {RIGHT_ITEMS.map((item) => (
        <Link key={item.key} href={item.href} className={`bottom-nav-item${activeKey === item.key ? " active" : ""}`}>
          <item.icon size={20} strokeWidth={2} aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
