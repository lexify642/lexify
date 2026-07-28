import { jsonError, jsonOk } from "@/lib/api-response";
import { getCaseById } from "@/lib/cases/query";
import { idParamSchema } from "@/lib/validation";

export async function GET(_request, { params }) {
  const { id } = await params;
  const parsed = idParamSchema.safeParse(id);
  if (!parsed.success) {
    return jsonError("Invalid case id.", 400, parsed.error.flatten());
  }

  try {
    const legalCase = await getCaseById(parsed.data);
    if (!legalCase) {
      return jsonError("Case not found.", 404);
    }
    return jsonOk(legalCase);
  } catch (err) {
    console.error("[api/cases/:id]", err);
    return jsonError("Something went wrong while loading this case.", 500);
  }
}
