import CalculatorWizardShell from "@/components/calculator/CalculatorWizardShell";
import CalculatorClientStepWorkspace from "@/components/calculator/CalculatorClientStepWorkspace";

export default function CalculatorPage() {
  return (
    <CalculatorWizardShell stepKey="client">
      <CalculatorClientStepWorkspace />
    </CalculatorWizardShell>
  );
}
