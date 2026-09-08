"use client";

import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";

export default function RewardsPage() {
  const chain = useChainpace();
  const next = Math.max(0, 1500 - chain.points);
  const pct = Math.min(100, Math.round((chain.points / 1500) * 100));

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader
          title="Rewards"
          subtitle={`${chain.points} on-chain points · rank #${chain.rank} of ${chain.circleSize}`}
        />

        {chain.error && (
          <Panel className="mb-5">
            <p className="text-sm text-coral">{chain.error}</p>
          </Panel>
        )}

        <Panel className="mb-5 !border-violet-dark/30 !bg-gradient-to-br !from-violet-dark/12 !to-mint/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-dim">Total points (on-chain)</div>
              <div className="mt-1 font-display text-3xl font-bold">{chain.points}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-dim">Next milestone</div>
              <div className="mt-1 font-mono text-sm text-gold">
                {next} pts to 1,500
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface2 dark:bg-surface2-dark">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet-bright"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Badges" sub="Read from the contract" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BadgeCard
              icon="🏅"
              title="14-Day Streak"
              meta={chain.has14 ? "Unlocked on-chain" : `Best streak ${chain.bestStreak} / 14`}
              pts="+150"
              unlocked={chain.has14}
              progress={Math.min(100, Math.round((chain.bestStreak / 14) * 100))}
            />
            <BadgeCard
              icon="🔥"
              title="30-Day Streak"
              meta={chain.has30 ? "Unlocked on-chain" : `Best streak ${chain.bestStreak} / 30`}
              pts="+300"
              unlocked={chain.has30}
              progress={Math.min(100, Math.round((chain.bestStreak / 30) * 100))}
            />
          </div>
        </Panel>
      </main>
    </div>
  );
}

function BadgeCard({
  icon,
  title,
  meta,
  pts,
  unlocked,
  progress,
}: {
  icon: string;
  title: string;
  meta: string;
  pts: string;
  unlocked: boolean;
  progress: number;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        unlocked
          ? "border-border bg-bg dark:border-border-dark dark:bg-bg-dark"
          : "border-dashed border-border/70 opacity-80"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-bordersoft bg-surface2 text-lg">
          {icon}
        </div>
        <span className="font-mono text-xs font-semibold text-gold">{pts}</span>
      </div>
      <div className="text-[13px] font-semibold">{title}</div>
      <div className="mt-0.5 text-[11px] text-faint">{meta}</div>
      {!unlocked && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet-bright"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
