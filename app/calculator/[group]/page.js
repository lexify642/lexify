import { notFound } from "next/navigation";
import { INPUT_FIELD_GROUPS } from "@/components/calculator/inputFieldsConfig";
import CalculatorWizardShell from "@/components/calculator/CalculatorWizardShell";
import CalculatorInputStepWorkspace from "@/components/calculator/CalculatorInputStepWorkspace";

// "proceeding" lives at the bare /calculator route (app/calculator/page.js)
// since it's the wizard's entry point — every other INPUT_FIELD_GROUPS entry
// gets a /calculator/<group-id> route here.
export function generateStaticParams() {
  return INPUT_FIELD_GROUPS.filter((group) => group.id !== "proceeding").map((group) => ({ group: group.id }));
}

export default async function CalculatorGroupPage({ params }) {
  const { group } = await params;
  const groupConfig = INPUT_FIELD_GROUPS.find((g) => g.id === group && g.id !== "proceeding");
  if (!groupConfig) notFound();

  return (
    <CalculatorWizardShell stepKey={group}>
      <CalculatorInputStepWorkspace groupId={group} />
    </CalculatorWizardShell>
  );
}
