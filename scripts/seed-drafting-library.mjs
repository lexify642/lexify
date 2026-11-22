// One-time seed: carries data/legalDrafts.js's LEGAL_DRAFT_CATEGORIES and
// data/clauses.json's 254-entry corpus into the real
// legal_draft_categories/legal_draft_subtypes/clauses tables.
//
//   node scripts/seed-drafting-library.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// Note: no PDF files actually exist anywhere in this repo (public/documents
// never existed — downloadUrl/previewUrl were always placeholder path
// strings, per data/legalDrafts.js's own top-of-file comment). This script
// seeds the metadata with file_path left null; upload the real PDFs for
// each category/sub-type through Admin → Drafting Library afterward.

try {
  process.loadEnvFile();
} catch {
  // no .env.local present — fine if the vars are already in the environment
}

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { LEGAL_DRAFT_CATEGORIES } from "../data/legalDrafts.js";

const clausesData = JSON.parse(readFileSync(fileURLToPath(new URL("../data/clauses.json", import.meta.url)), "utf8"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

function trimOrNull(value) {
  if (typeof value !== "string") return value ?? null;
  const t = value.trim();
  return t || null;
}

let sortOrder = 0;
for (const category of LEGAL_DRAFT_CATEGORIES) {
  const { data: created, error } = await supabase
    .from("legal_draft_categories")
    .insert({
      slug: category.slug,
      practice_area: category.practiceArea || null,
      languages: category.languages,
      translations: category.translations,
      search_placeholder: category.searchPlaceholder || null,
      sort_order: sortOrder++,
      status: "published",
    })
    .select("id")
    .single();
  if (error) throw error;

  if (category.subTypes?.length) {
    let subOrder = 0;
    for (const sub of category.subTypes) {
      const { error: subError } = await supabase.from("legal_draft_subtypes").insert({
        category_id: created.id,
        subtype_key: sub.id,
        translations: sub.translations,
        sort_order: subOrder++,
        status: "published",
      });
      if (subError) throw subError;
    }
  }

  console.log(`Seeded category ${category.slug}${category.subTypes ? ` (+${category.subTypes.length} sub-types)` : ""}`);
}

for (const clause of clausesData) {
  const { error } = await supabase.from("clauses").insert({
    id: clause.id,
    category: trimOrNull(clause.category),
    type: trimOrNull(clause.type),
    name: trimOrNull(clause.name),
    position: trimOrNull(clause.position),
    domain: trimOrNull(clause.domain),
    text: clause.text || null,
    version: trimOrNull(clause.version),
    risk: trimOrNull(clause.risk) || "N/A",
    favorability: trimOrNull(clause.favorability),
    negotiation: trimOrNull(clause.negotiation),
    frequency: trimOrNull(clause.frequency),
    case_law: trimOrNull(clause.caseLaw),
    status: trimOrNull(clause.status) || "APPROVED",
    is_published: true,
  });
  if (error) throw error;
}

console.log(`Done — seeded ${LEGAL_DRAFT_CATEGORIES.length} legal draft categor${LEGAL_DRAFT_CATEGORIES.length === 1 ? "y" : "ies"} and ${clausesData.length} clause(s).`);
