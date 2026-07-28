// The only file callers should import from lib/ai. Reads AI_PROVIDER (and the
// matching *_API_KEY) from the environment and returns the right provider
// module — no provider is ever hardcoded into a caller. Add a new provider by
// dropping a file in ./providers with the same { name, generateCaseAnalysis }
// shape and registering it below.
const providers = {
  openai: require("./providers/openai"),
  anthropic: require("./providers/anthropic"),
  gemini: require("./providers/gemini"),
  none: require("./providers/none"),
};

function getAiProvider() {
  const requested = (process.env.AI_PROVIDER || "").toLowerCase();
  if (requested && providers[requested]) {
    const keyEnvVar = `${requested.toUpperCase()}_API_KEY`;
    if (process.env[keyEnvVar]) {
      return providers[requested];
    }
  }
  return providers.none;
}

module.exports = { getAiProvider, providers };
