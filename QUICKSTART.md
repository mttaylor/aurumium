# AURUMIUM — Quick Start & Preview

## 🚀 See It Live Right Now

The dashboard is **already running** at http://localhost:3000

### What You Can Do Right Now (No Database Needed)

1. **Dashboard Tab** — View KPIs, partner scores, sample metrics
2. **Partners Tab** — Browse 15 sample referral partners, click to see profiles
3. **Pipeline Tab** — See mock in-flight loans with stages
4. **Reports Tab** — Charts showing conversion rates & trends
5. **Partner Profiles** — Click any partner to see funnel breakdown & detailed metrics
6. **Auri Chat** 💬 — Click the chat icon in the top-right to open assistant

### Try Auri (Chat Will Error, But UI Works)

```
User: "What is Marcus' score?"
Auri: Error: 500 (database not connected)
```

This is expected! The chat UI is **100% functional**, but the backend tries to query the database.

---

## 📋 Feature Matrix

| Feature | Status | Database Needed? | Try It |
|---------|--------|------------------|--------|
| Dashboard View | ✅ Live | No | Click "Dashboard" tab |
| Partners Table | ✅ Live | No | Click "Partners" tab, search, sort |
| Partner Profile | ✅ Live | No | Click any partner row |
| Pipeline View | ✅ Live | No | Click "Pipeline" tab |
| Reports & Charts | ✅ Live | No | Click "Reports" tab |
| **Auri Chat UI** | ✅ Live | No | Click 💬 icon (UI only) |
| **Auri Responses** | ⚠️ Awaits DB | **Yes** | Sends 500 error for now |
| Live Partner Data | 🔴 Not Running | **Yes** | Currently returns sample data |
| Authentication | 🔴 Not Implemented | — | No login needed yet |

---

## 🎯 What's Working Behind the Scenes

### Code That's Ready (Just Needs Database)

1. **`/api/assistant/chat`** — Claude integration with tool use (get_partner_metrics, get_stale_pipeline, etc.)
2. **Auri System Prompt** — `ai/auri-system-prompt.md` fully written with personality & rules
3. **Metrics Catalog** — `lib/metrics.ts` defines all 10 metrics (same for UI, API, and Auri)
4. **Drizzle Schema** — All tables defined, ready for `npm run db:push`
5. **API Routes** — `/api/partners`, `/api/metrics`, `/api/pipeline` all defined

### What Still Needs Building

1. **Database Connection** — Postgres instance + `.env.local` with `DATABASE_URL`
2. **Authentication** — JWT or session-based auth middleware
3. **Data Import** — CSV upload → database pipeline
4. **Error Handling** — Graceful fallbacks when things fail
5. **Production Deployment** — Docker, CI/CD, secrets management

---

## 🔧 To Connect Your Database (When Ready)

### Step 1: Start Postgres
```bash
# Using Docker (recommended)
docker run --name aurumium-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=aurumium \
  -p 5432:5432 \
  postgres:15
```

### Step 2: Create `.env.local`
```bash
cd aurumium-project/web
cp .env.example .env.local

# Edit .env.local:
DATABASE_URL=postgresql://postgres:password@localhost:5432/aurumium
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Get from https://console.anthropic.com
```

### Step 3: Wire the Database
```bash
npm run db:push      # Create tables
npm run db:views     # Create materialized views
```

### Step 4: Restart Dev Server
```bash
npm run dev
```

Now Auri will have real data and can answer questions! 🎉

---

## 📸 Screenshots of What's Live

- **Dashboard KPIs** — 79 MTD Leads, 241 YTD Units, etc.
- **Partner Scores** — Gold medallion badges (0-1000 scale)
- **Funnel Charts** — Leads → Credit Pulls → Closes
- **Auri Chat Panel** — Slides in from right, professionally styled
- **Pipeline Table** — Loan stages with alerts for stale deals

---

## 🎓 Understanding the Architecture

```
[Your Browser] ←HTTP→ [Next.js Dev Server] ←→ [Sample Data]
                                          ←→ [Postgres] (when connected)
                                          ←→ [Anthropic Claude] (Auri)
```

**Currently:**
- Dashboard reads **sample data** from `lib/sample-data.ts` ✅
- Auri's backend is ready but can't query the database ⚠️

**When database is connected:**
- Dashboard will read **live partner data** from Postgres ✅
- Auri will call tools to fetch real metrics ✅
- You'll have a fully functional referral intelligence platform 🎉

---

## 🆘 Troubleshooting

### Chat Returns "Error: API error: 500"
→ This is correct! Database isn't connected. See "To Connect Your Database" above.

### Dashboard Shows Same 15 Partners Every Time
→ That's the sample data. It won't change until you import real data.

### Localhost:3000 Won't Load
→ Make sure dev server is running:
```bash
cd aurumium-project/web
npm run dev
```

### Next.js Dev Tools Showing?
→ That's the Next.js toolbar (bottom-left corner). You can ignore it or disable it in `.next/config.js`.

---

## 📞 Next Steps

1. ✅ **You've seen the UI** — It's working!
2. 🔜 **Set up Postgres** — When you're ready for real data
3. 🔜 **Implement Auth** — User login & multi-tenant isolation
4. 🔜 **Import Data** — Connect your LOS/CRM
5. 🔜 **Deploy** — Docker + production environment

---

**Architecture & future plans:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
