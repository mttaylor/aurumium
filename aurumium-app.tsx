"use client";

/**
 * AURUMIUM dashboard UI — typed port of the prototype.
 * Data source: sample data (lib/sample-data.ts), which is RollupRow-shaped —
 * identical to /api/partners output. Wiring live data = swapping the imports
 * for fetches; no component changes needed.
 */
import React, { useState, useMemo } from "react";
import {
  Phone, Mail, CalendarPlus, MessageSquare, Plus, ChevronLeft,
  ChevronDown, RotateCcw, TrendingUp, TrendingDown, Search, Bell,
  ArrowUpDown, Download, FileText, AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { METRICS, PRESET_SLOTS, formatMetric, type MetricKey, type RollupRow } from "@/lib/metrics";
import { SAMPLE_PARTNERS, SAMPLE_DEALS, sampleBookRollup, rng, type PartnerRow, type Deal } from "@/lib/sample-data";

/* ---------- data (sample until live wiring) ---------- */
const TOP10 = SAMPLE_PARTNERS.slice(0, 10);
const NURTURE = SAMPLE_PARTNERS.slice(-5).reverse();
const BOOK = sampleBookRollup();

const MONTHS = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
const TREND = (() => {
  const r = rng(42);
  return MONTHS.map((m, i) => ({ m, closes: Math.round(14 + r() * 10 + i * 0.9) }));
})();

const usd = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/* ---------- theme ---------- */
const C = {
  bg: "#0A0A0C", panel: "#121215", panelUp: "#17171B", line: "#232329",
  text: "#ECEAE3", dim: "#8E8F97", faint: "#5C5D66",
  gold: "#D4B876", goldDeep: "#8E7440", goldHi: "#F0E2B6",
  red: "#B05C5C", green: "#7FA98B",
};
const goldGrad = `linear-gradient(135deg, ${C.goldDeep} 0%, ${C.gold} 45%, ${C.goldHi} 70%, ${C.gold} 100%)`;

const CSS = `
  .au-root { font-family: var(--font-body), sans-serif; background: ${C.bg}; color: ${C.text}; min-height: 100vh; }
  .au-display { font-family: var(--font-display), sans-serif; }
  .au-mono { font-family: var(--font-mono), monospace; }
  .au-gold-text { background: ${goldGrad}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  .au-panel { background: ${C.panel}; border: 1px solid ${C.line}; border-radius: 14px; }
  .au-hover-row { transition: background .15s ease; cursor: pointer; }
  .au-hover-row:hover { background: ${C.panelUp}; }
  .au-card { transition: border-color .2s ease; }
  .au-card:hover { border-color: ${C.goldDeep}; }
  .au-btn { transition: all .15s ease; cursor: pointer; }
  .au-btn:hover { border-color: ${C.gold} !important; color: ${C.goldHi} !important; }
  .au-fade-in { animation: auFade .35s ease both; }
  @keyframes auFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .au-root ::-webkit-scrollbar { width: 8px; height: 8px; }
  .au-root ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
  .au-root button:focus-visible, .au-root [tabindex]:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
  .au-input { background: ${C.panelUp}; border: 1px solid ${C.line}; border-radius: 8px; color: ${C.text};
    padding: 8px 12px 8px 34px; font-size: 13px; font-family: var(--font-body), sans-serif; width: 240px; }
  .au-input:focus { outline: none; border-color: ${C.goldDeep}; }
  .au-th { font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: ${C.faint};
    font-weight: 600; text-align: left; padding: 10px 14px; cursor: pointer; user-select: none; white-space: nowrap; }
  .au-td { padding: 11px 14px; font-size: 13px; border-top: 1px solid ${C.line}; white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { .au-fade-in { animation: none; } .au-radial-btn { transition: none !important; } }
`;

/* ---------- small pieces ---------- */
function Medallion({ score, size = 44, stroke = 3 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(score / 1000, 1);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="auGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.goldDeep} />
          <stop offset="55%" stopColor={C.gold} />
          <stop offset="100%" stopColor={C.goldHi} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#auGold)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${circ * fill} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        fill={C.goldHi} fontSize={size * 0.28} fontFamily="var(--font-mono), monospace" fontWeight="500">
        {score}
      </text>
    </svg>
  );
}

function sparkSeries(seed: number) {
  const r = rng(seed);
  return Array.from({ length: 12 }, (_, i) => ({ i, v: 40 + r() * 60 }));
}

function Sparkline({ seed, down }: { seed: number; down: boolean }) {
  return (
    <div style={{ width: "100%", height: 34 }}>
      <ResponsiveContainer>
        <AreaChart data={sparkSeries(seed)} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={`sp${seed}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={down ? C.red : C.gold} stopOpacity={0.25} />
              <stop offset="100%" stopColor={down ? C.red : C.gold} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={down ? C.red : C.gold} strokeWidth={1.4}
            fill={`url(#sp${seed})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: C.faint, fontWeight: 600 }}>
    {children}
  </div>
);

const chartTooltip = {
  contentStyle: { background: C.panelUp, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 12 },
  labelStyle: { color: C.dim },
  itemStyle: { color: C.goldHi },
  cursor: { fill: "rgba(212,184,118,.06)" },
};

/* ---------- metric card (preset, but swappable per slot) ---------- */
function MetricCard({
  slotIndex, metricKey, onSwap, row, swappable = true,
}: {
  slotIndex: number; metricKey: MetricKey;
  onSwap: (i: number, k: MetricKey) => void;
  row: RollupRow; swappable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const m = METRICS[metricKey];
  const value = m.compute(row);
  const seed = slotIndex + 1;
  const delta = ((seed * 37) % 90) / 10 - 3.2;
  const deltaGood = m.goodDirection === "up" ? delta >= 0 : delta < 0;

  return (
    <div className="au-panel au-card" style={{ padding: "14px 16px 10px", position: "relative", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <Eyebrow>{m.label}</Eyebrow>
        {swappable && (
          <button onClick={() => setOpen((o) => !o)} aria-label="Change metric"
            style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", padding: 2, marginTop: -4 }}>
            <ChevronDown size={14} />
          </button>
        )}
      </div>
      <div className="au-mono" style={{ fontSize: 24, fontWeight: 300, marginTop: 8 }}>
        {formatMetric(m.kind, value)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, marginBottom: 6 }}>
        {deltaGood ? <TrendingUp size={12} color={C.green} /> : <TrendingDown size={12} color={C.red} />}
        <span className="au-mono" style={{ fontSize: 11, color: deltaGood ? C.green : C.red }}>
          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs last qtr
        </span>
      </div>
      <Sparkline seed={seed + (metricKey.length * 7)} down={m.goodDirection === "down"} />
      {open && (
        <div style={{
          position: "absolute", top: 34, right: 10, zIndex: 30, width: 210,
          background: C.panelUp, border: `1px solid ${C.line}`, borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0,0,0,.55)", padding: 6, maxHeight: 240, overflowY: "auto",
        }}>
          {(Object.keys(METRICS) as MetricKey[]).map((k) => (
            <button key={k} onClick={() => { onSwap(slotIndex, k); setOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "7px 10px",
                background: k === metricKey ? "rgba(212,184,118,.08)" : "none",
                border: "none", borderRadius: 7, cursor: "pointer",
                color: k === metricKey ? C.goldHi : C.dim, fontSize: 12, fontFamily: "var(--font-body), sans-serif",
              }}>
              {METRICS[k].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- radial actions (nurture list) ---------- */
function RadialActions({ partnerId, openId, setOpenId }: {
  partnerId: string; openId: string | null; setOpenId: (id: string | null) => void;
}) {
  const open = openId === partnerId;
  const actions = [
    { Icon: Phone, label: "Call" }, { Icon: Mail, label: "Email" },
    { Icon: CalendarPlus, label: "Schedule" }, { Icon: MessageSquare, label: "Note" },
  ];
  return (
    <div style={{ position: "relative", width: 34, height: 34 }}>
      {actions.map(({ Icon, label }, i) => {
        const angle = (-180 + i * 42) * (Math.PI / 180);
        const dist = open ? 46 : 0;
        return (
          <button key={label} title={label} aria-label={label} className="au-radial-btn au-btn"
            onClick={() => setOpenId(null)}
            style={{
              position: "absolute", left: 0, top: 0, width: 32, height: 32, borderRadius: "50%",
              background: C.panelUp, border: `1px solid ${C.goldDeep}`, color: C.gold,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(${open ? 1 : 0.4})`,
              opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
              transition: `all .22s cubic-bezier(.34,1.4,.64,1) ${i * 0.03}s`, zIndex: 20,
            }}>
            <Icon size={14} />
          </button>
        );
      })}
      <button onClick={() => setOpenId(open ? null : partnerId)}
        aria-label={open ? "Close actions" : "Open actions"} className="au-btn"
        style={{
          position: "relative", zIndex: 21, width: 34, height: 34, borderRadius: "50%",
          background: open ? "rgba(212,184,118,.12)" : C.panel, border: `1px solid ${C.line}`,
          color: C.gold, display: "flex", alignItems: "center", justifyContent: "center",
          transform: open ? "rotate(45deg)" : "none", transition: "transform .2s ease",
        }}>
        <Plus size={16} />
      </button>
    </div>
  );
}

/* ---------- funnel bars ---------- */
function Funnel({ row }: { row: RollupRow }) {
  const stages: [string, number][] = [
    ["Leads", row.leads], ["Credit Pulls", row.credit_pulls],
    ["Pre-Approvals", row.pre_approvals], ["Contracts", row.contracts], ["Closes", row.closes],
  ];
  const max = stages[0][1] || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {stages.map(([label, v], i) => (
        <div key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: C.dim }}>{label}</span>
            <span className="au-mono" style={{ color: i === stages.length - 1 ? C.goldHi : C.text }}>
              {v.toLocaleString()}{i > 0 && <span style={{ color: C.faint }}>{"  ·  "}{((v / max) * 100).toFixed(0)}%</span>}
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: C.panelUp, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${(v / max) * 100}%`, borderRadius: 4,
              background: i === stages.length - 1 ? goldGrad : `rgba(212,184,118,${0.18 + i * 0.12})`,
              transition: "width .5s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- partner profile ---------- */
function PartnerProfile({ p, onBack }: { p: PartnerRow; onBack: () => void }) {
  const volumeCents = p.closes * (p.avg_comp_cents ?? 0) * 92;
  return (
    <div className="au-fade-in">
      <button onClick={onBack} className="au-btn" style={{
        display: "flex", alignItems: "center", gap: 6, background: "none",
        border: `1px solid ${C.line}`, borderRadius: 8, color: C.dim,
        padding: "7px 14px", fontSize: 12, marginBottom: 20, fontFamily: "var(--font-body), sans-serif",
      }}>
        <ChevronLeft size={14} /> Back
      </button>

      <div className="au-panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 22, marginBottom: 18, flexWrap: "wrap" }}>
        <Medallion score={p.score} size={84} stroke={5} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="au-display" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.15 }}>{p.name}</div>
          <div style={{ color: C.dim, fontSize: 13, marginTop: 4 }}>{p.company}</div>
        </div>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
          {([["Closes YTD", String(p.closes)], ["Volume YTD", usd(volumeCents)],
             ["Avg Days to Close", String(Math.round(p.avg_lead_to_funded_days ?? 0))]] as [string, string][])
            .map(([l, v]) => (
              <div key={l}>
                <Eyebrow>{l}</Eyebrow>
                <div className="au-mono" style={{ fontSize: 20, fontWeight: 300, marginTop: 5 }}>{v}</div>
              </div>
            ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 2fr", gap: 14, alignItems: "start" }}>
        <div className="au-panel" style={{ padding: 20 }}>
          <Eyebrow>Lending cycle · this partner</Eyebrow>
          <div style={{ height: 14 }} />
          <Funnel row={p} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {PRESET_SLOTS.map((k, i) => (
            <MetricCard key={k} slotIndex={i} metricKey={k} onSwap={() => {}} row={p} swappable={false} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- partners view ---------- */
function PartnersView({ onSelect }: { onSelect: (p: PartnerRow) => void }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("score");
  const [dir, setDir] = useState(-1);

  const cols: { key: string; label: string; get: (p: PartnerRow) => number | string }[] = [
    { key: "name",   label: "Partner",       get: (p) => p.name },
    { key: "score",  label: "Score",         get: (p) => p.score },
    { key: "leads",  label: "Leads",         get: (p) => p.leads },
    { key: "closes", label: "Closes",        get: (p) => p.closes },
    { key: "l2c",    label: "Lead → Close",  get: (p) => p.closes / p.leads },
    { key: "canx",   label: "Canx Rate",     get: (p) => p.canceled / p.contracts },
    { key: "comp",   label: "Avg Comp",      get: (p) => p.avg_comp_cents ?? 0 },
    { key: "days",   label: "Days to Close", get: (p) => p.avg_lead_to_funded_days ?? 0 },
  ];

  const rows = useMemo(() => {
    const col = cols.find((c) => c.key === sortKey)!;
    return SAMPLE_PARTNERS
      .filter((p) => (p.name + " " + (p.company ?? "")).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        const av = col.get(a), bv = col.get(b);
        return (typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)) * dir;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sortKey, dir]);

  return (
    <div className="au-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="au-display" style={{ fontSize: 22, fontWeight: 600 }}>Partners</div>
          <div style={{ fontSize: 12.5, color: C.dim, marginTop: 2 }}>{SAMPLE_PARTNERS.length} referral partners</div>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: 11, color: C.faint }} />
          <input className="au-input" placeholder="Search name or brokerage" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="au-panel" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} className="au-th"
                  onClick={() => { if (sortKey === c.key) setDir(-dir); else { setSortKey(c.key); setDir(-1); } }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: sortKey === c.key ? C.gold : undefined }}>
                    {c.label} <ArrowUpDown size={11} style={{ opacity: sortKey === c.key ? 1 : 0.35 }} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="au-hover-row" onClick={() => onSelect(p)}>
                <td className="au-td">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Medallion score={p.score} size={34} stroke={2.5} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.faint }}>{p.company}</div>
                    </div>
                  </div>
                </td>
                <td className="au-td au-mono" style={{ color: C.goldHi }}>{p.score}</td>
                <td className="au-td au-mono">{p.leads}</td>
                <td className="au-td au-mono">{p.closes}</td>
                <td className="au-td au-mono">{pct(p.closes / p.leads)}</td>
                <td className="au-td au-mono" style={{ color: p.canceled / p.contracts > 0.2 ? C.red : undefined }}>
                  {pct(p.canceled / p.contracts)}
                </td>
                <td className="au-td au-mono">{usd(p.avg_comp_cents ?? 0)}</td>
                <td className="au-td au-mono">{Math.round(p.avg_lead_to_funded_days ?? 0)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="au-td" colSpan={8} style={{ color: C.dim, textAlign: "center", padding: 28 }}>
                No partners match “{q}”. Clear the search to see all partners.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- pipeline view ---------- */
function PipelineView({ onSelect }: { onSelect: (p: PartnerRow) => void }) {
  const [stageFilter, setStageFilter] = useState<string>("All");
  const STALE = 18;
  const stages = ["Credit Pull", "Pre-Approval", "Contract"] as const;
  const byStage = stages.map((s) => {
    const deals = SAMPLE_DEALS.filter((d) => d.stage === s);
    return { s, count: deals.length, comp: deals.reduce((a, d) => a + d.estCompCents, 0) };
  });
  const rows = stageFilter === "All" ? SAMPLE_DEALS : SAMPLE_DEALS.filter((d) => d.stage === stageFilter);

  return (
    <div className="au-fade-in">
      <div className="au-display" style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Pipeline</div>
      <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 16 }}>
        {SAMPLE_DEALS.length} in-flight loans · est. {usd(SAMPLE_DEALS.reduce((a, d) => a + d.estCompCents, 0))} in pending compensation
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 18 }}>
        {byStage.map(({ s, count, comp }) => (
          <button key={s} onClick={() => setStageFilter(stageFilter === s ? "All" : s)}
            className="au-panel au-card au-btn"
            style={{ padding: "16px 18px", textAlign: "left", borderColor: stageFilter === s ? C.goldDeep : undefined, fontFamily: "var(--font-body), sans-serif" }}>
            <Eyebrow>{s}</Eyebrow>
            <div className="au-mono au-gold-text" style={{ fontSize: 26, fontWeight: 300, marginTop: 6 }}>{count}</div>
            <div style={{ fontSize: 11.5, color: C.dim, marginTop: 2 }}>est. {usd(comp)} pending</div>
          </button>
        ))}
      </div>

      <div className="au-panel" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Loan", "Referral Partner", "Stage", "Days in Stage", "Est. Comp"].map((h) => (
                <th key={h} className="au-th" style={{ cursor: "default" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d: Deal) => (
              <tr key={d.id} className="au-hover-row" onClick={() => onSelect(d.partner)}>
                <td className="au-td au-mono" style={{ color: C.goldHi }}>{d.id}</td>
                <td className="au-td">
                  <div style={{ fontWeight: 600 }}>{d.partner.name}</div>
                  <div style={{ fontSize: 11, color: C.faint }}>{d.partner.company}</div>
                </td>
                <td className="au-td">
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20,
                    border: `1px solid ${C.line}`, background: C.panelUp, color: C.dim,
                  }}>{d.stage}</span>
                </td>
                <td className="au-td au-mono">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: d.daysIn > STALE ? C.red : undefined }}>
                    {d.daysIn > STALE && <AlertTriangle size={12} />}{d.daysIn}
                  </span>
                </td>
                <td className="au-td au-mono">{usd(d.estCompCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11.5, color: C.faint, marginTop: 10 }}>
        Rows flagged in red have sat in stage longer than {STALE} days. Click any row to open the partner’s profile.
      </div>
    </div>
  );
}

/* ---------- reports view ---------- */
function ReportsView() {
  const convData = SAMPLE_PARTNERS.slice(0, 8).map((p) => ({
    name: p.name.split(" ")[0], rate: Math.round((p.closes / p.leads) * 1000) / 10,
  }));
  const reports = [
    { title: "Partner Scorecard — Q2", desc: "Score, funnel ratios, and canx analysis for every partner." },
    { title: "Referral Source ROI", desc: "Compensation earned per lead by source and brokerage." },
    { title: "Cycle Time Analysis", desc: "Days-in-stage breakdown across the lending cycle." },
    { title: "Cancellation Postmortem", desc: "Where and why contracts fell out this quarter." },
  ];

  return (
    <div className="au-fade-in">
      <div className="au-display" style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Reports</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 18 }}>
        <div className="au-panel" style={{ padding: 20 }}>
          <Eyebrow>Closed units · trailing 12 months</Eyebrow>
          <div style={{ height: 220, marginTop: 12 }}>
            <ResponsiveContainer>
              <AreaChart data={TREND} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="rptGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: C.faint, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.faint, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="closes" stroke={C.gold} strokeWidth={2} fill="url(#rptGold)" name="Closes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="au-panel" style={{ padding: 20 }}>
          <Eyebrow>Lead → close conversion · top 8 partners</Eyebrow>
          <div style={{ height: 220, marginTop: 12 }}>
            <ResponsiveContainer>
              <BarChart data={convData} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: C.faint, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.faint, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip {...chartTooltip} formatter={(v) => [`${v}%`, "Lead → Close"]} />
                <Bar dataKey="rate" fill={C.gold} radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {reports.map((r) => (
          <div key={r.title} className="au-panel au-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <FileText size={15} color={C.gold} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</span>
            </div>
            <div style={{ fontSize: 12.5, color: C.dim, flex: 1 }}>{r.desc}</div>
            <button className="au-btn" style={{
              alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6,
              background: "none", border: `1px solid ${C.line}`, borderRadius: 7,
              color: C.dim, padding: "6px 12px", fontSize: 11.5, fontFamily: "var(--font-body), sans-serif",
            }}>
              <Download size={12} /> Export CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- dashboard view ---------- */
function DashboardView({
  slots, swap, resetSlots, onSelect, radialOpen, setRadialOpen,
}: {
  slots: MetricKey[]; swap: (i: number, k: MetricKey) => void; resetSlots: () => void;
  onSelect: (p: PartnerRow) => void;
  radialOpen: string | null; setRadialOpen: (id: string | null) => void;
}) {
  const kpis = useMemo(() => {
    const volumeCents = SAMPLE_PARTNERS.reduce((a, p) => a + p.closes * (p.avg_comp_cents ?? 0) * 92, 0);
    return [
      ["MTD Leads", Math.round(BOOK.leads / 11).toLocaleString()],
      ["YTD Units", BOOK.closes.toLocaleString()],
      ["YTD Volume", `$${(volumeCents / 100 / 1e6).toFixed(1)}M`],
      ["Active Pipeline", SAMPLE_DEALS.length.toLocaleString()],
    ] as [string, string][];
  }, []);

  return (
    <div className="au-fade-in">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
        {kpis.map(([l, v]) => (
          <div key={l} className="au-panel" style={{ padding: "14px 18px" }}>
            <Eyebrow>{l}</Eyebrow>
            <div className="au-mono au-gold-text" style={{ fontSize: 27, fontWeight: 300, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 320px) 1fr", gap: 14, alignItems: "start" }}>
        <div className="au-panel" style={{ padding: "18px 0 8px" }}>
          <div style={{ padding: "0 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="au-display" style={{ fontSize: 16, fontWeight: 600 }}>Top Partners</span>
            <span className="au-mono" style={{ fontSize: 10, color: C.faint }}>BY SCORE</span>
          </div>
          {TOP10.map((p, i) => (
            <div key={p.id} className="au-hover-row" onClick={() => onSelect(p)}
              role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onSelect(p)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 20px" }}>
              <span className="au-mono" style={{ width: 18, fontSize: 11, color: i < 3 ? C.gold : C.faint }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.company}</div>
              </div>
              <Medallion score={p.score} size={40} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Eyebrow>Book of business · ratio metrics — click ⌄ on any card to swap</Eyebrow>
            <button onClick={resetSlots} className="au-btn" style={{
              display: "flex", alignItems: "center", gap: 6, background: "none",
              border: `1px solid ${C.line}`, borderRadius: 7, color: C.dim,
              padding: "5px 10px", fontSize: 11, fontFamily: "var(--font-body), sans-serif",
            }}>
              <RotateCcw size={11} /> Reset preset
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 12 }}>
            {slots.map((k, i) => (
              <MetricCard key={`${k}-${i}`} slotIndex={i} metricKey={k} onSwap={swap} row={BOOK} />
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 1.5fr", gap: 14, alignItems: "start" }}>
            <div className="au-panel" style={{ padding: 20 }}>
              <Eyebrow>Lending cycle · all partners</Eyebrow>
              <div style={{ height: 14 }} />
              <Funnel row={BOOK} />
            </div>

            <div className="au-panel" style={{ padding: "18px 0 8px", overflow: "visible" }}>
              <div style={{ padding: "0 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="au-display" style={{ fontSize: 16, fontWeight: 600 }}>Partners to Nurture</span>
                <span className="au-mono" style={{ fontSize: 10, color: C.faint }}>LOW PERFORMERS</span>
              </div>
              {NURTURE.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 20px" }}>
                  <Medallion score={p.score} size={36} />
                  <div className="au-hover-row" style={{ flex: 1, minWidth: 0, borderRadius: 8, padding: "4px 8px", margin: "0 -8px" }}
                    onClick={() => onSelect(p)} role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onSelect(p)}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.faint }}>{p.company} · {pct(p.closes / p.leads)} lead-to-close</div>
                  </div>
                  <RadialActions partnerId={p.id} openId={radialOpen} setOpenId={setRadialOpen} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- app shell ---------- */
export default function AurumiumApp() {
  const [tab, setTab] = useState("Dashboard");
  const [slots, setSlots] = useState<MetricKey[]>(PRESET_SLOTS);
  const [selected, setSelected] = useState<PartnerRow | null>(null);
  const [radialOpen, setRadialOpen] = useState<string | null>(null);

  const swap = (idx: number, key: MetricKey) =>
    setSlots((s) => s.map((v, i) => (i === idx ? key : v)));

  return (
    <div className="au-root">
      <style>{CSS}</style>

      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", borderBottom: `1px solid ${C.line}`,
        position: "sticky", top: 0, background: "rgba(10,10,12,.92)", backdropFilter: "blur(10px)", zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div aria-hidden="true" style={{
            width: 34, height: 34, borderRadius: 8, position: "relative", flexShrink: 0,
            background: "linear-gradient(135deg, #1c1a14 0%, #131210 100%)",
            boxShadow: `inset 0 0 0 1px ${C.goldDeep}, 0 0 14px rgba(212,184,118,.12)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="au-mono" style={{ position: "absolute", top: 2, left: 4, fontSize: 6.5, color: C.goldDeep }}>79</span>
            <span className="au-display au-gold-text" style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>Au</span>
          </div>
          <span className="au-display au-gold-text"
            style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase" }}>
            Aurumium
          </span>
          <span className="au-mono" style={{ fontSize: 9, color: C.faint, letterSpacing: "0.14em", border: `1px solid ${C.line}`, borderRadius: 5, padding: "3px 7px" }}>
            SAMPLE DATA
          </span>
        </div>
        <nav style={{ display: "flex", gap: 4 }}>
          {["Dashboard", "Partners", "Pipeline", "Reports"].map((t) => (
            <button key={t} className="au-btn"
              onClick={() => { setTab(t); setSelected(null); setRadialOpen(null); }}
              style={{
                background: tab === t && !selected ? "rgba(212,184,118,.08)" : "none",
                border: "1px solid transparent", borderRadius: 8, padding: "7px 14px",
                color: tab === t && !selected ? C.goldHi : C.dim, fontSize: 12.5, fontWeight: 600,
                fontFamily: "var(--font-body), sans-serif",
              }}>{t}</button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: C.dim }}>
          <Search size={16} />
          <Bell size={16} />
          <div style={{
            width: 30, height: 30, borderRadius: "50%", background: goldGrad,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#1a1408", fontWeight: 700, fontSize: 12,
          }}>ML</div>
        </div>
      </header>

      <main style={{ maxWidth: 1340, margin: "0 auto", padding: "26px 28px 60px" }}>
        {selected ? (
          <PartnerProfile p={selected} onBack={() => setSelected(null)} />
        ) : tab === "Dashboard" ? (
          <DashboardView slots={slots} swap={swap} resetSlots={() => setSlots(PRESET_SLOTS)}
            onSelect={setSelected} radialOpen={radialOpen} setRadialOpen={setRadialOpen} />
        ) : tab === "Partners" ? (
          <PartnersView onSelect={setSelected} />
        ) : tab === "Pipeline" ? (
          <PipelineView onSelect={setSelected} />
        ) : (
          <ReportsView />
        )}
      </main>
    </div>
  );
}
