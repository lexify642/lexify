import CalculatorWizardShell from "@/components/calculator/CalculatorWizardShell";
import CalculatorEstimateWorkspace from "@/components/calculator/CalculatorEstimateWorkspace";

export default function CalculatorEstimatePage() {
  return (
    <CalculatorWizardShell stepKey="estimate">
      <CalculatorEstimateWorkspace />
    </CalculatorWizardShell>
  );
}
