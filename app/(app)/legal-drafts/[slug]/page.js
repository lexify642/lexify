import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import LegalDraftCategoryWorkspace from "@/components/legal-drafts/LegalDraftCategoryWorkspace";

// No generateStaticParams(): categories are admin-managed content in
// Supabase now, not known at build time — and this route is already
// force-dynamic anyway (every page under (app) is, via the auth check in
// (app)/layout.js), so static prerendering here was already moot.
export default async function LegalDraftCategoryPage({ params }) {
  const { slug } = await params;
  return (
    <AppShell>
      <Topbar />
      <Suspense fallback={<div className="page">Loading…</div>}>
        <LegalDraftCategoryWorkspace slug={slug} />
      </Suspense>
    </AppShell>
  );
}
