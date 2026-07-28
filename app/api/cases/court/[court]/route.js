import { jsonError, jsonOk } from "@/lib/api-response";
import { searchCases } from "@/lib/cases/query";
import { nameParamSchema, paginationOnlySchema } from "@/lib/validation";

export async function GET(request, { params }) {
  const { court } = await params;
  const courtParsed = nameParamSchema.safeParse(court);
  const { searchParams } = new URL(request.url);
  const pageParsed = paginationOnlySchema.safeParse(Object.fromEntries(searchParams));

  if (!courtParsed.success || !pageParsed.success) {
    return jsonError("Invalid request.", 400, {
      court: courtParsed.success ? undefined : courtParsed.error.flatten(),
      pagination: pageParsed.success ? undefined : pageParsed.error.flatten(),
    });
  }

  try {
    const { rows, total, page, pageSize, totalPages } = await searchCases({
      court: courtParsed.data,
      sort: "latest",
      ...pageParsed.data,
    });
    return jsonOk(rows, { total, page, pageSize, totalPages });
  } catch (err) {
    console.error("[api/cases/court/:court]", err);
    return jsonError("Something went wrong while loading cases for this court.", 500);
  }
}
