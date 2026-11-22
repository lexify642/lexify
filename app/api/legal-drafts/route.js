import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff, requireManager } from "@/lib/auth/requireStaff";
import { legalDraftCategorySchema } from "@/lib/validation";
import { serializeCategory, groupByCategoryId } from "@/lib/legalDrafts/serialize";

const BUCKET = "legal-drafts";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [categoriesRes, subtypesRes] = await Promise.all([
      supabase.from("legal_draft_categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("legal_draft_subtypes").select("*"),
    ]);
    if (categoriesRes.error) throw categoriesRes.error;
    if (subtypesRes.error) throw subtypesRes.error;

    const categories = categoriesRes.data ?? [];
    const subtypes = subtypesRes.data ?? [];
    const subtypesByCategory = groupByCategoryId(subtypes);

    const paths = [...categories.map((c) => c.file_path), ...subtypes.map((s) => s.file_path)].filter(Boolean);
    const fileUrlByPath = new Map();
    if (paths.length) {
      const { data: signed, error: signError } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (signError) throw signError;
      (signed ?? []).forEach((s) => {
        if (s.signedUrl) fileUrlByPath.set(s.path, s.signedUrl);
      });
    }

    const result = categories.map((row) =>
      serializeCategory(row, { subtypes: subtypesByCategory.get(row.id) ?? [], fileUrlByPath })
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[api/legal-drafts GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading the drafting library.");
  }
}

export async function POST(request) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = legalDraftCategorySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid category.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const { data: created, error } = await supabase
      .from("legal_draft_categories")
      .insert({
        slug: data.slug,
        practice_area: data.practiceArea || null,
        languages: data.languages,
        file_path: data.filePath || null,
        translations: data.translations,
        search_placeholder: data.searchPlaceholder || null,
        sort_order: data.sortOrder ?? 0,
        status: data.status || "published",
        created_by: user.id,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return jsonError("A category with this slug already exists.", 409);
      throw error;
    }

    return jsonOk(serializeCategory(created, {}));
  } catch (err) {
    console.error("[api/legal-drafts POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating this category.");
  }
}
