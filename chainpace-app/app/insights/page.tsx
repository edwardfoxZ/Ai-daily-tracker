"use client";

import AppShell from "@/components/AppShell";
import { PageHeader, Panel, Chip } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";

export default function InsightsPage() {
  const chain = useChainpace();
  return (
    <AppShell>
      <PageHeader title="AI Insights" subtitle="On-chain stats for now — research layer comes with the Go jobs later" />
      <Panel className="mb-5 !border-violet-dark/30 !bg-gradient-to-br !from-violet-dark/12 !to-mint/5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-dark text-white sm:h-14 sm:w-14">AI</div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold">Proof score: {chain.proofScore} / 100</div>
            <div className="mt-0.5 text-[12.5px] text-dim">Best streak {chain.bestStreak} · {chain.habits.length} active habits</div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold">What the chain shows</h3>
          <Chip tone="violet">Live</Chip>
        </div>
        <p className="text-[13px] leading-relaxed text-dim">
          Weekly completion {Math.round(chain.weeklyBps / 100)}%. Log habits from any device — the sidebar menu is in the top-left on phones.
        </p>
      </Panel>
    </AppShell>
  );
}
