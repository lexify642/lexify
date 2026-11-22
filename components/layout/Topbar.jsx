"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_PILL_ITEMS, activeKeyForPath } from "./navItems";
import { LOGO_URL } from "@/lib/brand";
import { useCurrentUser, useSignOut } from "@/components/auth/AuthProvider";

export default function Topbar({ leftSlot, children }) {
  const pathname = usePathname();
  const activeKey = activeKeyForPath(pathname);
  const currentUser = useCurrentUser();
  const signOut = useSignOut();

  return (
    <>
      <header className="topbar">
        <Link className="topbar-brand" href="/">
          <img className="brand-logo" src={LOGO_URL} alt="LEXIFYI" />
          <span>LEXIFYI</span>
        </Link>
        {leftSlot}
        <div className="top-actions">
          {children}
          <span className="topbar-user-name">{currentUser.name}</span>
          <button type="button" className="btn btn-outline topbar-login-btn" onClick={signOut}>
            Logout
          </button>
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
