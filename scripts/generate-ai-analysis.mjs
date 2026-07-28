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
import { prisma } from "../lib/db.js";
import { getAiProvider } from "../lib/ai/index.js";

const CURRENT_PROMPT_VERSION = 1;

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

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const batchSize = Number(flags["batch-size"]) || 200;
  const provider = getAiProvider();
  console.log(`AI provider: ${provider.name}`);

  const cases = await prisma.legalCase.findMany({
    where: {
      OR: [{ aiAnalysis: null }, { aiAnalysis: { promptVersion: { lt: CURRENT_PROMPT_VERSION } } }],
    },
    take: batchSize,
  });
  console.log(`Found ${cases.length} case(s) needing AI analysis (batch size ${batchSize}).`);

  const counts = { skippedNoText: 0, pending: 0, completed: 0, failed: 0 };

  for (const legalCase of cases) {
    if (!legalCase.fullJudgmentText) {
      await prisma.legalCaseAiAnalysis.upsert({
        where: { caseId: legalCase.id },
        create: { caseId: legalCase.id, status: "SKIPPED_NO_TEXT", promptVersion: CURRENT_PROMPT_VERSION },
        update: { status: "SKIPPED_NO_TEXT", promptVersion: CURRENT_PROMPT_VERSION },
      });
      counts.skippedNoText += 1;
      continue;
    }

    if (provider.name === "none") {
      await prisma.legalCaseAiAnalysis.upsert({
        where: { caseId: legalCase.id },
        create: { caseId: legalCase.id, status: "PENDING", promptVersion: CURRENT_PROMPT_VERSION },
        update: { status: "PENDING", promptVersion: CURRENT_PROMPT_VERSION },
      });
      counts.pending += 1;
      continue;
    }

    try {
      const analysis = await provider.generateCaseAnalysis(legalCase);
      await prisma.legalCaseAiAnalysis.upsert({
        where: { caseId: legalCase.id },
        create: {
          caseId: legalCase.id,
          ...analysis,
          status: "COMPLETED",
          modelProvider: provider.name,
          promptVersion: CURRENT_PROMPT_VERSION,
          generatedAt: new Date(),
        },
        update: {
          ...analysis,
          status: "COMPLETED",
          modelProvider: provider.name,
          promptVersion: CURRENT_PROMPT_VERSION,
          generatedAt: new Date(),
        },
      });
      counts.completed += 1;
    } catch (err) {
      console.error(`  Failed for case ${legalCase.id}:`, err.message);
      await prisma.legalCaseAiAnalysis.upsert({
        where: { caseId: legalCase.id },
        create: { caseId: legalCase.id, status: "FAILED", promptVersion: CURRENT_PROMPT_VERSION },
        update: { status: "FAILED", promptVersion: CURRENT_PROMPT_VERSION },
      });
      counts.failed += 1;
    }
  }

  console.log("Done:", counts);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("AI generation pipeline failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
