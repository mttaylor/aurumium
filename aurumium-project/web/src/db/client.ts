/**
 * DB client (postgres.js + Drizzle) and the shared rollup queries.
 * The analytical reads go through raw SQL against the materialized view —
 * that's deliberate: the rollup is where Postgres earns its keep.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import type { RollupRow } from "../lib/metrics";

const sql = postgres(process.env.DATABASE_URL!, { max: 10 });
export const db = drizzle(sql, { schema });
export { sql };

export type PartnerRollup = RollupRow & {
  id: string;
  name: string;
  company: string | null;
};

export async function partnerRollups(tenantId: string, partnerId?: string) {
  return sql<PartnerRollup[]>`
    select p.id, p.name, p.company,
           r.leads, r.credit_pulls, r.pre_approvals, r.contracts,
           r.closes, r.funded, r.canceled,
           r.avg_lead_to_funded_days, r.avg_comp_cents
    from partners p
    join partner_funnel_rollup r on r.partner_id = p.id
    where p.tenant_id = ${tenantId} and p.status = 'active'
    ${partnerId ? sql`and p.id = ${partnerId}` : sql``}
  `;
}

export async function bookRollup(tenantId: string): Promise<RollupRow> {
  const [row] = await sql<RollupRow[]>`
    select coalesce(sum(leads),0)::int leads,
           coalesce(sum(credit_pulls),0)::int credit_pulls,
           coalesce(sum(pre_approvals),0)::int pre_approvals,
           coalesce(sum(contracts),0)::int contracts,
           coalesce(sum(closes),0)::int closes,
           coalesce(sum(funded),0)::int funded,
           coalesce(sum(canceled),0)::int canceled,
           avg(avg_lead_to_funded_days) avg_lead_to_funded_days,
           avg(avg_comp_cents) avg_comp_cents
    from partner_funnel_rollup where tenant_id = ${tenantId}
  `;
  return row;
}

export async function activeWeights(tenantId: string) {
  const rows = await sql`
    select weights from score_configs
    where tenant_id = ${tenantId} and is_active limit 1
  `;
  return rows[0]?.weights ?? null;
}

export const STALE_DAYS = 18; // TODO: per-tenant setting

export async function activePipeline(tenantId: string, stage?: string) {
  return sql`
    select pa.loan_id, pa.loan_ref, pa.stage, pa.stage_entered_at,
           pa.days_in_stage::float, p.id as partner_id, p.name as partner_name, p.company,
           (pa.days_in_stage > ${STALE_DAYS}) as stale
    from pipeline_active pa
    join partners p on p.id = pa.partner_id
    where pa.tenant_id = ${tenantId}
    ${stage ? sql`and pa.stage = ${stage}` : sql``}
    order by pa.days_in_stage desc
  `;
}
