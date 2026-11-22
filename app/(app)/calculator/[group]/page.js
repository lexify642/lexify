import { notFound } from "next/navigation";
import { INPUT_FIELD_GROUPS } from "@/components/calculator/inputFieldsConfig";
import CalculatorWizardShell from "@/components/calculator/CalculatorWizardShell";
import CalculatorInputStepWorkspace from "@/components/calculator/CalculatorInputStepWorkspace";

// The wizard's entry point (/calculator, app/calculator/page.js) is the
// "Client & Matter" step — every INPUT_FIELD_GROUPS entry, including
// "proceeding", gets a /calculator/<group-id> route here.
export function generateStaticParams() {
  return INPUT_FIELD_GROUPS.map((group) => ({ group: group.id }));
}

export default async function CalculatorGroupPage({ params }) {
  const { group } = await params;
  const groupConfig = INPUT_FIELD_GROUPS.find((g) => g.id === group);
  if (!groupConfig) notFound();

  return (
    <CalculatorWizardShell stepKey={group}>
      <CalculatorInputStepWorkspace groupId={group} />
    </CalculatorWizardShell>
  );
}
