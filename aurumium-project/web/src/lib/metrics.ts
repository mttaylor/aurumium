/**
 * AURUMIUM metric catalog — THE single source of truth.
 *
 * This module is imported by:
 *   - the dashboard UI (card labels, slot picker, formatting)
 *   - the API route handlers (ratio math)
 *   - Auri's tools and knowledge (explanations always match the math)
 *
 * Because all three import the same object, they cannot drift.
 * Never define a metric anywhere else.
 */

export type RollupRow = {
  leads: number;
  credit_pulls: number;
  pre_approvals: number;
  contracts: number;
  closes: number;
  funded: number;
  canceled: number;
  avg_lead_to_funded_days: number | null;
  avg_comp_cents: number | null;
};

export type MetricKey =
  | "lead_to_pull" | "pull_to_pre" | "pre_to_con" | "con_to_close"
  | "avg_comp" | "con_canx" | "pre_canx" | "pull_canx"
  | "lead_canx" | "lead_to_days";

export type MetricDef = {
  label: string;
  goodDirection: "up" | "down";
  kind: "ratio" | "currency" | "days";
  compute: (r: RollupRow) => number | null;
};

const ratio = (num: number, den: number) => (den > 0 ? num / den : null);

export const METRICS: Record<MetricKey, MetricDef> = {
  lead_to_pull:  { label: "Lead → Credit Pull",         goodDirection: "up",   kind: "ratio",
                   compute: (r) => ratio(r.credit_pulls, r.leads) },
  pull_to_pre:   { label: "Credit Pull → Pre-Approval", goodDirection: "up",   kind: "ratio",
                   compute: (r) => ratio(r.pre_approvals, r.credit_pulls) },
  pre_to_con:    { label: "Pre-Approval → Contract",    goodDirection: "up",   kind: "ratio",
                   compute: (r) => ratio(r.contracts, r.pre_approvals) },
  con_to_close:  { label: "Contract → Close",           goodDirection: "up",   kind: "ratio",
                   compute: (r) => ratio(r.closes, r.contracts) },
  avg_comp:      { label: "Average Compensation",       goodDirection: "up",   kind: "currency",
                   compute: (r) => r.avg_comp_cents },
  con_canx:      { label: "Contract Canx Rate",         goodDirection: "down", kind: "ratio",
                   compute: (r) => ratio(r.canceled, r.contracts) },
  pre_canx:      { label: "Pre-Approval → Canx",        goodDirection: "down", kind: "ratio",
                   compute: (r) => ratio(r.canceled, r.pre_approvals) },
  pull_canx:     { label: "Credit Pull → Canx",         goodDirection: "down", kind: "ratio",
                   compute: (r) => ratio(r.canceled, r.credit_pulls) },
  lead_canx:     { label: "Lead → Canx",                goodDirection: "down", kind: "ratio",
                   compute: (r) => ratio(r.canceled, r.leads) },
  lead_to_days:  { label: "Lead → Close, # Days",       goodDirection: "down", kind: "days",
                   compute: (r) => r.avg_lead_to_funded_days },
};

export const PRESET_SLOTS = Object.keys(METRICS) as MetricKey[];

export function computeAllMetrics(r: RollupRow) {
  return Object.fromEntries(
    (Object.entries(METRICS) as [MetricKey, MetricDef][]).map(([k, m]) => [
      k,
      { label: m.label, value: m.compute(r), goodDirection: m.goodDirection, kind: m.kind },
    ]),
  );
}

export function formatMetric(kind: MetricDef["kind"], value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (kind === "ratio") return `${(value * 100).toFixed(1)}%`;
  if (kind === "currency") return `$${Math.round(value / 100).toLocaleString()}`;
  return `${Math.round(value)} days`;
}
