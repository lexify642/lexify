// Default provider when AI_PROVIDER is unset or no matching API key is
// configured. Always signals "not available" so callers can mark analysis
// rows as pending/not-yet-generated instead of failing.
const name = "none";

async function generateCaseAnalysis() {
  const err = new Error("No AI provider configured (set AI_PROVIDER and the matching *_API_KEY in .env).");
  err.code = "AI_NOT_CONFIGURED";
  throw err;
}

module.exports = { name, generateCaseAnalysis };
