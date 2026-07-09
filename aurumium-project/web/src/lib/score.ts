/**
 * Partner score: weighted composite, 0–1000.
 * Weights live in the tenant's active score_configs row (jsonb) so changing
 * the formula is a config edit, not a deploy. These are the defaults.
 */
import type { RollupRow } from "./metrics";

export type ScoreWeights = {
  lead_to_close: number;       // closes / leads
  contract_retention: number;  // 1 - canceled / contracts
  comp_index: number;          // avg_comp / target, capped at 1
};

export const DEFAULT_WEIGHTS: ScoreWeights = {
  lead_to_close: 0.55,
  contract_retention: 0.25,
  comp_index: 0.2,
};

export const TARGET_COMP_CENTS = 500_000; // $5,000 normalizer — make configurable later

export function computeScore(r: RollupRow, w: ScoreWeights = DEFAULT_WEIGHTS): number {
  const leadToClose = r.leads > 0 ? r.closes / r.leads : 0;
  const retention = r.contracts > 0 ? 1 - r.canceled / r.contracts : 0;
  const compIndex = Math.min((r.avg_comp_cents ?? 0) / TARGET_COMP_CENTS, 1);
  return Math.round(
    1000 * (w.lead_to_close * leadToClose + w.contract_retention * retention + w.comp_index * compIndex),
  );
}
