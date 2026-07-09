import { NextRequest, NextResponse } from "next/server";
import { partnerRollups, activeWeights } from "@/db/client";
import { computeScore } from "@/lib/score";
import { computeAllMetrics } from "@/lib/metrics";

/** GET /api/partners/:id?tenant_id=...
 *  Profile payload: rollup counts + score + all 10 metrics at partner level. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id required" }, { status: 400 });

  const [rows, weights] = await Promise.all([
    partnerRollups(tenantId, id),
    activeWeights(tenantId),
  ]);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  return NextResponse.json({
    ...row,
    score: computeScore(row, weights ?? undefined),
    metrics: computeAllMetrics(row),
  });
}
