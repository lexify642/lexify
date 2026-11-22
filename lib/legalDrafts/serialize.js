import "server-only";

// Reassembles legal_draft_categories (+ legal_draft_subtypes) rows into the
// exact nested shape data/legalDrafts.js's LEGAL_DRAFT_CATEGORIES has always
// had ({id, slug, languages, practiceArea, translations, searchPlaceholder,
// downloadUrl, previewUrl, subTypes}) — categoryName()/categoryDescription()/
// subTypeName()/translatePracticeArea() all keep working unchanged against
// this shape. `fileUrlByPath` is a Map of storage_path -> signed URL, built
// once per request via a single batched createSignedUrls() call.
export function serializeCategory(row, { subtypes = [], fileUrlByPath = new Map() } = {}) {
  const category = {
    id: row.id,
    slug: row.slug,
    languages: row.languages || [],
    practiceArea: row.practice_area,
    translations: row.translations || {},
    downloadUrl: row.file_path ? (fileUrlByPath.get(row.file_path) ?? null) : null,
    previewUrl: row.file_path ? (fileUrlByPath.get(row.file_path) ?? null) : null,
    status: row.status,
  };
  if (row.search_placeholder) category.searchPlaceholder = row.search_placeholder;
  if (subtypes.length) {
    category.subTypes = subtypes
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => serializeSubtype(s, fileUrlByPath));
  }
  return category;
}

export function serializeSubtype(row, fileUrlByPath = new Map()) {
  return {
    id: row.subtype_key,
    dbId: row.id,
    translations: row.translations || {},
    downloadUrl: row.file_path ? (fileUrlByPath.get(row.file_path) ?? null) : null,
    previewUrl: row.file_path ? (fileUrlByPath.get(row.file_path) ?? null) : null,
    status: row.status,
  };
}

export function groupByCategoryId(rows) {
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row.category_id) ?? [];
    list.push(row);
    map.set(row.category_id, list);
  }
  return map;
}
