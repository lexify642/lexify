const { buildAnalysisPrompt, parseAnalysisJson } = require("../prompt");

const name = "anthropic";

async function generateCaseAnalysis(caseRecord) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error("ANTHROPIC_API_KEY is not set.");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{ role: "user", content: buildAnalysisPrompt(caseRecord) }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  const text = body.content?.[0]?.text;
  if (!text) throw new Error("Anthropic response had no content.");
  return parseAnalysisJson(text);
}

module.exports = { name, generateCaseAnalysis };
