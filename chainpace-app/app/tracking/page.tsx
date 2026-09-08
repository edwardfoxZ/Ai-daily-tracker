"use client";

import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";

export default function TrackingPage() {
  const chain = useChainpace();
  const weeklyPct = Math.round(chain.weeklyBps / 100);
  const done = chain.habits.filter((h) => h.done).length;

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader
          title="Tracking"
          subtitle="Live numbers from ChainpaceCore — not mock charts"
        />

        {chain.error && (
          <Panel className="mb-5">
            <p className="text-sm text-coral">{chain.error}</p>
          </Panel>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Stat label="Weekly completion" value={`${weeklyPct}%`} />
          <Stat label="Best streak" value={`${chain.bestStreak} days`} />
          <Stat label="Proof score" value={`${chain.proofScore} / 100`} />
          <Stat label="Done today" value={`${done} / ${chain.habits.length}`} />
        </div>

        <Panel>
          <PanelHead title="Completion by habit" sub="Current streak per on-chain habit" />
          {chain.habits.length === 0 ? (
            <p className="py-8 text-center text-sm text-faint">No habits on this wallet yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {chain.habits.map((h) => {
                const pct = h.done ? 100 : Math.min(90, h.streak * 10);
                return (
                  <div key={h.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                      <span className="font-medium">{h.title}</span>
                      <span className="text-faint">
                        🔥 {h.streak}
                        {h.done ? " · logged today" : ""}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface2 dark:bg-surface2-dark">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet-bright"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel>
      <div className="text-xs font-medium text-dim">{label}</div>
      <div className="mt-2 font-display text-xl font-semibold">{value}</div>
    </Panel>
  );
}
