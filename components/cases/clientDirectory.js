// Pure logic for the Client & Matter CRM: aggregating clients from the case
// list, and a heuristic conflict-of-interest check. This is a metadata match
// (case-insensitive exact/substring across client name, both sides of the
// "X vs. Y" parties string, and opposing counsel) — the same honest-heuristic
// approach already used for "Related Cases" in the Case Research module, not
// a legal-grade conflicts system.

const SPLIT_PATTERN = /\s+(?:vs?\.?|versus)\s+/i;

export function splitParties(partiesStr) {
  if (!partiesStr) return [null, null];
  const parts = partiesStr.split(SPLIT_PATTERN);
  if (parts.length !== 2) return [partiesStr.trim(), null];
  return [parts[0].trim(), parts[1].replace(/\.$/, "").trim()];
}

export function buildClientDirectory(cases) {
  const byName = new Map();
  cases.forEach((c) => {
    if (!c.client?.name) return;
    const key = c.client.name.trim().toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, { name: c.client.name, phone: c.client.phone, address: c.client.address, matters: [] });
    }
    byName.get(key).matters.push({
      caseNo: c.no,
      number: c.number,
      parties: c.parties,
      court: c.court,
      stage: c.stage,
      tone: c.tone,
    });
  });
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function normalize(value) {
  return (value || "").trim().toLowerCase();
}

function namesMatch(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function checkConflicts(name, cases) {
  const query = normalize(name);
  if (query.length < 3) return [];

  const matches = [];
  cases.forEach((c) => {
    const [sideA, sideB] = splitParties(c.parties);
    const candidates = [
      c.client?.name && { value: c.client.name, matchedAs: "Client" },
      sideA && { value: sideA, matchedAs: "Party" },
      sideB && { value: sideB, matchedAs: "Party" },
      c.caseDetails?.opposingCounsel && { value: c.caseDetails.opposingCounsel, matchedAs: "Opposing Counsel" },
    ].filter(Boolean);

    candidates.forEach(({ value, matchedAs }) => {
      if (namesMatch(name, value)) {
        matches.push({ caseNo: c.no, number: c.number, parties: c.parties, matchedAs, matchedName: value });
      }
    });
  });

  const seen = new Set();
  return matches.filter((m) => {
    const key = `${m.caseNo}|${m.matchedAs}|${m.matchedName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
