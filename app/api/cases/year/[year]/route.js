import { jsonError, jsonOk } from "@/lib/api-response";
import { searchCases } from "@/lib/cases/query";
import { paginationOnlySchema, yearParamSchema } from "@/lib/validation";

export async function GET(request, { params }) {
  const { year } = await params;
  const yearParsed = yearParamSchema.safeParse(year);
  const { searchParams } = new URL(request.url);
  const pageParsed = paginationOnlySchema.safeParse(Object.fromEntries(searchParams));

  if (!yearParsed.success || !pageParsed.success) {
    return jsonError("Invalid request.", 400, {
      year: yearParsed.success ? undefined : yearParsed.error.flatten(),
      pagination: pageParsed.success ? undefined : pageParsed.error.flatten(),
    });
  }

  try {
    const { rows, total, page, pageSize, totalPages } = await searchCases({
      year: yearParsed.data,
      sort: "latest",
      ...pageParsed.data,
    });
    return jsonOk(rows, { total, page, pageSize, totalPages });
  } catch (err) {
    console.error("[api/cases/year/:year]", err);
    return jsonError("Something went wrong while loading cases for this year.", 500);
  }
}
