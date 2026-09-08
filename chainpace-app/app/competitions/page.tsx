"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead, Avatar, Chip } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";
import { initialsFromAddr, shortAddr } from "@/lib/contract";

export default function CompetitionsPage() {
  const chain = useChainpace();
  const [opponent, setOpponent] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const active = chain.competitions.filter((c) => !c.resolved);
  const past = chain.competitions.filter((c) => c.resolved);
  const now = Date.now() / 1000;

  const challenge = async () => {
    setBusy(true);
    try {
      await chain.createCompetition(opponent, days);
      setOpponent("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader title="Competitions" subtitle={`${active.length} active challenges`} />
        {chain.error && <Panel className="mb-5"><p className="text-sm text-coral">{chain.error}</p></Panel>}
        <Panel className="mb-5">
          <div className="flex flex-wrap items-end gap-3">
            <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="min-w-[240px] flex-1 rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm dark:border-border-dark dark:bg-bg-dark">
              <option value="">Select a friend</option>
              {chain.friends.map((f) => (
                <option key={f} value={f}>{shortAddr(f)}</option>
              ))}
            </select>
            <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-24 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm dark:border-border-dark dark:bg-bg-dark" />
            <button onClick={challenge} disabled={!opponent || busy || !chain.ready} className="rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50">
              {busy ? "Confirm…" : "Challenge"}
            </button>
          </div>
        </Panel>
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {active.map((c) => {
            const other = chain.address && c.challenger.toLowerCase() === chain.address.toLowerCase() ? c.opponent : c.challenger;
            const left = Math.max(0, Math.ceil((c.endTime - now) / 86400));
            const total = c.youScore + c.themScore || 1;
            return (
              <Panel key={c.id} className="!border-violet-dark/30 !bg-gradient-to-br !from-violet-dark/12 !to-mint/5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">vs. {shortAddr(other)}</span>
                  <Chip tone="coral">{left} days left</Chip>
                </div>
                <div className="my-3 flex items-center justify-between">
                  <div className="flex flex-1 flex-col items-center gap-1"><Avatar initials="YOU" size={44} /><div className="font-display text-xl font-bold">{c.youScore}</div></div>
                  <div className="font-mono text-[11px] text-faint">VS</div>
                  <div className="flex flex-1 flex-col items-center gap-1"><Avatar initials={initialsFromAddr(other)} size={44} /><div className="font-display text-xl font-bold">{c.themScore}</div></div>
                </div>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-surface2">
                  <div className="bg-violet-bright" style={{ width: `${(c.youScore / total) * 100}%` }} />
                </div>
                {now > c.endTime && (
                  <button onClick={() => chain.resolveCompetition(c.id)} className="mt-3 w-full rounded-lg bg-violet-dark py-2 text-[12px] font-semibold text-white">Resolve on-chain</button>
                )}
              </Panel>
            );
          })}
        </div>
        {active.length === 0 && <p className="mb-5 text-sm text-faint">No active competitions.</p>}
        <Panel>
          <PanelHead title="Past competitions" sub={`${past.length} resolved`} />
          {past.map((p) => {
            const won = chain.address && p.winner.toLowerCase() === chain.address.toLowerCase();
            const other = chain.address && p.challenger.toLowerCase() === chain.address.toLowerCase() ? p.opponent : p.challenger;
            return (
              <div key={p.id} className="flex items-center gap-3 border-b border-bordersoft py-3 last:border-none dark:border-bordersoft-dark">
                <Avatar initials={initialsFromAddr(other)} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">vs. {shortAddr(other)}</div>
                  <div className="text-[11px] text-faint">Final {p.youScore}–{p.themScore}</div>
                </div>
                <Chip tone={won ? "mint" : "coral"}>{won ? "Won" : "Lost / tie"}</Chip>
              </div>
            );
          })}
          {past.length === 0 && <div className="py-6 text-center text-sm text-faint">Nothing resolved yet.</div>}
        </Panel>
      </main>
    </div>
  );
}
