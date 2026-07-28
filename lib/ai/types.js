// The provider-agnostic contract every AI backend implements. No provider is
// ever imported directly by callers — always go through lib/ai/index.js's
// getAiProvider(), so switching/adding a model is a config change, not a code
// change (see AI_PROVIDER in .env.example).
//
// @typedef {object} AnalysisResult
// @property {string} summary
// @property {string} facts
// @property {string} issues
// @property {string} argumentsPetitioner
// @property {string} argumentsRespondent
// @property {string} decision
// @property {string} ratioDecidendi
// @property {string} obiterDicta
// @property {string[]} keyTakeaways
// @property {{ paragraphNumber: number|null, text: string }[]} importantParagraphs
// @property {string[]} aiKeywords
// @property {number} readingTimeMinutes
//
// @typedef {object} AiProvider
// @property {string} name
// @property {(caseRecord: object) => Promise<AnalysisResult>} generateCaseAnalysis

module.exports = {};
