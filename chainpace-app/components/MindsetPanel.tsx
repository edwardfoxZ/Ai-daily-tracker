"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui";
import { agentMindset, type MindsetResponse } from "@/lib/api";

const COLORS: Record<string, string> = {
  mind: "bg-violet-dark",
  money: "bg-gold",
  social_credit: "bg-mint",
  body: "bg-coral",
};

function classifyLocal(title: string) {
  const t = title.toLowerCase();
  if (/(gym|run|walk|sleep|water|yoga|body|health)/.test(t)) return "body";
  if (/(save|budget|invest|money|invoice|crypto)/.test(t)) return "money";
  if (/(call|friend|family|social|mentor|network)/.test(t)) return "social_credit";
  return "mind";
}

export default function MindsetPanel({
  habits,
}: {
  habits: { title: string; streak: number }[];
}) {
  const [data, setData] = useState<MindsetResponse | null>(null);

  useEffect(() => {
    agentMindset()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const weekKept = useMemo(() => {
    const fromChain = habits.filter((h) => h.streak >= 7).map((h) => ({
      name: h.title,
      category: classifyLocal(h.title),
      daysActive: h.streak,
    }));
    const fromApi = data?.priorities || [];
    const map = new Map<string, { name: string; category: string; daysActive: number }>();
    [...fromApi, ...fromChain].forEach((p) => {
      const cur = map.get(p.name);
      if (!cur || p.daysActive > cur.daysActive) map.set(p.name, p);
    });
    return [...map.values()].sort((a, b) => b.daysActive - a.daysActive);
  }, [habits, data]);

  const bars = data?.categories || [
    { key: "mind", label: "Mind", completions: 0, misses: 0, share: 0 },
    { key: "money", label: "Money", completions: 0, misses: 0, share: 0 },
    { key: "social_credit", label: "Social credit", completions: 0, misses: 0, share: 0 },
    { key: "body", label: "Body", completions: 0, misses: 0, share: 0 },
  ];
  const max = Math.max(1, ...bars.map((b) => b.completions));

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Panel>
        <h3 className="mb-1 font-display text-[15px] font-semibold">Priorities kept 7+ days</h3>
        <p className="mb-4 text-[12px] text-faint">What you actually repeated for more than a week — not what you planned.</p>
        <div className="flex h-40 items-end gap-3">
          {bars.map((b) => (
            <div key={b.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="text-[11px] font-mono text-faint">{b.completions}</div>
              <div className="flex h-28 w-full items-end rounded-md bg-surface2 dark:bg-surface2-dark">
                <div
                  className={`w-full rounded-md ${COLORS[b.key] || "bg-violet-dark"}`}
                  style={{ height: `${Math.max(6, (b.completions / max) * 100)}%` }}
                />
              </div>
              <div className="w-full truncate text-center text-[11px]">{b.label}</div>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-1.5">
          {weekKept.length === 0 && (
            <li className="text-sm text-faint">Nothing has a 7-day hold yet. Check habits daily — they land here when the streak crosses a week.</li>
          )}
          {weekKept.map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="min-w-0 truncate">{p.name}</span>
              <span className="shrink-0 font-mono text-[11px] text-faint">{p.daysActive}d · {p.category.replace("_", " ")}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold">Pace · mindset</h3>
          <Link href="/messages" className="text-xs font-semibold text-violet-bright">Open coach</Link>
        </div>
        <p className="text-[13.5px] leading-relaxed">{data?.analysis || "Sign in and log a few plans. Pace splits them into mind, money, social credit, and body."}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {bars.map((b) => (
            <div key={b.key} className="rounded-xl border border-border px-3 py-2 text-[12px] dark:border-border-dark">
              <div className="text-faint">{b.label}</div>
              <div className="font-display text-lg font-semibold">{b.share}%</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
