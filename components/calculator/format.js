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
