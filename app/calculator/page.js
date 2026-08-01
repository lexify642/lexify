import CalculatorWizardShell from "@/components/calculator/CalculatorWizardShell";
import CalculatorInputStepWorkspace from "@/components/calculator/CalculatorInputStepWorkspace";

export default function CalculatorPage() {
  return (
    <CalculatorWizardShell stepKey="proceeding">
      <CalculatorInputStepWorkspace groupId="proceeding" />
    </CalculatorWizardShell>
  );
}
