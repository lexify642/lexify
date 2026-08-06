"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import { useCalculator } from "./CalculatorContext";
import { INPUT_FIELD_GROUPS } from "./inputFieldsConfig";

const STEPS = [
  { key: "client", href: "/calculator", label: "Client & Matter" },
  ...INPUT_FIELD_GROUPS.map((group) => ({
    key: group.id,
    href: `/calculator/${group.id}`,
    label: group.title,
  })),
  { key: "estimate", href: "/calculator/estimate", label: "Court Fees" },
];

// "Court Fees" is the computed result, not a step the user fills in — it's
// reached by clicking "Continue"/"Finish" on the last real step, not by
// picking it from the sidebar. Kept in STEPS (above) so handleContinue still
// knows what comes after "Filing Options"; just left out of the nav list.
const NAV_STEPS = STEPS.slice(0, -1);

export default function CalculatorWizardShell({ stepKey, children }) {
  const router = useRouter();
  const { setDismissedAlertIds, isEditingEstimate, setIsEditingEstimate, logEvent, showToast } = useCalculator();
  const currentIndex = STEPS.findIndex((s) => s.key === stepKey);
  const nextStep = STEPS[currentIndex + 1];
  const isEditingAStep = isEditingEstimate && stepKey !== "estimate";

  function handleContinue() {
    if (isEditingAStep) {
      showToast("Changes saved.");
      return;
    }
    if (!nextStep) {
      router.push("/");
      return;
    }
    if (nextStep.key === "estimate") {
      setDismissedAlertIds([]);
      logEvent("Recalculated estimate");
      showToast("Estimate calculated.");
    }
    router.push(nextStep.href);
  }

  function handleGetUpdatedEstimate() {
    setIsEditingEstimate(false);
    setDismissedAlertIds([]);
    logEvent("Recalculated estimate (edited)");
    showToast("Estimate updated.");
    router.push("/calculator/estimate");
  }

  const continueLabel = isEditingAStep ? "Save Changes" : !nextStep ? "Finish" : nextStep.key === "estimate" ? "Get Estimate" : "Continue";

  return (
    <AppShell>
      <Topbar />
      <div className="wizard-shell">
        <aside className="wizard-sidebar">
          <div className="wizard-sidebar-title">
            <span className="wizard-eyebrow">Calculating:</span>
            <strong>Court Fees &amp; Costs</strong>
          </div>
          <nav className="wizard-steps">
            {NAV_STEPS.map((s, index) => (
              <Link
                key={s.key}
                href={s.href}
                className={`wizard-step${index === currentIndex ? " active" : ""}${index < currentIndex ? " done" : ""}`}
              >
                <span className="wizard-step-icon">{index < currentIndex ? "✓" : index + 1}</span>
                {s.label}
                {isEditingEstimate && <span className="wizard-step-edit">✏️</span>}
              </Link>
            ))}
          </nav>
          {stepKey === "estimate" && !isEditingEstimate && (
            <div className="wizard-sidebar-footer">
              <button type="button" className="btn btn-outline btn-block" onClick={() => setIsEditingEstimate(true)}>
                ✏️ Update Details
              </button>
            </div>
          )}
          {isEditingEstimate && (
            <div className="wizard-sidebar-footer">
              <button type="button" className="btn btn-block" onClick={handleGetUpdatedEstimate}>
                Get Updated Estimate
              </button>
            </div>
          )}
        </aside>

        <div className="wizard-main">
          <div className="wizard-content">
            {children}
            <button type="button" className="btn wizard-continue" onClick={handleContinue}>
              {continueLabel}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
