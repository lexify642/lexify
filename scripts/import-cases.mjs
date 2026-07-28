#!/usr/bin/env node
// Batch import for the Cases module. Usage:
//   node scripts/import-cases.mjs <path-to-parquet> [--dataset-source=hc] [--batch-size=500]
//
// - Streams the parquet file in row windows (never loads the whole file into
//   memory) so this scales from today's 3,640-row sample to a future
//   tens-of-millions-row dataset without changes.
// - `createMany({ skipDuplicates: true })` against the
//   `(datasetSource, parserRecordId)` unique constraint makes re-running the
//   importer on the same file (or overlapping files) safe and idempotent.
// - `--dataset-source` tags every row from this run with a fixed source (for
//   future datasets that don't carry their own `dataset_source` column);
//   otherwise each row's own `dataset_source` column is used.
import { asyncBufferFromFile, parquetMetadataAsync, parquetReadObjects } from "hyparquet";
import { prisma } from "../lib/db.js";

const COLUMNS = [
  "id",
  "case_metadata_id",
  "dataset_source",
  "parser_record_id",
  "ingestion_split",
  "case_title",
  "party_petitioner",
  "party_respondent",
  "party_caption",
  "docket_number",
  "cnr_number",
  "neutral_citation",
  "law_report_citation",
  "court_name",
  "court_code",
  "bench_name",
  "presiding_judge",
  "coram_members",
  "coram_members_text",
  "decision_date",
  "registration_date",
  "citation_year",
  "decision_year",
  "disposition_text",
  "source_relative_path",
  "source_path_year",
  "source_path_court_code",
  "source_path_bench",
  "source_filename",
  "source_json_s3_url",
  "source_pdf_s3_url",
  "language_codes",
  "indexable_text",
  "headnote_text",
  "normalized_record_json",
  "parser_json",
  "quality_json",
  "created_at",
  "updated_at",
];

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      flags[key] = value ?? true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toInt(value) {
  if (value === null || value === undefined) return null;
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseJsonSafe(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapRow(row, datasetSourceOverride) {
  return {
    sourceId: toInt(row.id),
    datasetSource: datasetSourceOverride || row.dataset_source || "unknown",
    caseMetadataId: row.case_metadata_id ?? null,
    parserRecordId: row.parser_record_id,
    ingestionSplit: row.ingestion_split ?? null,
    caseTitle: row.case_title ?? "Untitled matter",
    partyPetitioner: row.party_petitioner ?? null,
    partyRespondent: row.party_respondent ?? null,
    partyCaption: row.party_caption ?? null,
    docketNumber: row.docket_number ?? null,
    cnrNumber: row.cnr_number ?? null,
    neutralCitation: row.neutral_citation ?? null,
    lawReportCitation: row.law_report_citation ?? null,
    courtName: row.court_name ?? "Unknown Court",
    courtCode: row.court_code ?? null,
    benchName: row.bench_name ?? null,
    presidingJudge: row.presiding_judge ?? null,
    coramMembers: Array.isArray(row.coram_members) ? row.coram_members.filter(Boolean) : [],
    coramMembersText: row.coram_members_text ?? null,
    decisionDate: toDate(row.decision_date),
    registrationDate: toDate(row.registration_date),
    citationYear: toInt(row.citation_year),
    decisionYear: toInt(row.decision_year),
    dispositionText: row.disposition_text ?? null,
    sourceRelativePath: row.source_relative_path ?? null,
    sourcePathYear: row.source_path_year ?? null,
    sourcePathCourtCode: row.source_path_court_code ?? null,
    sourcePathBench: row.source_path_bench ?? null,
    sourceFilename: row.source_filename ?? null,
    sourcePdfS3Url: row.source_pdf_s3_url ?? null,
    sourceJsonS3Url: row.source_json_s3_url ?? null,
    languageCodes: Array.isArray(row.language_codes) ? row.language_codes.filter(Boolean) : [],
    indexableText: row.indexable_text ?? null,
    headnoteText: row.headnote_text ?? null,
    referencedActs: [],
    referencedSections: [],
    keywords: [],
    normalizedRecordJson: parseJsonSafe(row.normalized_record_json),
    parserJson: parseJsonSafe(row.parser_json),
    qualityJson: parseJsonSafe(row.quality_json),
    sourceCreatedAt: toDate(row.created_at),
    sourceUpdatedAt: toDate(row.updated_at),
  };
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const filePath = positional[0];
  if (!filePath) {
    console.error("Usage: node scripts/import-cases.mjs <path-to-parquet> [--dataset-source=hc] [--batch-size=500]");
    process.exit(1);
  }
  const batchSize = Number(flags["batch-size"]) || 500;
  const datasetSourceOverride = flags["dataset-source"] || null;

  console.log(`Reading ${filePath} ...`);
  const file = await asyncBufferFromFile(filePath);
  const metadata = await parquetMetadataAsync(file);
  const totalRows = Number(metadata.num_rows);
  console.log(`Found ${totalRows} rows. Importing in batches of ${batchSize}.`);

  let imported = 0;
  let processed = 0;
  const startedAt = Date.now();

  for (let rowStart = 0; rowStart < totalRows; rowStart += batchSize) {
    const rowEnd = Math.min(rowStart + batchSize, totalRows);
    const rows = await parquetReadObjects({ file, columns: COLUMNS, rowStart, rowEnd });
    const data = rows.map((row) => mapRow(row, datasetSourceOverride));

    const result = await prisma.legalCase.createMany({ data, skipDuplicates: true });
    imported += result.count;
    processed += rows.length;
    console.log(`  rows ${rowStart}-${rowEnd}: +${result.count} new (${processed}/${totalRows} processed)`);
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\nDone in ${seconds}s. ${imported} new rows imported, ${processed - imported} duplicates skipped.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Import failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
