import { NextRequest, NextResponse } from "next/server";
import { bookRollup } from "@/db/client";
import { computeAllMetrics } from "@/lib/metrics";

/** GET /api/metrics?tenant_id=...
 *  All 10 ratios across the whole book of business.
 *  (No /catalog endpoint needed — UI and Auri import lib/metrics.ts directly.) */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  const rollup = await bookRollup(tenantId);
  return NextResponse.json(computeAllMetrics(rollup));
}
