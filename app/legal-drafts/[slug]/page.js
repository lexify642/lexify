import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import LegalDraftCategoryWorkspace from "@/components/legal-drafts/LegalDraftCategoryWorkspace";
import { LEGAL_DRAFT_CATEGORIES } from "@/data/legalDrafts";

export function generateStaticParams() {
  return LEGAL_DRAFT_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export default async function LegalDraftCategoryPage({ params }) {
  const { slug } = await params;
  return (
    <AppShell>
      <Topbar searchAriaLabel="Global search">
        <span>◌</span>
        <span>◔</span>
        <div className="avatar">JA</div>
      </Topbar>
      <LegalDraftCategoryWorkspace slug={slug} />
    </AppShell>
  );
}
