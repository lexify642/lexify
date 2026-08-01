"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCalculator } from "./CalculatorContext";
import { INPUT_FIELD_GROUPS } from "./inputFieldsConfig";

const STEPS = [
  ...INPUT_FIELD_GROUPS.map((group) => ({
    key: group.id,
    href: group.id === "proceeding" ? "/calculator" : `/calculator/${group.id}`,
    label: group.title,
  })),
  { key: "estimate", href: "/calculator/estimate", label: "Court Fees" },
];

export default function CalculatorWizardShell({ stepKey, children }) {
  const router = useRouter();
  const { setDismissedAlertIds, logEvent, showToast } = useCalculator();
  const currentIndex = STEPS.findIndex((s) => s.key === stepKey);
  const nextStep = STEPS[currentIndex + 1];

  function handleContinue() {
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

  return (
    <div className="wizard-shell">
      <aside className="wizard-sidebar">
        <div className="wizard-sidebar-title">
          <span className="wizard-eyebrow">Calculating:</span>
          <strong>Court Fees &amp; Costs</strong>
        </div>
        <nav className="wizard-steps">
          {STEPS.map((s, index) => (
            <Link
              key={s.key}
              href={s.href}
              className={`wizard-step${index === currentIndex ? " active" : ""}${index < currentIndex ? " done" : ""}`}
            >
              <span className="wizard-step-icon">{index < currentIndex ? "✓" : index + 1}</span>
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="wizard-sidebar-footer">
          <Link href="/" className="btn btn-outline btn-block">
            Save &amp; Exit
          </Link>
        </div>
      </aside>

      <div className="wizard-main">
        <div className="wizard-topbar">
          <Link href="/" className="wizard-back">
            ← Back
          </Link>
          <span className="wizard-brand">⚖ CASEFLOW</span>
        </div>
        <div className="wizard-content">
          {children}
          <button type="button" className="btn wizard-continue" onClick={handleContinue}>
            {nextStep ? "Continue" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
