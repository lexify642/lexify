"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_PILL_ITEMS, activeKeyForPath } from "./navItems";
import { LOGO_URL } from "@/lib/brand";

export default function Topbar({ leftSlot, children }) {
  const pathname = usePathname();
  const activeKey = activeKeyForPath(pathname);

  return (
    <>
      <header className="topbar">
        <Link className="topbar-brand" href="/">
          <img className="brand-logo" src={LOGO_URL} alt="LEXIFY" />
          <span>LEXIFY</span>
        </Link>
        {leftSlot}
        <div className="top-actions">
          {children}
          <Link href="/admin" className="topbar-icon-btn" aria-label="Admin settings">
            ⚙
          </Link>
          <Link href="/login" className="btn btn-outline topbar-login-btn">
            Login
          </Link>
        </div>
      </header>
      <nav className="topbar-pills" aria-label="More">
        {MOBILE_PILL_ITEMS.map((item) => (
          <Link key={item.key} href={item.href} className={`topbar-pill${activeKey === item.key ? " active" : ""}`}>
            <span className="topbar-pill-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
