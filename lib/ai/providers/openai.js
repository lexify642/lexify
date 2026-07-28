const { buildAnalysisPrompt, parseAnalysisJson } = require("../prompt");

const name = "openai";

async function generateCaseAnalysis(caseRecord) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY is not set.");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildAnalysisPrompt(caseRecord) }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  const text = body.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI response had no content.");
  return parseAnalysisJson(text);
}

module.exports = { name, generateCaseAnalysis };
