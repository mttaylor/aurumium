-- ============================================================
-- AURUMIUM — PostgreSQL schema (v0.1)
-- Design principles:
--   1. NO PII. Loans are opaque refs; partners are business identities.
--   2. funnel_events is the source of truth. Every ratio, score,
--      and pipeline view derives from stage timestamps.
--   3. Customization is data (jsonb configs), not code.
-- Requires: PostgreSQL 15+. Optional: pgvector for Auri knowledge search.
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
-- create extension if not exists vector;  -- uncomment when enabling RAG embeddings

-- ---------- Tenancy & users ----------
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table users (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  email       text not null unique,
  display_name text not null,
  role        text not null default 'lo' check (role in ('owner','admin','lo','viewer')),
  created_at  timestamptz not null default now()
);

-- ---------- Referral partners ----------
create table partners (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  name         text not null,           -- business identity, not consumer PII
  company      text,
  external_ref text,                    -- id in the LOS/CRM they imported from
  status       text not null default 'active' check (status in ('active','archived')),
  created_at   timestamptz not null default now()
);
create index on partners (tenant_id, status);

-- ---------- Loans (opaque; zero PII) ----------
create table loans (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  loan_ref   text not null,             -- opaque external reference only
  created_at timestamptz not null default now(),
  unique (tenant_id, loan_ref)
);
create index on loans (partner_id);

-- ---------- Funnel events: THE core table ----------
create type funnel_stage as enum
  ('lead','credit_pull','pre_approval','contract','close','funded','canceled');

create table funnel_events (
  id          bigint generated always as identity primary key,
  loan_id     uuid not null references loans(id) on delete cascade,
  stage       funnel_stage not null,
  occurred_at timestamptz not null,
  meta        jsonb not null default '{}',   -- e.g. {"canx_reason":"rate"}
  unique (loan_id, stage)                    -- one timestamp per stage per loan
);
create index on funnel_events (stage, occurred_at);

-- ---------- Compensation (recorded at/after funding) ----------
create table compensation (
  loan_id      uuid primary key references loans(id) on delete cascade,
  amount_cents bigint not null,
  bps          numeric(6,2),               -- basis points, if tracked
  recorded_at  timestamptz not null default now()
);

-- ---------- Customizable dashboards (layout is data) ----------
-- layout example:
-- { "kpis": ["mtd_leads","ytd_units","ytd_volume","active_pipeline"],
--   "metric_slots": ["lead_to_pull","pull_to_pre", ...10 keys...],
--   "panels": {"top_partners": true, "nurture": true, "funnel": true} }
create table dashboard_configs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null default 'My dashboard',
  is_default boolean not null default false,
  layout     jsonb not null,
  updated_at timestamptz not null default now()
);
create unique index one_default_per_user on dashboard_configs (user_id) where is_default;

-- ---------- Partner score configuration (weights are data) ----------
-- weights example: {"lead_to_close": 0.55, "contract_retention": 0.25, "comp_index": 0.20}
create table score_configs (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null default 'Default',
  weights    jsonb not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index one_active_score_per_tenant on score_configs (tenant_id) where is_active;

-- ---------- Auri (in-product AI assistant) ----------
create table assistant_threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  title      text,
  created_at timestamptz not null default now()
);

create table assistant_messages (
  id         bigint generated always as identity primary key,
  thread_id  uuid not null references assistant_threads(id) on delete cascade,
  role       text not null check (role in ('user','assistant','tool')),
  content    jsonb not null,             -- full content blocks, incl. tool use
  created_at timestamptz not null default now()
);
create index on assistant_messages (thread_id, id);

-- Auri's evolving product knowledge (release notes, metric definitions, FAQs).
-- This is how Auri "keeps learning as we develop": every release appends rows.
create table assistant_knowledge (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references tenants(id) on delete cascade,  -- null = global/product-level
  kind       text not null check (kind in ('metric_definition','feature','faq','release_note','policy')),
  title      text not null,
  content    text not null,
  -- embedding vector(1024),             -- uncomment with pgvector for semantic search
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DERIVED LAYER — one rollup feeds every ratio, score, and list
-- ============================================================
create materialized view partner_funnel_rollup as
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
      filter (where funded_at.occurred_at is not null)         as avg_lead_to_funded_days,
  coalesce(sum(c.amount_cents) / nullif(count(c.loan_id),0), 0) as avg_comp_cents
from partners p
join loans l            on l.partner_id = p.id
join funnel_events fe   on fe.loan_id = l.id
left join funnel_events lead_at   on lead_at.loan_id = l.id and lead_at.stage = 'lead'
left join funnel_events funded_at on funded_at.loan_id = l.id and funded_at.stage = 'funded'
left join compensation c on c.loan_id = l.id
group by p.id, p.tenant_id;

create unique index on partner_funnel_rollup (partner_id);
-- Refresh strategy: `refresh materialized view concurrently partner_funnel_rollup;`
-- on a schedule (pg_cron) or after batch imports. Sub-second at this scale.

-- In-flight pipeline: latest non-terminal stage per loan + days in stage
create view pipeline_active as
select l.id as loan_id, l.tenant_id, l.partner_id, l.loan_ref,
       last_ev.stage, last_ev.occurred_at as stage_entered_at,
       extract(epoch from now() - last_ev.occurred_at) / 86400.0 as days_in_stage
from loans l
join lateral (
  select stage, occurred_at from funnel_events fe
  where fe.loan_id = l.id order by occurred_at desc limit 1
) last_ev on true
where last_ev.stage not in ('funded','canceled');
