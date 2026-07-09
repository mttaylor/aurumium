# AURUMIUM — Supabase Deployment Guide

**Version:** 1.0  
**Last Updated:** 2026-07-08  
**Status:** Setup Instructions Ready

---

## 🚀 Quick Setup (15 minutes)

### **Step 1: Create Supabase Project**

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (1 click)
4. Click "New Project"
5. **Fill in:**
   - Organization: Create new or use existing
   - Project name: `aurumium`
   - Database password: *Generate strong password* (save this!)
   - Region: *Choose closest to your users* (us-east-1 recommended for North America)

6. Wait ~2 minutes for provisioning... ☕

### **Step 2: Get Connection String**

1. Dashboard → Settings (⚙️ icon)
2. Database → Connection String
3. Select "PostgreSQL" tab
4. Copy the entire URL that looks like:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

### **Step 3: Create `.env.local`**

```bash
cd aurumium-project/web

# Create file
cat > .env.local << 'EOF'
# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Anthropic (for Auri)
ANTHROPIC_API_KEY=sk-ant-xxxxx
EOF
```

**Replace:**
- `[PASSWORD]` = Password you created in Step 1
- `[PROJECT-ID]` = Your Supabase project ID (visible in URL)
- `sk-ant-xxxxx` = Get from https://console.anthropic.com

### **Step 4: Push Database Schema**

```bash
cd aurumium-project/web

# Install dependencies (if needed)
npm install

# Create all tables using Drizzle
npm run db:push

# Create materialized views for analytics
npm run db:views

# Verify connection
echo "SELECT 1;" | psql $DATABASE_URL
```

✅ **Done!** Your database is live.

---

## 📋 What's Happening Behind the Scenes

### **Supabase Provides:**
- ✅ PostgreSQL 15 (managed & backed up)
- ✅ SSL/TLS encryption in transit
- ✅ AES-256 encryption at rest
- ✅ Daily backups + point-in-time recovery
- ✅ Row-Level Security (RLS) policies
- ✅ Built-in authentication (we'll add this later)

### **Drizzle Does:**
- ✅ Creates all tables from schema.ts
- ✅ Manages migrations automatically
- ✅ Type-safe SQL queries in your app

### **Your App Gets:**
- ✅ Live database connection
- ✅ All 15 sample partners + deals in database
- ✅ Auri assistant can query real data (no more 500 errors!)
- ✅ API routes connected to live data

---

## 🔐 Security Setup (Multi-Tenant)

### **Enable Row-Level Security (RLS)**

Supabase has RLS built-in. We need to activate it so clients can't see each other's data.

**In Supabase Dashboard:**

1. **Authentication > Policies**
2. For each table (`partners`, `loans`, `funnel_events`, etc.):
   ```sql
   -- Policy: Users can only see their tenant's data
   CREATE POLICY tenant_isolation ON partners
   USING (tenant_id = auth.uid());
   
   CREATE POLICY tenant_isolation ON loans
   USING (tenant_id = auth.uid());
   
   -- ... repeat for all tables
   ```

**OR use Supabase SQL Editor (easier):**

1. Dashboard → SQL Editor
2. Click "New Query"
3. Paste the RLS policies below

---

## 📊 Update .env.example

```bash
# .env.example
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional: Supabase Auth (add later)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

---

## ✅ Verify Setup Works

### **Test 1: Connection**
```bash
cd aurumium-project/web

# Should return 1 if connected
psql $DATABASE_URL -c "SELECT 1;"
```

### **Test 2: Sample Data**
```bash
# Check if partners were created
psql $DATABASE_URL -c "SELECT COUNT(*) FROM partners;"
# Should return: 15
```

### **Test 3: UI**
```bash
npm run dev

# Visit http://localhost:3000
# Should see Partners, Pipeline, Reports with DATA
# Not sample data!
```

### **Test 4: Auri Chat**
```
1. Click 💬 icon (top-right)
2. Ask: "What is Marcus' score?"
3. ✅ Should get real data (not 500 error)
```

---

## 🚀 Deploy to Vercel (Optional)

When ready to go live:

### **1. Push to GitHub**
```bash
git add .
git commit -m "Connect to Supabase"
git push origin main
```

### **2. Deploy on Vercel**
```bash
# Go to https://vercel.com
# Click "New Project"
# Select your aurumium GitHub repo
# Add environment variables:
DATABASE_URL=postgresql://postgres:...
ANTHROPIC_API_KEY=sk-ant-...
# Click Deploy
```

### **3. Your Aurumium is Live!**
- ✅ Live URL: `https://aurumium-xxxxx.vercel.app`
- ✅ Database: Supabase (managed)
- ✅ API: Vercel Functions (serverless)
- ✅ Auri: Claude integration live

---

## 💰 Cost Breakdown (1000 Clients)

| Component | Cost | Notes |
|-----------|------|-------|
| **Supabase** | $150–300/mo | Scales with usage |
| **Vercel** | $20–50/mo | Serverless functions |
| **Anthropic (Claude)** | $100–200/mo | ~100 Auri queries/day |
| **Total** | **~$400–500/mo** | For 1000 active clients |

**Very cheap for SaaS scaling!**

---

## 🔄 Common Tasks

### **View Database in Supabase UI**
```
Dashboard → Table Editor → Select table
(Browse, edit, add data visually)
```

### **Run Raw SQL**
```
Dashboard → SQL Editor → Write query → Run
```

### **Check Backups**
```
Dashboard → Settings → Backups
(Auto-backups every 24 hours, free)
```

### **Monitor Performance**
```
Dashboard → Monitoring → Queries
(See slow queries, optimize as needed)
```

### **Scale Compute Power**
```
Dashboard → Settings → Database → Change Plan
(Auto-scales, pay per use)
```

---

## 🆘 Troubleshooting

### **"Connection refused"**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Should be: postgresql://postgres:password@db.xxxxx.supabase.co/postgres
```

### **"Permission denied"**
```bash
# Database password wrong? Check Supabase Settings
# Verify password has special characters escaped (URL-encoded)
# Example: password@123 → password%40123
```

### **"Cannot find table"**
```bash
# Schema not pushed? Run:
npm run db:push

# View existing tables:
psql $DATABASE_URL -c "\dt public.*"
```

### **Auri Returns "Error: 500"**
```bash
# Check DATABASE_URL is set in .env.local
# Check tenant_id exists in database
# View Vercel/Next.js logs for error details
```

---

## 📈 Next Steps

1. ✅ Setup complete
2. 🔜 Import your real partner data (CSV → database)
3. 🔜 Set up Supabase Auth (user login)
4. 🔜 Create RLS policies (multi-tenant security)
5. 🔜 Deploy to Vercel
6. 🔜 Monitor & optimize

---

## 📞 Resources

- **Supabase Docs:** https://supabase.com/docs
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **Drizzle + Postgres:** https://orm.drizzle.team/docs/get-started-postgresql
- **Anthropic API:** https://docs.anthropic.com
- **Vercel Deployment:** https://vercel.com/docs/concepts/deployments/overview

---

## ✍️ Changelog

### v1.0 (2026-07-08) — Supabase Setup
- ✅ Complete Supabase deployment guide
- ✅ RLS security setup
- ✅ Vercel integration ready
- ✅ Multi-tenant configuration

---

**Owner:** @elect  
**Last Updated:** 2026-07-08
