"use client";

import AppShell from "@/components/AppShell";
import { PageHeader, Panel, PanelHead } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";

export default function RewardsPage() {
  const chain = useChainpace();
  const next = Math.max(0, 1500 - chain.points);
  const pct = Math.min(100, Math.round((chain.points / 1500) * 100));
  return (
    <AppShell>
      <PageHeader title="Rewards" subtitle={`${chain.points} on-chain points · rank #${chain.rank} of ${chain.circleSize}`} />
      {chain.error && <Panel className="mb-5"><p className="text-sm text-coral">{chain.error}</p></Panel>}
      <Panel className="mb-5 !border-violet-dark/30 !bg-gradient-to-br !from-violet-dark/12 !to-mint/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-medium text-dim">Total points (on-chain)</div>
            <div className="mt-1 font-display text-3xl font-bold">{chain.points}</div>
          </div>
          <div className="sm:text-right">
            <div className="text-xs font-medium text-dim">Next milestone</div>
            <div className="mt-1 font-mono text-sm text-gold">{next} pts to 1,500</div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet-bright" style={{ width: `${pct}%` }} />
        </div>
      </Panel>
      <Panel>
        <PanelHead title="Badges" sub="Read from the contract" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-4 dark:border-border-dark">
            <div className="text-[13px] font-semibold">14-Day Streak</div>
            <div className="text-[11px] text-faint">{chain.has14 ? "Unlocked" : `Best ${chain.bestStreak} / 14`}</div>
          </div>
          <div className="rounded-xl border border-border p-4 dark:border-border-dark">
            <div className="text-[13px] font-semibold">30-Day Streak</div>
            <div className="text-[11px] text-faint">{chain.has30 ? "Unlocked" : `Best ${chain.bestStreak} / 30`}</div>
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
