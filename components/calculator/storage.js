// localStorage-backed persistence for saved estimates and the audit log.
// This is a client-side demo substitute for a database — see the calculator's
// Save/Export feasibility notes. All access is guarded for SSR and never runs
// during render, only from effects/handlers.
const HISTORY_KEY = "caseflow.calc.history.v1";
const AUDIT_KEY = "caseflow.calc.auditLog.v1";
const MAX_HISTORY_PER_CASE = 50;
const MAX_AUDIT_ENTRIES = 200;

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable/full — fail silently, the UI keeps working in-memory
  }
}

const UNLINKED_KEY = "__unlinked__";

export function getEstimateHistory(caseNo) {
  const all = readJson(HISTORY_KEY, {});
  return all[caseNo || UNLINKED_KEY] || [];
}

export function getAllEstimateHistory() {
  return readJson(HISTORY_KEY, {});
}

export function saveEstimateSnapshot(caseNo, snapshot) {
  const all = readJson(HISTORY_KEY, {});
  const key = caseNo || UNLINKED_KEY;
  const entry = { id: `EST-${Date.now()}`, savedAt: new Date().toISOString(), ...snapshot };
  const existing = all[key] || [];
  const updated = [entry, ...existing].slice(0, MAX_HISTORY_PER_CASE);
  all[key] = updated;
  writeJson(HISTORY_KEY, all);
  return updated;
}

export function getAuditLog() {
  return readJson(AUDIT_KEY, []);
}

export function appendAuditEvent(event) {
  const existing = readJson(AUDIT_KEY, []);
  const entry = { id: `AUD-${Date.now()}-${Math.round(Math.random() * 1000)}`, timestamp: new Date().toISOString(), user: "John Anderson", ...event };
  const updated = [entry, ...existing].slice(0, MAX_AUDIT_ENTRIES);
  writeJson(AUDIT_KEY, updated);
  return updated;
}
