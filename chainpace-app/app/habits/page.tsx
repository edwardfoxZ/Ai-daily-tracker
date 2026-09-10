"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
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
    <AppShell>
      <PageHeader
        title="Habits & Plans"
        subtitle={
          chain.ready
            ? `${chain.habits.filter((h) => h.done).length} of ${chain.habits.length} complete today`
            : "Connect your wallet to use on-chain habits"
        }
        actions={
          <button
            onClick={() => setShowNew(true)}
            disabled={!chain.ready || chain.wrongNetwork}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow disabled:opacity-50"
          >
            New habit
          </button>
        }
      />
      {!chain.isConnected && (
        <Panel className="mb-5"><p className="text-sm text-dim">Wallet not connected.</p></Panel>
      )}
      {chain.wrongNetwork && (
        <Panel className="mb-5"><p className="text-sm text-coral">Switch MetaMask to chain ID {chain.expectedChainId}.</p></Panel>
      )}
      {chain.error && (
        <Panel className="mb-5"><p className="text-sm text-coral">{chain.error}</p></Panel>
      )}
      <Panel>
        {chain.habits.length === 0 ? (
          <div className="py-10 text-center text-sm text-faint">No on-chain habits yet.</div>
        ) : (
          chain.habits.map((h) => (
            <div key={h.id} className="flex items-center gap-3 border-b border-bordersoft py-3.5 last:border-none dark:border-bordersoft-dark">
              <button
                onClick={() => toggle(h.id, h.done)}
                disabled={h.done || busyId === h.id}
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border ${
                  h.done ? "border-transparent bg-gradient-to-br from-violet-bright to-violet-deep" : "border-border dark:border-border-dark"
                }`}
              >
                {h.done && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="h-3 w-3"><path d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[13.5px] font-medium ${h.done ? "text-faint line-through" : ""}`}>{h.title}</div>
                <div className="mt-0.5 text-[11px] text-faint">Every {h.cadenceDays} day{h.cadenceDays > 1 ? "s" : ""}</div>
              </div>
              {h.done && <Chip tone="mint">Today</Chip>}
              <div className="shrink-0 font-mono text-[11px] text-gold">🔥 {h.streak}</div>
              <button onClick={() => remove(h.id)} className="shrink-0 p-1.5 text-faint hover:text-coral">×</button>
            </div>
          ))
        )}
      </Panel>
      <NewHabitModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => chain.refresh()} />
    </AppShell>
  );
}
