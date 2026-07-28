import { jsonError, jsonOk } from "@/lib/api-response";
import { searchCases } from "@/lib/cases/query";
import { nameParamSchema, paginationOnlySchema } from "@/lib/validation";

export async function GET(request, { params }) {
  const { act } = await params;
  const actParsed = nameParamSchema.safeParse(act);
  const { searchParams } = new URL(request.url);
  const pageParsed = paginationOnlySchema.safeParse(Object.fromEntries(searchParams));

  if (!actParsed.success || !pageParsed.success) {
    return jsonError("Invalid request.", 400, {
      act: actParsed.success ? undefined : actParsed.error.flatten(),
      pagination: pageParsed.success ? undefined : pageParsed.error.flatten(),
    });
  }

  try {
    const { rows, total, page, pageSize, totalPages } = await searchCases({
      act: actParsed.data,
      sort: "latest",
      ...pageParsed.data,
    });
    return jsonOk(rows, { total, page, pageSize, totalPages });
  } catch (err) {
    console.error("[api/cases/act/:act]", err);
    return jsonError("Something went wrong while loading cases for this act.", 500);
  }
}
