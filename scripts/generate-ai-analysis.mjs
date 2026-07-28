#!/usr/bin/env node
// The "background processing pipeline": finds every LegalCase that doesn't
// yet have an up-to-date LegalCaseAiAnalysis row and (re)generates one.
//   node scripts/generate-ai-analysis.mjs [--batch-size=200]
//
// - No full judgment text yet (true for every row imported from the current
//   sample dataset) -> status SKIPPED_NO_TEXT, no model call made.
// - Text exists but no AI provider is configured -> status PENDING (queued;
//   will be picked up automatically once AI_PROVIDER + a key are set).
// - Text exists and a provider is configured -> the provider is called and
//   the result stored as COMPLETED (or FAILED, with the error preserved in
//   generatedAt=null/status so it's retried on the next run).
// Bump CURRENT_PROMPT_VERSION to force regeneration after a model/prompt
// upgrade — rows with an older promptVersion are reprocessed automatically.
import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase.js";
import { getAiProvider } from "../lib/ai/index.js";

const CURRENT_PROMPT_VERSION = 1;
// PostgREST can't express "embedded row is null OR embedded column < X" as a
// single top-level filter, so this fetches a bounded window of candidates
// and does that part of the filtering in JS instead — fine at the dataset
// sizes this project deals with today.
const CANDIDATE_FETCH_LIMIT = 5000;

function parseArgs(argv) {
  const flags = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      flags[key] = value ?? true;
    }
  }
  return flags;
}

async function upsertAnalysis(legalCaseId, existingAnalysisId, fields) {
  const { error } = await supabase.from("legal_case_ai_analysis").upsert(
    {
      id: existingAnalysisId ?? randomUUID(),
      caseId: legalCaseId,
      updatedAt: new Date(),
      ...fields,
    },
    { onConflict: "caseId" }
  );
  if (error) throw error;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const batchSize = Number(flags["batch-size"]) || 200;
  const provider = getAiProvider();
  console.log(`AI provider: ${provider.name}`);

  const { data: candidates, error } = await supabase
    .from("legal_cases")
    .select("*, aiAnalysis:legal_case_ai_analysis(id, promptVersion)")
    .limit(CANDIDATE_FETCH_LIMIT);
  if (error) throw error;

  const cases = candidates
    .filter((c) => !c.aiAnalysis || c.aiAnalysis.promptVersion < CURRENT_PROMPT_VERSION)
    .slice(0, batchSize);
  console.log(`Found ${cases.length} case(s) needing AI analysis (batch size ${batchSize}).`);

  const counts = { skippedNoText: 0, pending: 0, completed: 0, failed: 0 };

  for (const legalCase of cases) {
    const existingAnalysisId = legalCase.aiAnalysis?.id ?? null;

    if (!legalCase.fullJudgmentText) {
      await upsertAnalysis(legalCase.id, existingAnalysisId, {
        status: "SKIPPED_NO_TEXT",
        promptVersion: CURRENT_PROMPT_VERSION,
      });
      counts.skippedNoText += 1;
      continue;
    }

    if (provider.name === "none") {
      await upsertAnalysis(legalCase.id, existingAnalysisId, {
        status: "PENDING",
        promptVersion: CURRENT_PROMPT_VERSION,
      });
      counts.pending += 1;
      continue;
    }

    try {
      const analysis = await provider.generateCaseAnalysis(legalCase);
      await upsertAnalysis(legalCase.id, existingAnalysisId, {
        ...analysis,
        status: "COMPLETED",
        modelProvider: provider.name,
        promptVersion: CURRENT_PROMPT_VERSION,
        generatedAt: new Date(),
      });
      counts.completed += 1;
    } catch (err) {
      console.error(`  Failed for case ${legalCase.id}:`, err.message);
      await upsertAnalysis(legalCase.id, existingAnalysisId, {
        status: "FAILED",
        promptVersion: CURRENT_PROMPT_VERSION,
      });
      counts.failed += 1;
    }
  }

  console.log("Done:", counts);
}

main().catch((err) => {
  console.error("AI generation pipeline failed:", err);
  process.exit(1);
});
