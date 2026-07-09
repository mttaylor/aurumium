import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { sql, partnerRollups, activeWeights, activePipeline, bookRollup, STALE_DAYS } from "@/db/client";
import { computeScore } from "@/lib/score";
import { computeAllMetrics, METRICS } from "@/lib/metrics";

/**
 * Auri — the in-product assistant. Three layers so it keeps learning:
 *   1. Versioned system prompt (ai/auri-system-prompt.md) — behavior changes are PRs.
 *   2. assistant_knowledge rows — append release notes/definitions each release.
 *   3. Tools — Auri never guesses numbers; it calls the same queries the UI uses.
 */
const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "..", "ai", "auri-system-prompt.md"),
  "utf-8",
);

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_partner_metrics",
    description: "Fetch funnel counts, all 10 ratio metrics, and the score for one referral partner by (partial) name.",
    input_schema: {
      type: "object",
      properties: { partner_name: { type: "string" } },
      required: ["partner_name"],
    },
  },
  {
    name: "get_book_metrics",
    description: "Fetch aggregate funnel counts and all 10 ratios across the whole book of business.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_stale_pipeline",
    description: `List in-flight loans stuck in their current stage past the staleness threshold (${STALE_DAYS} days).`,
    input_schema: { type: "object", properties: {} },
  },
];

async function runTool(name: string, input: any, tenantId: string): Promise<string> {
  if (name === "get_partner_metrics") {
    const rows = await sql`
      select p.id, p.name, p.company, r.*
      from partners p join partner_funnel_rollup r on r.partner_id = p.id
      where p.tenant_id = ${tenantId} and p.name ilike ${"%" + input.partner_name + "%"}
      limit 1`;
    const row = rows[0];
    if (!row) return JSON.stringify({ error: "No partner matched that name." });
    const weights = await activeWeights(tenantId);
    return JSON.stringify({
      name: row.name, company: row.company,
      score: computeScore(row as any, weights ?? undefined),
      metrics: computeAllMetrics(row as any),
      counts: { leads: row.leads, contracts: row.contracts, closes: row.closes, canceled: row.canceled },
    });
  }
  if (name === "get_book_metrics") {
    const rollup = await bookRollup(tenantId);
    return JSON.stringify({ counts: rollup, metrics: computeAllMetrics(rollup) });
  }
  if (name === "get_stale_pipeline") {
    const rows = await activePipeline(tenantId);
    return JSON.stringify(rows.filter((r: any) => r.stale).slice(0, 20));
  }
  return JSON.stringify({ error: `Unknown tool ${name}` });
}

async function loadKnowledge(tenantId: string): Promise<string> {
  const rows = await sql`
    select kind, title, content from assistant_knowledge
    where tenant_id is null or tenant_id = ${tenantId}
    order by updated_at desc limit 40`;
  return rows.map((r: any) => `[${r.kind}] ${r.title}\n${r.content}`).join("\n\n");
}

/** POST /api/assistant/chat  { tenant_id, messages: [{role, content}] } */
export async function POST(req: NextRequest) {
  const { tenant_id, messages } = await req.json();
  if (!tenant_id) return NextResponse.json({ error: "tenant_id required" }, { status: 400 });

  const knowledge = await loadKnowledge(tenant_id);
  const metricDefs = Object.entries(METRICS)
    .map(([k, m]) => `- ${k}: ${m.label} (${m.goodDirection} is good)`)
    .join("\n");
  const system = `${SYSTEM_PROMPT}\n\n# Metric catalog\n${metricDefs}\n\n# Current product knowledge (freshest first)\n${knowledge}`;

  const convo: Anthropic.MessageParam[] = [...messages];

  // Agentic loop: keep going while Auri requests tools (bounded).
  for (let i = 0; i < 5; i++) {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system,
      tools: TOOLS,
      messages: convo,
    });

    if (resp.stop_reason !== "tool_use") {
      return NextResponse.json({ content: resp.content });
    }

    convo.push({ role: "assistant", content: resp.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of resp.content) {
      if (block.type === "tool_use") {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: await runTool(block.name, block.input, tenant_id),
        });
      }
    }
    convo.push({ role: "user", content: toolResults });
  }

  return NextResponse.json({
    content: [{ type: "text", text: "I hit my tool-call limit — try a narrower question." }],
  });
}
