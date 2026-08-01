"use client";

import { inferInputsFromCase } from "./caseMapping";
import AlertsBanner from "./AlertsBanner";
import { useCalculator } from "./CalculatorContext";
import { DEFAULT_INPUT } from "./costEngine";
import { describeMatter } from "./format";
import { INPUT_FIELD_GROUPS } from "./inputFieldsConfig";
import InputDetailsCard from "./InputDetailsCard";

// One page per INPUT_FIELD_GROUPS entry (see app/calculator/[group]/page.js).
// The client/case linker and History & Audit live on the dedicated first
// step (CalculatorClientStepWorkspace) instead, so every field-group step
// here looks identical regardless of which group it's showing.
export default function CalculatorInputStepWorkspace({ groupId }) {
  const {
    inputs,
    setInputs,
    linkedCase,
    clientName,
    manualMatterTitle,
    result,
    dismissedAlertIds,
    setDismissedAlertIds,
    showToast,
  } = useCalculator();
  const group = INPUT_FIELD_GROUPS.find((g) => g.id === groupId);

  function handleChange(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setInputs(linkedCase ? { ...DEFAULT_INPUT, ...inferInputsFromCase(linkedCase) } : DEFAULT_INPUT);
    setDismissedAlertIds([]);
    showToast("Inputs reset.");
  }

  return (
    <div className="calculator-workspace">
      <div className="heading-row">
        <div>
          <h1 className="page-title">{group.title}</h1>
          <p className="page-subtitle">{describeMatter({ linkedCase, clientName, manualMatterTitle })}</p>
        </div>
      </div>

      <AlertsBanner
        alerts={result.alerts}
        dismissedIds={dismissedAlertIds}
        onDismiss={(id) => setDismissedAlertIds((prev) => [...prev, id])}
      />

      <InputDetailsCard group={group} values={inputs} onChange={handleChange} onReset={handleReset} />
    </div>
  );
}
