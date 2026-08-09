"use client";

import { useRouter } from "next/navigation";
import TemplateBank from "./TemplateBank";
import PartnershipDeedEngine from "./PartnershipDeedEngine";
import { useDraftView } from "./useDraftView";
import { useDrafts } from "./DraftsContext";

export default function TemplateBankWorkspace() {
  const router = useRouter();
  const { addDraft } = useDrafts();
  const view = useDraftView();
  const isGenerator = view === "generator";

  function openGenerator() {
    window.location.hash = "#generator";
  }

  function createBlankDraft() {
    addDraft({ title: "Untitled Draft", type: "Draft" });
    router.push("/draft");
  }

  return (
    <div className="page">
      <PartnershipDeedEngine active={isGenerator} />
      <TemplateBank active={!isGenerator} onSelect={openGenerator} onCreateBlank={createBlankDraft} />
    </div>
  );
}
