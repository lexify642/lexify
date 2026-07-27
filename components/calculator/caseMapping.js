import { COURT_LEVELS } from "@/data/calculatorReference";

const CITY_TO_STATE = {
  Bombay: "Maharashtra",
  Mumbai: "Maharashtra",
  "New Delhi": "Delhi",
  Bengaluru: "Karnataka",
};

const FILING_TO_CATEGORY = {
  "Writ Petition": "Civil",
  "Commercial Civil Suit": "Commercial",
  "Criminal Revision Petition": "Criminal",
  "Company Petition": "Tribunal",
  "Arbitration Petition": "Arbitration",
};

const FILING_TO_JURISDICTION = {
  "Writ Petition": "Writ",
  "Criminal Revision Petition": "Revisional",
  "Company Petition": "Original",
  "Arbitration Petition": "Original",
  "Commercial Civil Suit": "Original",
};

const COURT_TO_LEVEL = {
  "High Court": "High Court",
  "Supreme Court": "Supreme Court",
  NCLT: "NCLT / NCLAT",
};

// Derives a partial calculator input from a data/cases.js case object when the
// advocate links an existing matter to the calculator.
export function inferInputsFromCase(caseObj) {
  if (!caseObj) return {};
  const courtLevel = COURT_TO_LEVEL[caseObj.court] || (COURT_LEVELS.includes(caseObj.court) ? caseObj.court : "District Court");
  return {
    linkedCaseNo: caseObj.no,
    currentStageLabel: caseObj.stage || null,
    natureOfProceeding: caseObj.filing || "Money Recovery",
    caseCategory: FILING_TO_CATEGORY[caseObj.filing] || "Civil",
    state: CITY_TO_STATE[caseObj.city] || "Maharashtra",
    district: caseObj.city || "Mumbai",
    court: `${caseObj.court}, ${caseObj.city}`,
    courtLevel,
    jurisdiction: FILING_TO_JURISDICTION[caseObj.filing] || "Original",
  };
}
