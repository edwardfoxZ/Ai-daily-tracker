"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import { PageHeader, Panel } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";
import { useUser } from "@/lib/user-context";
import { shortAddr } from "@/lib/contract";

export default function DashboardPage() {
  const chain = useChainpace();
  const { user } = useUser();
  const weeklyPct = Math.round(chain.weeklyBps / 100);
  const done = chain.habits.filter((h) => h.done).length;
  const name = user?.username || (chain.address ? shortAddr(chain.address) : "there");
  const activeComp = chain.competitions.find((c) => !c.resolved);

  return (
    <AppShell>
      <PageHeader
        title={`Hello, ${name}`}
        subtitle={
          chain.ready
            ? `${done} of ${chain.habits.length} habits complete today`
            : "Connect a wallet to load on-chain data"
        }
      />
      {chain.error && <p className="mb-4 text-sm text-coral">{chain.error}</p>}
      {chain.wrongNetwork && (
        <p className="mb-4 text-sm text-coral">
          Switch MetaMask to chain ID {chain.expectedChainId}.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Current streak" value={`${chain.bestStreak} days`} />
        <Stat label="Weekly completion" value={`${weeklyPct}%`} />
        <Stat label="Proof score" value={`${chain.proofScore} / 100`} />
        <Stat label="Circle rank" value={`#${chain.rank} of ${chain.circleSize}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-display text-[15px] font-semibold">Today&apos;s habits</h3>
            <Link href="/habits" className="text-xs font-semibold text-violet-bright">View all</Link>
          </div>
          {chain.habits.length === 0 ? (
            <p className="py-8 text-center text-sm text-faint">No on-chain habits yet.</p>
          ) : (
            chain.habits.map((h) => (
              <div key={h.id} className="flex items-center gap-3 border-b border-bordersoft py-2.5 last:border-none dark:border-bordersoft-dark">
                <button
                  onClick={() => !h.done && chain.logCompletion(h.id)}
                  disabled={h.done || chain.txPending}
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border ${
                    h.done
                      ? "border-transparent bg-gradient-to-br from-violet-bright to-violet-deep"
                      : "border-border dark:border-border-dark"
                  }`}
                >
                  {h.done && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="h-3 w-3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{h.title}</div>
                <div className="shrink-0 font-mono text-[11px] text-gold">🔥 {h.streak}</div>
              </div>
            ))
          )}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <h3 className="mb-3 font-display text-[15px] font-semibold">Active competition</h3>
            {!activeComp ? (
              <p className="text-sm text-faint">None yet. Challenge a friend on-chain.</p>
            ) : (
              <p className="break-all text-sm">
                vs {shortAddr(
                  chain.address && activeComp.challenger.toLowerCase() === chain.address.toLowerCase()
                    ? activeComp.opponent
                    : activeComp.challenger,
                )}{" "}
                · {activeComp.youScore}–{activeComp.themScore}
              </p>
            )}
            <Link href="/competitions" className="mt-3 inline-block text-xs font-semibold text-violet-bright">Open competitions</Link>
          </Panel>
          <Panel>
            <h3 className="mb-3 font-display text-[15px] font-semibold">Circle</h3>
            {[...chain.circle].sort((a, b) => b.score - a.score).slice(0, 5).map((m, i) => (
              <div key={m.address} className="flex items-center justify-between gap-2 py-1.5 text-[13px]">
                <span className="min-w-0 truncate">
                  {i + 1}. {chain.address && m.address.toLowerCase() === chain.address.toLowerCase() ? "You" : shortAddr(m.address)}
                </span>
                <span className="shrink-0 font-mono">{m.score}</span>
              </div>
            ))}
            {chain.circle.length === 0 && <p className="text-sm text-faint">Connect wallet to load scores.</p>}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel>
      <div className="text-[11.5px] text-faint">{label}</div>
      <div className="mt-1 break-words font-display text-lg font-semibold sm:text-[22px]">{value}</div>
    </Panel>
  );
}
