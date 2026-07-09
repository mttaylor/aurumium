import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { dashboardConfigs } from "@/db/schema";
import { PRESET_SLOTS } from "@/lib/metrics";

/** The starting template every new user gets — matches the prototype. */
const DEFAULT_LAYOUT = {
  kpis: ["mtd_leads", "ytd_units", "ytd_volume", "active_pipeline"],
  metric_slots: PRESET_SLOTS, // the 10 preset ratio cards — shared type, cannot drift
  panels: { top_partners: true, nurture: true, funnel: true },
};

/** GET /api/config/dashboard?user_id=...
 *  Returns the user's default dashboard, creating one from the template
 *  on first touch — a new user never sees a blank screen. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const existing = await db.query.dashboardConfigs.findFirst({
    where: and(eq(dashboardConfigs.userId, userId), eq(dashboardConfigs.isDefault, true)),
  });
  if (existing) return NextResponse.json(existing);

  const [created] = await db
    .insert(dashboardConfigs)
    .values({ userId, isDefault: true, layout: DEFAULT_LAYOUT })
    .returning();
  return NextResponse.json(created);
}

/** PUT /api/config/dashboard  { id, layout }
 *  Swapping a metric card, reordering KPIs, hiding a panel — all just this. */
export async function PUT(req: NextRequest) {
  const { id, layout } = await req.json();
  if (!id || !layout) return NextResponse.json({ error: "id and layout required" }, { status: 400 });
  await db
    .update(dashboardConfigs)
    .set({ layout, updatedAt: new Date() })
    .where(eq(dashboardConfigs.id, id));
  return NextResponse.json({ ok: true });
}
