"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, Chip } from "@/components/ui";
import NewHabitModal from "@/components/NewHabitModal";
import { useChainpace } from "@/lib/useChainpace";

export default function HabitsPage() {
  const chain = useChainpace();
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (id: string, done: boolean) => {
    if (done) return;
    setBusyId(id);
    try {
      await chain.logCompletion(id);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await chain.deactivateHabit(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader
          title="Habits & Plans"
          subtitle={
            chain.ready
              ? `${chain.habits.filter((h) => h.done).length} of ${chain.habits.length} complete today`
              : "Connect MetaMask on Ganache to use on-chain habits"
          }
          actions={
            <button
              onClick={() => setShowNew(true)}
              disabled={!chain.ready || chain.wrongNetwork}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow hover:shadow-glow-strong disabled:opacity-50"
            >
              New habit
            </button>
          }
        />

        {!chain.isConnected && (
          <Panel className="mb-5">
            <p className="text-sm text-dim dark:text-dim-dark">
              Wallet not connected. Open Login, connect MetaMask to Ganache, then come back.
            </p>
          </Panel>
        )}

        {chain.wrongNetwork && (
          <Panel className="mb-5">
            <p className="text-sm text-coral">
              Wrong network. Switch MetaMask to chain ID {chain.expectedChainId}.
            </p>
          </Panel>
        )}

        {chain.error && (
          <Panel className="mb-5">
            <p className="text-sm text-coral">{chain.error}</p>
          </Panel>
        )}

        <Panel>
          {chain.loading && chain.habits.length === 0 ? (
            <div className="py-10 text-center text-sm text-faint dark:text-faint-dark">
              Reading contract…
            </div>
          ) : chain.habits.length === 0 ? (
            <div className="py-10 text-center text-sm text-faint dark:text-faint-dark">
              No on-chain habits yet. Click New habit — MetaMask will prompt you.
            </div>
          ) : (
            chain.habits.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 border-b border-bordersoft py-3.5 last:border-none dark:border-bordersoft-dark"
              >
                <button
                  onClick={() => toggle(h.id, h.done)}
                  disabled={h.done || busyId === h.id}
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition ${
                    h.done
                      ? "border-transparent bg-gradient-to-br from-violet-bright to-violet-deep shadow-[0_0_10px_rgba(155,93,229,.4)]"
                      : "border-border dark:border-border-dark"
                  }`}
                >
                  {h.done && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="h-3 w-3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-[13.5px] font-medium ${h.done ? "text-faint line-through dark:text-faint-dark" : ""}`}>
                    {h.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-faint dark:text-faint-dark">
                    Every {h.cadenceDays} day{h.cadenceDays > 1 ? "s" : ""} · habit #{h.id}
                    {busyId === h.id ? " · waiting for tx…" : ""}
                  </div>
                </div>
                {h.done && <Chip tone="mint">Logged today</Chip>}
                <div className="w-10 shrink-0 text-right font-mono text-[11px] text-gold">🔥 {h.streak}</div>
                <button
                  onClick={() => remove(h.id)}
                  disabled={busyId === h.id}
                  className="shrink-0 rounded-md p-1.5 text-faint hover:bg-coral/10 hover:text-coral dark:text-faint-dark"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </Panel>
      </main>

      <NewHabitModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => chain.refresh()}
      />
    </div>
  );
}
