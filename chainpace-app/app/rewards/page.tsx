"use client";

import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead, Chip } from "@/components/ui";

const rewards = [
  { icon: "🏅", title: "14-Day Streak Badge", meta: "Unlocked today", pts: "+150", unlocked: true },
  { icon: "📚", title: "Reader's Milestone", meta: "20 pages, 21 days straight", pts: "+90", unlocked: true },
  { icon: "🥇", title: "Weekly Top 3", meta: "Circle leaderboard", pts: "+200", unlocked: true },
  { icon: "💧", title: "Hydration Hero", meta: "3L water, 30 days", pts: "+120", unlocked: true },
  { icon: "🧘", title: "Zen Mode", meta: "10 meditation sessions", pts: "+80", unlocked: false, progress: 70 },
  { icon: "🔥", title: "30-Day Streak", meta: "16 days to go", pts: "+300", unlocked: false, progress: 47 },
];

export default function RewardsPage() {
  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader title="Rewards" subtitle="1,240 points · rank #2 of 18 friends" />

        <Panel className="mb-5 !bg-gradient-to-br !from-violet-dark/12 !to-mint/5 !border-violet-dark/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-dim dark:text-dim-dark">Total points</div>
              <div className="mt-1 font-display text-3xl font-bold">1,240</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-dim dark:text-dim-dark">Next milestone</div>
              <div className="mt-1 font-mono text-sm text-gold">1,500 pts → Gold tier</div>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface2 dark:bg-surface2-dark">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet-bright shadow-[0_0_8px_rgba(155,93,229,.5)]" style={{ width: "82%" }} />
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Badges & milestones" sub="Unlocked and in-progress" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((r) => (
              <div
                key={r.title}
                className={`rounded-xl border p-4 ${
                  r.unlocked
                    ? "border-border bg-bg dark:border-border-dark dark:bg-bg-dark"
                    : "border-dashed border-border/70 bg-bg/50 opacity-80 dark:border-border-dark/70 dark:bg-bg-dark/50"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-bordersoft bg-surface2 text-lg dark:border-bordersoft-dark dark:bg-surface2-dark">
                    {r.icon}
                  </div>
                  <span className="font-mono text-xs font-semibold text-gold">{r.pts}</span>
                </div>
                <div className="text-[13px] font-semibold">{r.title}</div>
                <div className="mt-0.5 text-[11px] text-faint dark:text-faint-dark">{r.meta}</div>
                {!r.unlocked && r.progress && (
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface2 dark:bg-surface2-dark">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet-bright" style={{ width: `${r.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </main>
    </div>
  );
}
