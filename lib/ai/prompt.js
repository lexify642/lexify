// Shared prompt builder used by every provider, so the JSON output contract
// (and therefore the parsing logic) stays identical regardless of which
// model answers it.
function buildAnalysisPrompt(caseRecord) {
  const judges = caseRecord.coramMembersText || caseRecord.presidingJudge || "Not recorded";
  return `You are a legal research assistant analysing an Indian court judgment. Read the judgment text below and respond with ONLY a single JSON object (no markdown, no commentary) with exactly these keys:

{
  "summary": "concise summary in plain legal language",
  "facts": "material facts of the case",
  "issues": "legal issues before the court",
  "argumentsPetitioner": "the petitioner/appellant's arguments",
  "argumentsRespondent": "the respondent's arguments",
  "decision": "final decision and relief granted",
  "ratioDecidendi": "the core binding legal principle",
  "obiterDicta": "non-binding observations, or an empty string if none",
  "keyTakeaways": ["short bullet point", "short bullet point"],
  "importantParagraphs": [{"paragraphNumber": 12, "text": "the significant passage"}],
  "aiKeywords": ["searchable", "legal", "keywords"],
  "readingTimeMinutes": 4
}

Case: ${caseRecord.caseTitle}
Court: ${caseRecord.courtName}
Judge(s): ${judges}
Decision date: ${caseRecord.decisionDate ? new Date(caseRecord.decisionDate).toISOString().slice(0, 10) : "unknown"}

Judgment text:
"""
${caseRecord.fullJudgmentText}
"""`;
}

function parseAnalysisJson(rawText) {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const json = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  return {
    summary: json.summary || "",
    facts: json.facts || "",
    issues: json.issues || "",
    argumentsPetitioner: json.argumentsPetitioner || "",
    argumentsRespondent: json.argumentsRespondent || "",
    decision: json.decision || "",
    ratioDecidendi: json.ratioDecidendi || "",
    obiterDicta: json.obiterDicta || "",
    keyTakeaways: Array.isArray(json.keyTakeaways) ? json.keyTakeaways : [],
    importantParagraphs: Array.isArray(json.importantParagraphs) ? json.importantParagraphs : [],
    aiKeywords: Array.isArray(json.aiKeywords) ? json.aiKeywords : [],
    readingTimeMinutes: Number.isFinite(json.readingTimeMinutes) ? json.readingTimeMinutes : null,
  };
}

module.exports = { buildAnalysisPrompt, parseAnalysisJson };
