import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { getRecentCases } from "@/lib/cases/query";
import { paginationOnlySchema } from "@/lib/validation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parsed = paginationOnlySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return jsonError("Invalid query parameters.", 400, parsed.error.flatten());
  }

  try {
    const { rows, total, page, pageSize, totalPages } = await getRecentCases(parsed.data);
    return jsonOk(rows, { total, page, pageSize, totalPages });
  } catch (err) {
    console.error("[api/cases/recent]", err);
    return jsonErrorFromException(err, "Something went wrong while loading recent cases.");
  }
}
