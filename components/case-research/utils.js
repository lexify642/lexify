export function toneForDisposition(disposition) {
  const text = (disposition || "").toLowerCase();
  if (text.includes("allow") || text.includes("grant")) return "green";
  if (text.includes("dismiss") || text.includes("reject")) return "red";
  if (text.includes("dispos")) return "blue";
  return "orange";
}

export function displayDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function estimateReadingTime(text) {
  if (!text) return null;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
