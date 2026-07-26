export default function Topbar({
  searchPlaceholder = "Search case, matter number, parties...",
  searchAriaLabel,
  leftSlot,
  children,
}) {
  return (
    <header className="topbar">
      {leftSlot}
      <div className="search">
        <span>⌕</span>
        <input aria-label={searchAriaLabel} placeholder={searchPlaceholder} />
      </div>
      <div className="top-actions">{children}</div>
    </header>
  );
}
