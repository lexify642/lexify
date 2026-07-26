"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WORKSPACE_ITEMS = [
  { key: "dashboard", href: "/", icon: "▦", label: "Dashboard" },
  { key: "cases", href: "/cases", icon: "▤", label: "Cases" },
  { key: "task", href: "/cases", icon: "✓", label: "Task" },
  { key: "analytics", href: "/#analytics", icon: "◔", label: "Analytics" },
  { key: "research", href: "/lexi-ai", icon: "⌕", label: "Research" },
  { key: "clauses", href: "/draft#clauses", icon: "§", label: "Clause Bank" },
  { key: "templates", href: "/draft#templates", icon: "▧", label: "Template Bank" },
];

const SYSTEM_ITEMS = [
  { key: "admin", href: "/admin", icon: "⚙", label: "Admin Panel" },
  { key: "settings", href: "/admin", icon: "⚙", label: "Settings" },
];

function activeKeyForPath(pathname) {
  if (pathname === "/") return "dashboard";
  if (pathname === "/cases") return "cases";
  if (pathname === "/lexi-ai") return "research";
  if (pathname === "/admin") return "admin";
  return null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const activeKey = activeKeyForPath(pathname);

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <i className="brand-mark">C</i>
        <span>CASEFLOW</span>
      </Link>
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
      <div className="sidebar-footer">
        <strong>John Anderson</strong>
        Administrator
      </div>
    </aside>
  );
}
