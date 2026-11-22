import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";

const BUCKET = "legal-drafts";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Two-step admin flow: upload the PDF here first to get a storage path,
// then create/update the category or sub-type (a plain JSON request) with
// that path — simpler than parsing a single multipart request that mixes a
// file with a nested-translations JSON body.
export async function POST(request) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return jsonError("No file provided.", 400);
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return jsonError("Only PDF files are accepted.", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File is too large (max 25MB).", 400);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_").slice(0, 200) || "document.pdf";
    const path = `${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: signedData } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    return jsonOk({ filePath: path, url: signedData?.signedUrl || null });
  } catch (err) {
    console.error("[api/legal-drafts/upload POST]", err);
    return jsonErrorFromException(err, "Something went wrong while uploading this file.");
  }
}
