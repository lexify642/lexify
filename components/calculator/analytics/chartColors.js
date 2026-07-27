// Single source of truth for chart colors — sourced from the app's own CSS
// variables (app/globals.css :root) so charts stay visually consistent with the
// rest of CASEFLOW. Validated with the dataviz skill's palette validator
// (scripts/validate_palette.js) against the app's white/light card surface: all
// checks pass, with a contrast WARN on green/orange vs. white — so every mark in
// these charts ships a direct value label or sits next to legend text, never
// color-alone.
export const CATEGORICAL_ORDER = ["blue", "green", "orange", "red", "purple"];

export const CHART_COLORS = {
  blue: "var(--blue)",
  green: "var(--green)",
  orange: "var(--orange)",
  red: "var(--red)",
  purple: "var(--purple)",
  muted: "#c3cede",
};
