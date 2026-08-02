import NotificationBell from "@/components/tasks/NotificationBell";
import MobileNavToggle from "./MobileNavToggle";

export default function Topbar({
  searchPlaceholder = "Search case, matter number, parties...",
  searchAriaLabel,
  leftSlot,
  children,
}) {
  return (
    <header className="topbar">
      <MobileNavToggle />
      {leftSlot}
      <div className="search">
        <span>⌕</span>
        <input aria-label={searchAriaLabel} placeholder={searchPlaceholder} />
      </div>
      <div className="top-actions">
        <NotificationBell />
        {children}
      </div>
    </header>
  );
}
