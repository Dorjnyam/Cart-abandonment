export const CHART_SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
] as const;

export const CHART_TOKENS = {
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  warning: "var(--warning)",
  error: "var(--error)",
  success: "var(--success)",
  riskLow: "var(--color-risk-low)",
  riskMedium: "var(--color-risk-medium)",
  riskHigh: "var(--color-risk-high)",
  variantBaseline: "var(--color-variant-baseline)",
  variantExtended: "var(--color-variant-extended)",
  variantFull: "var(--color-variant-full)",
  grid: "rgb(var(--outline-rgb) / 0.08)",
  gridSoft: "rgb(var(--outline-rgb) / 0.06)",
  tick: "rgb(var(--on-surface-variant-rgb))",
  tooltipBg: "rgb(var(--surface-container-lowest-rgb) / 0.96)",
  tooltipBorder: "rgb(var(--outline-variant-rgb) / 0.12)",
  pieStroke: "rgb(var(--surface-container-lowest-rgb))",
} as const;

export function chartSeries(index: number): string {
  return CHART_SERIES[index % CHART_SERIES.length];
}
