"use client";

import AppShell from "@/components/AppShell";
import { PageHeader, Panel, PanelHead } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";

export default function TrackingPage() {
  const chain = useChainpace();
  const weeklyPct = Math.round(chain.weeklyBps / 100);
  const done = chain.habits.filter((h) => h.done).length;
  return (
    <AppShell>
      <PageHeader title="Tracking" subtitle="Live numbers from ChainpaceCore" />
      {chain.error && <Panel className="mb-5"><p className="text-sm text-coral">{chain.error}</p></Panel>}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel><div className="text-xs text-dim">Weekly</div><div className="mt-2 font-display text-xl font-semibold">{weeklyPct}%</div></Panel>
        <Panel><div className="text-xs text-dim">Best streak</div><div className="mt-2 font-display text-xl font-semibold">{chain.bestStreak} days</div></Panel>
        <Panel><div className="text-xs text-dim">Proof score</div><div className="mt-2 font-display text-xl font-semibold">{chain.proofScore}</div></Panel>
        <Panel><div className="text-xs text-dim">Done today</div><div className="mt-2 font-display text-xl font-semibold">{done} / {chain.habits.length}</div></Panel>
      </div>
      <Panel>
        <PanelHead title="Completion by habit" />
        {chain.habits.length === 0 ? (
          <p className="py-8 text-center text-sm text-faint">No habits yet.</p>
        ) : (
          chain.habits.map((h) => (
            <div key={h.id} className="mb-4 last:mb-0">
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[12.5px]">
                <span className="min-w-0 truncate font-medium">{h.title}</span>
                <span className="shrink-0 text-faint">🔥 {h.streak}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet-bright" style={{ width: `${h.done ? 100 : Math.min(90, h.streak * 10)}%` }} />
              </div>
            </div>
          ))
        )}
      </Panel>
    </AppShell>
  );
}
