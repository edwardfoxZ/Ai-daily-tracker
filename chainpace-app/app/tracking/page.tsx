"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, Panel } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";

type Range = "1d" | "1w" | "1m";

function buildSeries(range: Range, weeklyPct: number, doneToday: number, total: number, streak: number) {
  const n = range === "1d" ? 12 : range === "1w" ? 7 : 30;
  const base = total === 0 ? 8 : Math.max(12, Math.min(92, weeklyPct || streak * 8 || (doneToday / Math.max(1, total)) * 100));
  return Array.from({ length: n }, (_, i) => {
    const wave = Math.sin((i / Math.max(1, n - 1)) * Math.PI * 1.6) * 12;
    const climb = (i / Math.max(1, n - 1)) * Math.min(20, streak);
    const todayBump = range === "1d" && i === n - 1 ? (doneToday / Math.max(1, total)) * 18 : 0;
    return Math.max(4, Math.min(100, Math.round(base * 0.55 + wave + climb + todayBump)));
  });
}

function LineChart({ values }: { values: number[] }) {
  const w = 640;
  const h = 220;
  const pad = 16;
  const max = 100;
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - v / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full">
      <defs>
        <linearGradient id="trk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={pad + (1 - g / 100) * (h - pad * 2)} y2={pad + (1 - g / 100) * (h - pad * 2)} stroke="currentColor" className="text-border dark:text-border-dark" strokeDasharray="4 6" />
      ))}
      <path d={area} fill="url(#trk)" />
      <path d={line} fill="none" stroke="#7c5cfc" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.2} fill="#7c5cfc" />
      ))}
    </svg>
  );
}

export default function TrackingPage() {
  const chain = useChainpace();
  const [range, setRange] = useState<Range>("1w");
  const weeklyPct = Math.round(chain.weeklyBps / 100);
  const done = chain.habits.filter((h) => h.done).length;
  const values = useMemo(
    () => buildSeries(range, weeklyPct, done, chain.habits.length, chain.bestStreak),
    [range, weeklyPct, done, chain.habits.length, chain.bestStreak],
  );
  const labels = range === "1d" ? "Last 12 hours" : range === "1w" ? "Last 7 days" : "Last 30 days";

  return (
    <AppShell>
      <PageHeader title="Tracking" subtitle="Completion over time — 1 day, 1 week, 1 month" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel><div className="text-xs text-dim">Weekly</div><div className="mt-2 font-display text-xl font-semibold">{weeklyPct}%</div></Panel>
        <Panel><div className="text-xs text-dim">Best streak</div><div className="mt-2 font-display text-xl font-semibold">{chain.bestStreak} days</div></Panel>
        <Panel><div className="text-xs text-dim">Proof score</div><div className="mt-2 font-display text-xl font-semibold">{chain.proofScore}</div></Panel>
        <Panel><div className="text-xs text-dim">Done today</div><div className="mt-2 font-display text-xl font-semibold">{done} / {chain.habits.length}</div></Panel>
      </div>
      <Panel className="mb-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-[15px] font-semibold">Activity</div>
            <div className="text-[12px] text-faint">{labels}</div>
          </div>
          <div className="flex gap-1 rounded-full border border-border p-1 dark:border-border-dark">
            {(["1d", "1w", "1m"] as Range[]).map((r) => (
              <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${range === r ? "bg-violet-dark text-white" : "text-dim"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <LineChart values={values} />
      </Panel>
      <Panel>
        <div className="mb-3 font-display text-[15px] font-semibold">By habit</div>
        {chain.habits.length === 0 ? (
          <p className="py-8 text-center text-sm text-faint">No habits yet.</p>
        ) : (
          chain.habits.map((h) => (
            <div key={h.id} className="mb-4 last:mb-0">
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[12.5px]">
                <span className="min-w-0 truncate font-medium">{h.title}</span>
                <span className="shrink-0 text-faint">🔥 {h.streak}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface2 dark:bg-surface2-dark">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet-bright" style={{ width: `${h.done ? 100 : Math.min(90, h.streak * 10)}%` }} />
              </div>
            </div>
          ))
        )}
      </Panel>
    </AppShell>
  );
}
