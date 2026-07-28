import { jsonError, jsonOk } from "@/lib/api-response";
import { searchCases } from "@/lib/cases/query";
import { searchParamsSchema } from "@/lib/validation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parsed = searchParamsSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return jsonError("Invalid query parameters.", 400, parsed.error.flatten());
  }

  try {
    const { rows, total, page, pageSize, totalPages } = await searchCases(parsed.data);
    return jsonOk(rows, { total, page, pageSize, totalPages });
  } catch (err) {
    console.error("[api/cases/search]", err);
    return jsonError("Something went wrong while searching cases.", 500);
  }
}
