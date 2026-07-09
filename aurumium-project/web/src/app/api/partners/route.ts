import { NextRequest, NextResponse } from "next/server";
import { partnerRollups, activeWeights } from "@/db/client";
import { computeScore } from "@/lib/score";

/** GET /api/partners?tenant_id=...
 *  Full scored roster, sorted by score desc. The frontend derives the
 *  top-10 and bottom-5 "Partners to Nurture" from this one payload. */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id required" }, { status: 400 });

  const [rows, weights] = await Promise.all([
    partnerRollups(tenantId),
    activeWeights(tenantId),
  ]);
  const scored = rows
    .map((r) => ({ ...r, score: computeScore(r, weights ?? undefined) }))
    .sort((a, b) => b.score - a.score);
  return NextResponse.json(scored);
}
