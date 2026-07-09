/**
 * Drizzle schema for AURUMIUM.
 *
 * Canonical DDL lives in db/schema.sql (including the materialized view
 * `partner_funnel_rollup` and the `pipeline_active` view, which Drizzle
 * doesn't manage — apply drizzle/0000_views.sql after `drizzle-kit push`).
 * These table definitions give the app end-to-end types.
 */
import {
  pgTable, pgEnum, uuid, text, timestamp, boolean, bigint,
  jsonb, numeric, uniqueIndex, bigserial,
} from "drizzle-orm/pg-core";

export const funnelStage = pgEnum("funnel_stage", [
  "lead", "credit_pull", "pre_approval", "contract", "close", "funded", "canceled",
]);

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("lo"), // owner | admin | lo | viewer
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),        // business identity — never consumer PII
  company: text("company"),
  externalRef: text("external_ref"),   // id in the LOS/CRM they imported from
  status: text("status").notNull().default("active"), // active | archived
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  loanRef: text("loan_ref").notNull(), // opaque external reference only — NO PII
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("loans_tenant_ref").on(t.tenantId, t.loanRef)]);

export const funnelEvents = pgTable("funnel_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  loanId: uuid("loan_id").notNull().references(() => loans.id, { onDelete: "cascade" }),
  stage: funnelStage("stage").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  meta: jsonb("meta").notNull().default({}), // e.g. { canx_reason: "rate" }
}, (t) => [uniqueIndex("one_event_per_stage").on(t.loanId, t.stage)]);

export const compensation = pgTable("compensation", {
  loanId: uuid("loan_id").primaryKey().references(() => loans.id, { onDelete: "cascade" }),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  bps: numeric("bps"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

// Customization is data: the dashboard IS this jsonb.
// { kpis: [...], metric_slots: [...10 MetricKeys...], panels: {...} }
export const dashboardConfigs = pgTable("dashboard_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("My dashboard"),
  isDefault: boolean("is_default").notNull().default(false),
  layout: jsonb("layout").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoreConfigs = pgTable("score_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Default"),
  weights: jsonb("weights").notNull(), // ScoreWeights
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Auri ----
export const assistantThreads = pgTable("assistant_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assistantMessages = pgTable("assistant_messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  threadId: uuid("thread_id").notNull().references(() => assistantThreads.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant | tool
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Auri's evolving product knowledge — append rows every release.
export const assistantKnowledge = pgTable("assistant_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null = global
  kind: text("kind").notNull(), // metric_definition | feature | faq | release_note | policy
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
