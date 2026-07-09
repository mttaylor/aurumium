# AURUMIUM — Architecture & System Design

**Version:** 0.2.0  
**Last Updated:** 2026-07-08  
**Status:** MVP + Supabase Integration — Ready for Production Deployment

---

## 📋 Executive Summary

Aurumium is a **referral-partner intelligence platform** for mortgage lenders. It tracks lending funnels, computes partner scores, and provides AI-powered insights via Auri (Claude-powered assistant).

**Current State:**
- ✅ **Frontend:** React dashboard with dark theme, fully responsive
- ✅ **AI Assistant:** Chat UI built, backend ready with Auri tools
- ✅ **Database:** Supabase PostgreSQL (managed, auto-scaling, RLS-ready)
- ✅ **Schema:** Drizzle ORM with all tables defined + migrations
- ⚠️ **Auth:** Not implemented yet (can use Supabase Auth or custom JWT)
- ⚠️ **Deployment:** Ready for Vercel + Supabase production

---

## 🏗️ System Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER (React)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Dashboard (aurumium-app.tsx)                         │   │
│  │  ├─ Dashboard View (KPIs, metrics, top partners)     │   │
│  │  ├─ Partners View (table, search, sort)             │   │
│  │  ├─ Pipeline View (in-flight loans by stage)        │   │
│  │  ├─ Reports View (charts, export)                   │   │
│  │  └─ Auri Chat (auri-chat.tsx) ◄─── NEW             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP REST
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              Next.js API Layer (Vercel Functions)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/partners          → RollupRow[] (Supabase)        │
│  │  /api/partners/[id]     → Partner detail                  │
│  │  /api/metrics           → Book-wide metrics               │
│  │  /api/pipeline          → Active loans in funnel          │
│  │  /api/config/dashboard  → User's dashboard layout         │
│  │  /api/assistant/chat    → Claude + Tools ◄─── LIVE      │
│  └──────────────────────────────────────────────────────────┘
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌────────────────────┐
│ Supabase Cloud   │        │ Anthropic Claude   │
│ (PostgreSQL 15)  │        │ (claude-sonnet-4)  │
│  ├─ tenants      │        │                    │
│  ├─ users        │        │ Tools:             │
│  ├─ partners     │        │ • get_partner_... │
│  ├─ loans        │        │ • get_book_...    │
│  ├─ funnel_...   │        │ • get_stale_...   │
│  ├─ compensation │        │                    │
│  └─ ...configs   │        │ System Prompt:     │
│                  │        │ (ai/auri-system...) │
└──────────────────┘        └────────────────────┘
```

---

## 📁 Project Structure

```
aurumium-project/
├─ ai/
│  └─ auri-system-prompt.md          [Auri's behavior spec v0.1]
│
├─ db/
│  └─ schema.sql                     [Canonical DDL reference]
│
├─ docs/
│  └─ user-flows.md                  [Feature specification]
│
└─ web/
   ├─ src/
   │  ├─ app/
   │  │  ├─ globals.css              [Root styles + Tailwind imports]
   │  │  ├─ layout.tsx               [Next.js root layout]
   │  │  ├─ page.tsx                 [Home page → <AurumiumApp />]
   │  │  └─ api/
   │  │     ├─ assistant/chat/route.ts        [Claude integration]
   │  │     ├─ config/dashboard/route.ts      [Get/save layouts]
   │  │     ├─ metrics/route.ts               [Book-wide stats]
   │  │     ├─ partners/route.ts              [RollupRow[] list]
   │  │     ├─ partners/[id]/route.ts         [Single partner]
   │  │     └─ pipeline/route.ts              [Active funnel loans]
   │  │
   │  ├─ components/
   │  │  ├─ aurumium-app.tsx          [Main dashboard container]
   │  │  └─ auri-chat.tsx             [Chat UI component ✨ NEW]
   │  │
   │  ├─ db/
   │  │  ├─ client.ts                 [Drizzle client + pooling]
   │  │  └─ schema.ts                 [Drizzle ORM tables]
   │  │
   │  └─ lib/
   │     ├─ metrics.ts                [Metric catalog (UI + API + Auri)]
   │     ├─ sample-data.ts            [Mock data for dev/demo]
   │     └─ score.ts                  [Partner score composite]
   │
   ├─ drizzle/
   │  └─ 0000_views.sql               [Materialized views + rollups]
   │
   ├─ next.config.ts                  [Next.js config (minimal)]
   ├─ drizzle.config.ts               [Drizzle Kit config]
   ├─ tsconfig.json                   [TypeScript strict mode]
   ├─ tailwind.config.ts              [⚠️ MISSING: explicit config]
   ├─ postcss.config.mjs              [Tailwind + PostCSS setup]
   ├─ package.json                    [Dependencies + scripts]
   └─ .env.example                    [Credential template]
```

---

## 🔴 What's Missing (Priority Order)

### **CRITICAL**

| Item | Impact | Effort | Notes |
|------|--------|--------|-------|
| **Database Connection** | ✅ DONE | — | Using Supabase PostgreSQL (managed) |
| **Authentication Middleware** | 🔴 Blocks deployment | 2-4hrs | Use Supabase Auth or implement custom JWT |
| **RLS Policies** | 🔴 Multi-tenant security | 1-2hrs | Create Supabase RLS policies for tenant isolation |
| **API Error Handling** | 🟠 No graceful failures | 1-2hrs | Add validation, try-catch, consistent error responses |
| **Tailwind Config** | 🟠 Theme not optimized | 30min | Explicit `tailwind.config.ts` with design tokens |

### **HIGH**

| Item | Impact | Effort | Notes |
|------|--------|--------|-------|
| **`.gitignore`** | 🔴 Credential leaks | 10min | Prevent `.env`, `node_modules`, `.next`, build artifacts |
| **Data Import Pipeline** | 🟠 Can't populate DB | 4-6hrs | CSV/API ingest, LOS integration, deduplication |
| **Error Boundaries** | 🟠 Blank screen crashes | 1-2hrs | Add React boundary + fallback UI |
| **Logging** | 🟠 No debugging visibility | 2-3hrs | pino/winston for structured logs |
| **ESLint + Prettier** | 🟠 Code style inconsistency | 1hr | Enforce linting on commit |
| **Unit Tests** | 🟠 No test coverage | 4-6hrs | Jest for components, vitest for lib functions |

### **MEDIUM**

| Item | Impact | Effort | Notes |
|------|--------|--------|-------|
| **Docker Compose** | 🟡 Dev environment setup | 1-2hrs | Postgres + Next.js + pgAdmin for local dev |
| **CI/CD (GitHub Actions)** | 🟡 No automated testing/deploy | 2-3hrs | Build, lint, test on push; deploy to staging/prod |
| **API Documentation** | 🟡 Unclear endpoints | 1-2hrs | OpenAPI spec or simple `.md` route docs |
| **Database Seeding** | 🟡 Manual test data | 1-2hrs | Scripts for dev/staging/prod data initialization |
| **Rate Limiting** | 🟡 API abuse risk | 1-2hrs | Add middleware for `/api/assistant/chat` throttling |
| **Telemetry** | 🟡 No usage insights | 2-4hrs | Mixpanel/Posthog for product analytics |

### **LOW**

| Item | Impact | Effort | Notes |
|------|--------|--------|-------|
| **Dark Mode Toggle** | 🟢 Nice-to-have | 1-2hrs | Already dark, but add light mode option |
| **Mobile Responsiveness** | 🟢 Mobile support | 1-2hrs | Chat panel responsive, table scrolling |
| **Accessibility (a11y)** | 🟢 WCAG compliance | 2-4hrs | ARIA labels, keyboard nav, screen reader support |
| **Documentation** | 🟢 Onboarding | 1-2hrs | CONTRIBUTING.md, setup guide, deployment guide |
| **Performance Optimization** | 🟢 Slow pages | 1-3hrs | Code splitting, lazy loading, image optimization |

---

## 🎯 Current Feature Status

### ✅ **Built & Live**

- **Dashboard UI:** KPIs, partner table, pipeline view, reports with charts
- **Partner Profiles:** Funnel breakdown, metrics card, score medallion
- **Auri Chat Interface:** Message history, input, loading state, error handling
- **Sample Data:** Full mock dataset so UI works without DB
- **Dark Theme:** Gold + charcoal aesthetic, responsive layout
- **Metric System:** Centralized catalog (UI, API, and Auri all share definitions)

### ⚙️ **Built But Blocked**

- **Auri Backend:** `/api/assistant/chat` fully implemented with Claude + tools, awaiting database
- **API Routes:** `/api/partners`, `/api/pipeline`, etc. defined but return sample data or errors
- **Drizzle Schema:** All tables defined, migrations ready (need `npm run db:push`)

### 🔨 **Not Started**

- **Authentication:** No login/session/JWT
- **Real Data Import:** No CSV/API ingest
- **Deployment:** No Docker, no staging/prod infrastructure
- **Monitoring:** No logs, metrics, error tracking
- **Testing:** No test suite

---

## 🔗 Key Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|-----------|
| **React + TypeScript** | Type safety, fast development, component reuse | Slightly more verbose, but caught bugs at dev time |
| **Next.js API Routes** | Simplified backend, no separate server needed | Tightly coupled to frontend, not ideal for mobile clients later |
| **Drizzle ORM** | Type-safe SQL, migrations, lightweight | Less abstraction than Prisma, more SQL knowledge required |
| **Claude (Anthropic)** | GPT-4 level reasoning, native tool use | No local LLM, cost per query, latency |
| **Materialized Views** | Fast analytics queries, pre-computed rollups | Refresh lag, storage overhead |
| **Sample Data First** | "Never a blank screen" UX principle | Data divergence over time, need sync process |
| **Dark Theme** | Lender/professional aesthetic, less eye strain | Higher design effort, less contrast for accessibility |

---

## 🚀 Recommended Next Steps (MVP → Production)

### **Week 1: Setup & Security** ✅ NOW
1. ✅ Create Supabase project
2. ✅ Push Drizzle schema (`npm run db:push`)
3. ✅ Create `.env.local` with DATABASE_URL
4. 🔜 Set up RLS policies (multi-tenant)
5. 🔜 Test Auri with real database

### **Week 2: Authentication**
1. Implement Supabase Auth (or custom JWT)
2. Protect API routes with middleware
3. Add tenant_id validation on every request
4. Update chat to use auth context
5. Create login page

### **Week 3: Data Import & Stability**
1. Build CSV import pipeline (header mapping, dedup)
2. Add error boundaries + fallback UI
3. Implement structured logging (pino)
4. ESLint + Prettier setup
5. Add API error handling

### **Week 4: Deployment & CI/CD**
1. GitHub Actions: lint → test → deploy to Vercel
2. Staging environment (separate Supabase project)
3. Production secrets via Vercel/Supabase dashboards
4. Database backup strategy (Supabase auto-backups)

### **Week 5+: Polish & Growth**
1. Unit test coverage (Jest)
2. Performance monitoring (Sentry)
3. Analytics integration
4. Export/reporting features
5. Mobile optimizations

---

## 📊 Technology Stack

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| **Frontend** | React | ^19.0.0 | ✅ Live |
| **Meta Framework** | Next.js | ^15.3.0 | ✅ Live |
| **Language** | TypeScript | ^5.8.0 | ✅ Live |
| **Styling** | Tailwind CSS | ^4.1.0 | ✅ Live (no config) |
| **Charts** | Recharts | ^2.15.0 | ✅ Live |
| **Icons** | lucide-react | ^0.510.0 | ✅ Live |
| **ORM** | Drizzle | ^0.44.0 | ⚙️ Defined, not connected |
| **Database Driver** | postgres (node) | ^3.4.5 | ✅ Live (Supabase) |
| **Database** | PostgreSQL (Supabase) | 15 | ✅ Managed, auto-scaling |
| **AI / LLM** | Anthropic SDK | ^0.57.0 | ✅ Route ready |
| **Testing** | — | — | 🔴 Not started |
| **Logging** | — | — | 🔴 Not started |
| **Auth** | — | — | 🔴 Not started |
| **Deployment** | Vercel + Supabase | — | ⚙️ Ready for production |

---

## 🔐 Security & Compliance Notes

- **PII Policy:** Aurumium stores NO borrower PII by design (only opaque loan refs)
- **Data Isolation:** Tenant-based (multi-tenant via `tenant_id`), not implemented yet
- **Rate Limiting:** Needed for `/api/assistant/chat` (Claude API costs)
- **Secrets Management:** Use `.env.local` locally, AWS Secrets/Vault in prod
- **HIPAA/RESPA:** TBD based on lender requirements

---

## 📝 Changelog

### v0.2.0 (2026-07-08) — Supabase Integration
- ✅ Dashboard UI with sample data
- ✅ Auri chat interface (UI complete, backend ready)
- ✅ Supabase PostgreSQL database (managed, RLS-ready)
- ✅ Drizzle schema pushed to Supabase
- ✅ DEPLOYMENT.md guide created
- 🔜 Authentication middleware
- 🔜 RLS policies for multi-tenant

### v0.1.0 (2026-07-08) — MVP Launch
- ✅ Dashboard UI with sample data
- ✅ Auri chat interface (UI complete, backend ready)
- ✅ Metric system centralized
- ✅ Drizzle schema + migrations defined

---

## 🤝 Contributing

When updating this document:
1. Change version bump + date at top
2. Add changelog entry (what changed, why)
3. Update status icons (✅ ⚙️ 🟠 🔴)
4. Sync with actual codebase state

---

## 📞 Documentation & References

- **DEPLOYMENT.md:** [Supabase setup guide](./DEPLOYMENT.md) ← Start here!
- **QUICKSTART.md:** [Getting started with UI](./QUICKSTART.md)
- **Auri System Prompt:** [ai/auri-system-prompt.md](./ai/auri-system-prompt.md)
- **Database Schema (DDL):** [db/schema.sql](./db/schema.sql)
- **User Flows & Features:** [docs/user-flows.md](./docs/user-flows.md)
- **Metrics Catalog:** [web/src/lib/metrics.ts](./web/src/lib/metrics.ts)

---

**Next Review:** After authentication implementation  
**Owner:** @elect (User)  
**Last Reviewed:** 2026-07-08
