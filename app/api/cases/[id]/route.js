import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { getCaseById } from "@/lib/cases/query";
import { idParamSchema } from "@/lib/validation";

export async function GET(_request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

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
    return jsonErrorFromException(err, "Something went wrong while loading this case.");
  }
}
