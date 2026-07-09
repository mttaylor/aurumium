import { NextRequest, NextResponse } from "next/server";
import { activePipeline } from "@/db/client";

/** GET /api/pipeline?tenant_id=...&stage=contract
 *  In-flight loans, worst staleness first, with stale flags. */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  const stage = req.nextUrl.searchParams.get("stage") ?? undefined;
  if (!tenantId) return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  return NextResponse.json(await activePipeline(tenantId, stage));
}
