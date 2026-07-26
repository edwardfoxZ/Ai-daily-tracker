"use client";

import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead, Avatar, Chip } from "@/components/ui";

const active = [
  { opponent: "Sarah_K", initials: "SK", you: 86, them: 79, daysLeft: 2 },
  { opponent: "Jordan_T", initials: "JT", you: 62, them: 71, daysLeft: 5 },
];

const past = [
  { opponent: "Alex_L", initials: "AL", result: "won", score: "91–74" },
  { opponent: "Nadia_B", initials: "NB", result: "lost", score: "68–82" },
  { opponent: "Theo_W", initials: "TW", result: "won", score: "95–88" },
];

export default function CompetitionsPage() {
  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader
          title="Competitions"
          subtitle="2 active challenges"
          actions={
            <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow hover:shadow-glow-strong">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Challenge a friend
            </button>
          }
        />

        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {active.map((c) => (
            <Panel key={c.opponent} className="!bg-gradient-to-br !from-violet-dark/12 !to-mint/5 !border-violet-dark/30">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold">vs. {c.opponent}</span>
                <Chip tone="coral">{c.daysLeft} days left</Chip>
              </div>
              <div className="my-3.5 flex items-center justify-between">
                <div className="flex flex-1 flex-col items-center gap-1.5">
                  <Avatar initials="MR" size={44} />
                  <div className="font-display text-xl font-bold">{c.you}%</div>
                  <div className="text-[11.5px] text-dim dark:text-dim-dark">You</div>
                </div>
                <div className="px-2 font-mono text-[11px] text-faint dark:text-faint-dark">VS</div>
                <div className="flex flex-1 flex-col items-center gap-1.5">
                  <Avatar initials={c.initials} size={44} />
                  <div className="font-display text-xl font-bold">{c.them}%</div>
                  <div className="text-[11.5px] text-dim dark:text-dim-dark">{c.opponent}</div>
                </div>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-surface2 dark:bg-surface2-dark">
                <div
                  className="bg-gradient-to-r from-violet-deep to-violet-bright shadow-[0_0_8px_rgba(155,93,229,.5)]"
                  style={{ width: `${(c.you / (c.you + c.them)) * 100}%` }}
                />
                <div className="bg-border dark:bg-border-dark" style={{ width: `${(c.them / (c.you + c.them)) * 100}%` }} />
              </div>
            </Panel>
          ))}
        </div>

        <Panel>
          <PanelHead title="Past competitions" sub="Your record: 2 wins · 1 loss" />
          {past.map((p) => (
            <div key={p.opponent} className="flex items-center gap-3 border-b border-bordersoft py-3 last:border-none dark:border-bordersoft-dark">
              <Avatar initials={p.initials} size={36} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">vs. {p.opponent}</div>
                <div className="text-[11px] text-faint dark:text-faint-dark">Final score {p.score}</div>
              </div>
              <Chip tone={p.result === "won" ? "mint" : "coral"}>{p.result === "won" ? "Won" : "Lost"}</Chip>
            </div>
          ))}
        </Panel>
      </main>
    </div>
  );
}
