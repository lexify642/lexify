import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { searchCases } from "@/lib/cases/query";
import { nameParamSchema, paginationOnlySchema } from "@/lib/validation";

export async function GET(request, { params }) {
  const { judge } = await params;
  const judgeParsed = nameParamSchema.safeParse(judge);
  const { searchParams } = new URL(request.url);
  const pageParsed = paginationOnlySchema.safeParse(Object.fromEntries(searchParams));

  if (!judgeParsed.success || !pageParsed.success) {
    return jsonError("Invalid request.", 400, {
      judge: judgeParsed.success ? undefined : judgeParsed.error.flatten(),
      pagination: pageParsed.success ? undefined : pageParsed.error.flatten(),
    });
  }

  try {
    const { rows, total, page, pageSize, totalPages } = await searchCases({
      judge: judgeParsed.data,
      sort: "latest",
      ...pageParsed.data,
    });
    return jsonOk(rows, { total, page, pageSize, totalPages });
  } catch (err) {
    console.error("[api/cases/judge/:judge]", err);
    return jsonErrorFromException(err, "Something went wrong while loading cases for this judge.");
  }
}
