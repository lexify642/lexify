"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WORKSPACE_ITEMS = [
  { key: "dashboard", href: "/", icon: "▦", label: "Dashboard" },
  { key: "cases", href: "/cases", icon: "▤", label: "Cases" },
  { key: "calendar", href: "/calendar", icon: "▣", label: "Calendar" },
  { key: "task", href: "/cases", icon: "✓", label: "Task" },
  { key: "calculator", href: "/calculator", icon: "₹", label: "Fee Calculator" },
  { key: "case-research", href: "/case-research", icon: "⚖", label: "Case Research" },
  { key: "clients", href: "/clients", icon: "◈", label: "Clients" },
  { key: "legal-drafts", href: "/legal-drafts", icon: "❐", label: "Legal Drafts" },
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
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/appointments")) return "calendar";
  if (pathname === "/lexi-ai") return "research";
  if (pathname.startsWith("/calculator")) return "calculator";
  if (pathname.startsWith("/case-research")) return "case-research";
  if (pathname.startsWith("/clients")) return "clients";
  if (pathname.startsWith("/legal-drafts")) return "legal-drafts";
  if (pathname === "/admin") return "admin";
  return null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const activeKey = activeKeyForPath(pathname);

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <i className="brand-mark">L</i>
        <span>LEXIFY</span>
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
