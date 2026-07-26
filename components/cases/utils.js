export function displayDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function toneForStage(stage) {
  return (
    {
      Admission: "blue",
      "Final Hearing": "orange",
      Evidence: "red",
      Reply: "green",
    }[stage] || "blue"
  );
}
