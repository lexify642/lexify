"use client";

export default function AlertsBanner({ alerts, dismissedIds, onDismiss }) {
  const visible = alerts.filter((a) => !dismissedIds.includes(a.id));
  if (!visible.length) return null;

  return (
    <div className="alert-list">
      {visible.map((alert) => (
        <div className={`alert-item ${alert.severity}`} key={alert.id}>
          <span>{alert.message}</span>
          <button type="button" onClick={() => onDismiss(alert.id)} aria-label="Dismiss alert">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
