import { jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/requireStaff";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [profilesRes, mattersRes, recentActivityRes, legalDraftsRes, clausesRes] = await Promise.all([
      supabase.from("profiles").select("role, is_active"),
      supabase.from("matters").select("id, stage"),
      supabase.from("audit_log").select("*, actor:profiles(full_name, email)").order("created_at", { ascending: false }).limit(10),
      supabase.from("legal_draft_categories").select("id", { count: "exact", head: true }),
      supabase.from("clauses").select("id", { count: "exact", head: true }),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (mattersRes.error) throw mattersRes.error;
    if (recentActivityRes.error) throw recentActivityRes.error;
    if (legalDraftsRes.error) throw legalDraftsRes.error;
    if (clausesRes.error) throw clausesRes.error;

    const profiles = profilesRes.data ?? [];
    const usersByRole = profiles.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});

    const matters = mattersRes.data ?? [];
    const mattersByStage = matters.reduce((acc, m) => {
      const key = m.stage || "Unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return jsonOk({
      totalUsers: profiles.length,
      activeUsers: profiles.filter((p) => p.is_active).length,
      usersByRole,
      totalMatters: matters.length,
      mattersByStage,
      totalLegalDraftCategories: legalDraftsRes.count ?? 0,
      totalClauses: clausesRes.count ?? 0,
      recentActivity: (recentActivityRes.data ?? []).map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        summary: row.summary,
        createdAt: row.created_at,
        actorName: row.actor?.full_name || row.actor?.email || "System",
      })),
    });
  } catch (err) {
    console.error("[api/admin/stats GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading admin stats.");
  }
}
