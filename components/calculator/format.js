// Shared "who/what this estimate is for" line shown under the page title on
// every wizard step — prefers the linked case, then falls back to whatever
// the client stated manually on the Client & Matter step.
export function describeMatter({ linkedCase, clientName, manualMatterTitle }) {
  if (linkedCase) return `${linkedCase.parties} · ${linkedCase.number}`;
  if (clientName && manualMatterTitle) return `${clientName} · ${manualMatterTitle}`;
  if (clientName) return `For ${clientName}`;
  return "Estimate filing fees and common litigation expenses for your matter.";
}

export function formatInr(amount) {
  const n = Number(amount) || 0;
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
