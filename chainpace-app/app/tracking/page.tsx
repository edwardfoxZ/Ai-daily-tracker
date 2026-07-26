"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead, Chip } from "@/components/ui";

type Range = "daily" | "weekly" | "monthly";

const chartData: Record<Range, { labels: string[]; values: number[]; todayIdx: number }> = {
  daily: { labels: ["4a", "8a", "12p", "4p", "8p", "12a"], values: [10, 40, 65, 55, 90, 30], todayIdx: 5 },
  weekly: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [70, 85, 60, 90, 75, 95, 86], todayIdx: 6 },
  monthly: { labels: ["W1", "W2", "W3", "W4"], values: [62, 74, 80, 86], todayIdx: 3 },
};

const byHabit = [
  { name: "Morning run — 5km", pct: 93, streak: 14, tone: "mint" as const },
  { name: "Deep work block", pct: 81, streak: 9, tone: "violet" as const },
  { name: "Read 20 pages", pct: 97, streak: 21, tone: "gold" as const },
  { name: "Evening meditation", pct: 58, streak: 7, tone: "coral" as const },
];

export default function TrackingPage() {
  const [range, setRange] = useState<Range>("weekly");
  const data = chartData[range];

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader title="Tracking" subtitle="How your consistency is trending over time" />

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {[
            { label: "Avg. completion", value: "84%", tone: "mint" as const },
            { label: "Best day", value: "Saturday", tone: "gold" as const },
            { label: "Longest streak", value: "30 days", tone: "violet" as const },
            { label: "Proof accuracy", value: "98%", tone: "mint" as const },
          ].map((s) => (
            <Panel key={s.label}>
              <div className="text-xs font-medium text-dim dark:text-dim-dark">{s.label}</div>
              <div className="mt-2 font-display text-xl font-semibold">{s.value}</div>
            </Panel>
          ))}
        </div>

        <Panel className="mb-5">
          <PanelHead
            title="Overall completion"
            sub="All habits combined"
            action={
              <div className="flex rounded-lg border border-bordersoft bg-surface2 p-1 dark:border-bordersoft-dark dark:bg-surface2-dark">
                {(["daily", "weekly", "monthly"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold capitalize transition-colors ${
                      range === r ? "bg-violet-dark text-white" : "text-faint dark:text-faint-dark"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            }
          />
          <div className="flex h-[240px] items-end gap-3 pt-2">
            {data.values.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="w-full max-w-[40px] rounded-t-md rounded-b-sm bg-gradient-to-b from-violet-bright to-violet-deep shadow-[0_0_14px_rgba(155,93,229,.25)]"
                  style={{ height: `${v}%`, ...(i === data.todayIdx ? { background: "linear-gradient(180deg,#5EEAD4,#22C3A6)", boxShadow: "0 0 14px rgba(94,234,212,.3)" } : {}) }}
                />
                <div className="font-mono text-[11px] text-faint dark:text-faint-dark">{data.labels[i]}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Completion by habit" sub="This week" />
          <div className="flex flex-col gap-4">
            {byHabit.map((h) => (
              <div key={h.name}>
                <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium">{h.name}</span>
                  <span className="flex items-center gap-2 text-faint dark:text-faint-dark">
                    🔥 {h.streak} <span className="font-mono font-semibold text-ink dark:text-ink-dark">{h.pct}%</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface2 dark:bg-surface2-dark">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${h.pct}%`,
                      background:
                        h.tone === "mint"
                          ? "linear-gradient(90deg,#22C3A6,#5EEAD4)"
                          : h.tone === "gold"
                          ? "linear-gradient(90deg,#C9A227,#F2C94C)"
                          : h.tone === "coral"
                          ? "linear-gradient(90deg,#D6544A,#F97066)"
                          : "linear-gradient(90deg,#6D2FC7,#B98CF0)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </main>
    </div>
  );
}
