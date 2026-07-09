-- AURUMIUM derived layer — apply AFTER `drizzle-kit push` creates the tables.
-- Drizzle doesn't manage materialized views; this file is the canonical DDL
-- for the analytics layer (mirrors db/schema.sql).

create materialized view if not exists partner_funnel_rollup as
select
  p.id as partner_id,
  p.tenant_id,
  count(*) filter (where fe.stage = 'lead')        as leads,
  count(*) filter (where fe.stage = 'credit_pull') as credit_pulls,
  count(*) filter (where fe.stage = 'pre_approval')as pre_approvals,
  count(*) filter (where fe.stage = 'contract')    as contracts,
  count(*) filter (where fe.stage = 'close')       as closes,
  count(*) filter (where fe.stage = 'funded')      as funded,
  count(*) filter (where fe.stage = 'canceled')    as canceled,
  avg( extract(epoch from funded_at.occurred_at - lead_at.occurred_at) / 86400.0 )
      filter (where funded_at.occurred_at is not null)          as avg_lead_to_funded_days,
  coalesce(sum(c.amount_cents) / nullif(count(c.loan_id),0), 0) as avg_comp_cents
from partners p
join loans l          on l.partner_id = p.id
join funnel_events fe on fe.loan_id = l.id
left join funnel_events lead_at   on lead_at.loan_id = l.id and lead_at.stage = 'lead'
left join funnel_events funded_at on funded_at.loan_id = l.id and funded_at.stage = 'funded'
left join compensation c on c.loan_id = l.id
group by p.id, p.tenant_id;

create unique index if not exists pfr_partner on partner_funnel_rollup (partner_id);
-- Refresh after imports: refresh materialized view concurrently partner_funnel_rollup;

create or replace view pipeline_active as
select l.id as loan_id, l.tenant_id, l.partner_id, l.loan_ref,
       last_ev.stage, last_ev.occurred_at as stage_entered_at,
       extract(epoch from now() - last_ev.occurred_at) / 86400.0 as days_in_stage
from loans l
join lateral (
  select stage, occurred_at from funnel_events fe
  where fe.loan_id = l.id order by occurred_at desc limit 1
) last_ev on true
where last_ev.stage not in ('funded','canceled');
