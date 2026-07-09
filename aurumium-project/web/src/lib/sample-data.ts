/**
 * Sample data — RollupRow-shaped, exactly what /api/partners returns.
 * Per the UX principles: a new user never sees a blank screen; this dataset
 * renders until their real import lands. The UI can't tell the difference
 * because the shape is identical.
 */
import type { RollupRow } from "./metrics";
import { computeScore } from "./score";

export type PartnerRow = RollupRow & {
  id: string;
  name: string;
  company: string | null;
  score: number;
};

type Seed = [string, string, number, number, number, number, number, number, number, number];
//           name,   company, leads, pulls, pre,  con,  closes, canx, comp$, days

const SEEDS: Seed[] = [
  ["Monica Alvarez",  "Sotheby's International", 64, 51, 44, 31, 27, 3, 4620, 31],
  ["Sarah Whitfield", "Compass Realty",          82, 66, 52, 38, 31, 4, 3980, 34],
  ["Priya Natarajan", "Redfin Premier",          47, 40, 34, 26, 22, 2, 4110, 29],
  ["Marcus Chen",     "Keller Williams",         95, 70, 55, 36, 28, 5, 3410, 38],
  ["Greg Larsen",     "Silvercreek Realty",      58, 45, 36, 27, 21, 3, 3720, 33],
  ["Diane Okafor",    "RE/MAX Capital",          71, 52, 40, 28, 21, 4, 3350, 36],
  ["Alicia Reyes",    "Berkshire Hathaway HS",   66, 47, 36, 25, 19, 4, 3540, 40],
  ["James Holloway",  "eXp Realty",              53, 38, 29, 20, 15, 3, 3280, 41],
  ["Tessa Moore",     "Group One Real Estate",   44, 31, 24, 17, 13, 2, 3610, 37],
  ["Kevin O'Rourke",  "Century 21",              78, 50, 35, 23, 16, 5, 2890, 44],
  ["Lauren Michaels", "Realty One Group",        39, 24, 17, 11, 7,  3, 2740, 47],
  ["Derek Foss",      "Windermere",              51, 29, 19, 12, 7,  4, 2610, 49],
  ["Nina Petrov",     "Fathom Realty",           36, 20, 13, 8,  5,  2, 2830, 52],
  ["Bill Hastings",   "HomeSmart",               62, 33, 20, 11, 6,  5, 2450, 55],
  ["Tom Bradley",     "Coldwell Banker",         28, 15, 9,  5,  3,  2, 2380, 58],
];

export const SAMPLE_PARTNERS: PartnerRow[] = SEEDS
  .map(([name, company, leads, pulls, pre, con, closes, canx, comp, days], i) => {
    const row: RollupRow = {
      leads,
      credit_pulls: pulls,
      pre_approvals: pre,
      contracts: con,
      closes,
      funded: closes,
      canceled: canx,
      avg_lead_to_funded_days: days,
      avg_comp_cents: comp * 100,
    };
    return { id: `sample-${i + 1}`, name, company, ...row, score: computeScore(row) };
  })
  .sort((a, b) => b.score - a.score);

export function sampleBookRollup(): RollupRow {
  const sum = (f: (p: PartnerRow) => number) => SAMPLE_PARTNERS.reduce((a, p) => a + f(p), 0);
  const closes = sum((p) => p.closes);
  return {
    leads: sum((p) => p.leads),
    credit_pulls: sum((p) => p.credit_pulls),
    pre_approvals: sum((p) => p.pre_approvals),
    contracts: sum((p) => p.contracts),
    closes,
    funded: closes,
    canceled: sum((p) => p.canceled),
    avg_lead_to_funded_days:
      SAMPLE_PARTNERS.reduce((a, p) => a + (p.avg_lead_to_funded_days ?? 0) * p.closes, 0) / closes,
    avg_comp_cents:
      SAMPLE_PARTNERS.reduce((a, p) => a + (p.avg_comp_cents ?? 0) * p.closes, 0) / closes,
  };
}

/** Deterministic pseudo-random, for sparklines and sample deals. */
export function rng(seed: number) {
  let x = seed * 7 + 13;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

export type Deal = {
  id: string;
  partner: PartnerRow;
  stage: "Credit Pull" | "Pre-Approval" | "Contract";
  daysIn: number;
  estCompCents: number;
};

export const SAMPLE_DEALS: Deal[] = (() => {
  const stages = ["Credit Pull", "Pre-Approval", "Contract"] as const;
  const out: Deal[] = [];
  let n = 2401;
  SAMPLE_PARTNERS.forEach((p, idx) => {
    const r = rng(idx + 1);
    const active = Math.max(1, Math.round((p.contracts - p.closes) * 0.9));
    for (let i = 0; i < Math.min(active, 3); i++) {
      out.push({
        id: `LN-${n++}`,
        partner: p,
        stage: stages[Math.floor(r() * 3)],
        daysIn: Math.round(2 + r() * 26),
        estCompCents: Math.round((p.avg_comp_cents ?? 0) * (0.8 + r() * 0.5)),
      });
    }
  });
  return out.sort((a, b) => b.daysIn - a.daysIn);
})();
