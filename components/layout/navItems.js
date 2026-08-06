// Shared between the desktop/tablet Sidebar and the mobile BottomNav/Topbar
// pill row so the navigations never drift out of sync with each other.
export const WORKSPACE_ITEMS = [
  { key: "cases", href: "/cases", icon: "▤", label: "Cases" },
  { key: "chat", href: "/chat", icon: "💬", label: "Communication" },
  { key: "case-research", href: "/case-research", icon: "⚖", label: "Case Research" },
  { key: "clients", href: "/clients", icon: "◈", label: "Clients" },
  { key: "documents", href: "/documents", icon: "▥", label: "Documents" },
  { key: "legal-drafts", href: "/legal-drafts", icon: "❐", label: "Legal Drafts" },
];

// Grouped under the sidebar's "Tools" dropdown instead of sitting as their
// own top-level buttons.
const TOOLS_ITEMS = [
  { key: "calendar", href: "/calendar", icon: "▣", label: "Calendar" },
  { key: "task", href: "/tasks", icon: "✓", label: "Task" },
  { key: "calculator", href: "/calculator", icon: "₹", label: "Fee Calculator" },
];

// Grouped under the sidebar's "Library" dropdown instead of sitting as their
// own top-level buttons.
const LIBRARY_ITEMS = [
  { key: "clauses", href: "/draft#clauses", icon: "§", label: "Clause Bank" },
  { key: "templates", href: "/draft#templates", icon: "▧", label: "Template Bank" },
];

// Collapsible sidebar groups — rendered generically by Sidebar.jsx so a new
// group is just a new entry here, not a new copy of the toggle/sublist JSX.
// Still surfaced as flat pills on mobile (see MOBILE_PILL_ITEMS below), since
// the pill row has no room for a dropdown.
export const NAV_GROUPS = [
  { key: "tools", label: "Tools", icon: "◫", items: TOOLS_ITEMS, activePaths: ["/calendar", "/appointments", "/tasks", "/calculator"] },
  { key: "library", label: "Library", icon: "▦", items: LIBRARY_ITEMS, activePaths: ["/draft"] },
];

export const SYSTEM_ITEMS = [{ key: "admin", href: "/admin", icon: "⚙", label: "Admin Panel" }];

export function activeKeyForPath(pathname) {
  if (pathname === "/") return "dashboard";
  if (pathname === "/cases") return "cases";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/appointments")) return "calendar";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/tasks")) return "task";
  if (pathname.startsWith("/calculator")) return "calculator";
  if (pathname.startsWith("/case-research")) return "case-research";
  if (pathname.startsWith("/clients")) return "clients";
  if (pathname.startsWith("/documents")) return "documents";
  if (pathname.startsWith("/legal-drafts")) return "legal-drafts";
  if (pathname === "/admin") return "admin";
  return null;
}

// Keys already covered by the mobile BottomNav's own buttons — everything
// else spills into the Topbar's scrollable pill row instead of behind a
// "More" button, so every page stays one tap away on a phone.
const BOTTOM_NAV_KEYS = ["dashboard", "cases", "calendar", "task"];

export const MOBILE_PILL_ITEMS = [
  ...WORKSPACE_ITEMS.filter((item) => !BOTTOM_NAV_KEYS.includes(item.key)),
  ...NAV_GROUPS.flatMap((group) => group.items).filter((item) => !BOTTOM_NAV_KEYS.includes(item.key)),
  ...SYSTEM_ITEMS,
];
