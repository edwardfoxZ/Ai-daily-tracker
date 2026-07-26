"use client";

import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead, Chip } from "@/components/ui";

const insights = [
  {
    title: "Your sleep window is your biggest lever right now",
    body: "Sessions logged before 7:30 AM have a 34% higher completion rate than sessions logged after 9 AM. Tightening your bedtime window is likely to lift your overall score more than adding new habits.",
    source: "Sleep Health Journal, 2024",
    tone: "violet" as const,
  },
  {
    title: "Deep work streak is fragile on Fridays",
    body: "You've missed your deep work block on 3 of the last 4 Fridays. Consider moving it earlier in the day, or pairing it with a lower-effort placeholder task on Fridays specifically.",
    source: "Pattern detected from your last 60 days",
    tone: "gold" as const,
  },
  {
    title: "Reading habit is your most resilient one",
    body: "97% completion over 21 days with almost no variance by day of week — this one's fully automatic for you. Nothing to change here.",
    source: "Consistency analysis",
    tone: "mint" as const,
  },
];

export default function InsightsPage() {
  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader title="AI Insights" subtitle="Patterns in your data, cross-checked against published research" />

        <Panel className="mb-5 !bg-gradient-to-br !from-violet-dark/12 !to-mint/5 !border-violet-dark/30">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-glow-strong"
              style={{ backgroundImage: "radial-gradient(circle at 35% 30%, #B98CF0, #6D2FC7 70%)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" className="h-6 w-6">
                <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                <circle cx="12" cy="12" r="3.4" />
              </svg>
            </div>
            <div>
              <div className="text-[14px] font-semibold">Proof score: 92 / 100</div>
              <div className="mt-0.5 text-[12.5px] text-dim dark:text-dim-dark">
                Based on 14 days of verified habit logs, cross-referenced against clinical and behavioral research.
              </div>
            </div>
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          {insights.map((ins) => (
            <Panel key={ins.title}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-[15px] font-semibold">{ins.title}</h3>
                <Chip tone={ins.tone}>AI-generated</Chip>
              </div>
              <p className="text-[13px] leading-relaxed text-dim dark:text-dim-dark">{ins.body}</p>
              <div className="mt-3 font-mono text-[10.5px] text-faint dark:text-faint-dark">Source: {ins.source}</div>
            </Panel>
          ))}
        </div>
      </main>
    </div>
  );
}
