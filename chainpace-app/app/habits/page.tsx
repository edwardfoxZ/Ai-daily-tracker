"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead, Chip } from "@/components/ui";

interface Habit {
  id: string;
  title: string;
  category: "Health" | "Work" | "Growth" | "Mindfulness";
  cadence: string;
  streak: number;
  done: boolean;
  verified: boolean;
}

const initial: Habit[] = [
  { id: "1", title: "Morning run — 5km", category: "Health", cadence: "Daily · 6:30 AM", streak: 14, done: true, verified: true },
  { id: "2", title: "Deep work block — 2h", category: "Work", cadence: "Weekdays · 9:00 AM", streak: 9, done: true, verified: true },
  { id: "3", title: "Read 20 pages", category: "Growth", cadence: "Daily · anytime", streak: 21, done: true, verified: true },
  { id: "4", title: "Drink 3L water", category: "Health", cadence: "Daily", streak: 30, done: true, verified: true },
  { id: "5", title: "Evening meditation — 10min", category: "Mindfulness", cadence: "Daily · 9:00 PM", streak: 7, done: false, verified: false },
  { id: "6", title: "Plan tomorrow's tasks", category: "Work", cadence: "Daily · 10:00 PM", streak: 4, done: false, verified: false },
];

const categoryTone: Record<Habit["category"], "violet" | "mint" | "gold" | "coral"> = {
  Health: "mint",
  Work: "violet",
  Growth: "gold",
  Mindfulness: "coral",
};

export default function HabitsPage() {
  const [habits, setHabits] = useState(initial);
  const [filter, setFilter] = useState<"all" | Habit["category"]>("all");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Habit["category"]>("Health");

  const toggle = (id: string) =>
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));

  const remove = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id));

  const addHabit = () => {
    if (!newTitle.trim()) return;
    setHabits((prev) => [
      { id: crypto.randomUUID(), title: newTitle.trim(), category: newCategory, cadence: "Daily", streak: 0, done: false, verified: false },
      ...prev,
    ]);
    setNewTitle("");
    setShowNew(false);
  };

  const filtered = filter === "all" ? habits : habits.filter((h) => h.category === filter);
  const categories: Habit["category"][] = ["Health", "Work", "Growth", "Mindfulness"];

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader
          title="Habits & Plans"
          subtitle={`${habits.filter((h) => h.done).length} of ${habits.length} complete today`}
          actions={
            <button
              onClick={() => setShowNew((s) => !s)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow hover:shadow-glow-strong"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New habit
            </button>
          }
        />

        {showNew && (
          <Panel className="mb-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label className="mb-1.5 block text-[12.5px] font-semibold text-dim dark:text-dim-dark">Habit</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cold shower — 3 min"
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-violet-dark dark:border-border-dark dark:bg-bg-dark"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-dim dark:text-dim-dark">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Habit["category"])}
                  className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-violet-dark dark:border-border-dark dark:bg-bg-dark"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={addHabit}
                className="rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-5 py-2.5 text-[13px] font-semibold text-white shadow-glow"
              >
                Add
              </button>
            </div>
          </Panel>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {(["all", ...categories] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                filter === c
                  ? "border-transparent bg-violet-dark text-white"
                  : "border-border bg-surface text-dim dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark"
              }`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>

        <Panel>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-faint dark:text-faint-dark">No habits in this category yet.</div>
          ) : (
            filtered.map((h) => (
              <div key={h.id} className="flex items-center gap-3 border-b border-bordersoft py-3.5 last:border-none dark:border-bordersoft-dark">
                <button
                  onClick={() => toggle(h.id)}
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
                  <div className={`text-[13.5px] font-medium ${h.done ? "text-faint line-through dark:text-faint-dark" : ""}`}>{h.title}</div>
                  <div className="mt-0.5 text-[11px] text-faint dark:text-faint-dark">{h.cadence}</div>
                </div>
                <Chip tone={categoryTone[h.category]}>{h.category}</Chip>
                {h.verified && <Chip tone="mint">✓ AI-verified</Chip>}
                <div className="w-10 shrink-0 text-right font-mono text-[11px] text-gold">🔥 {h.streak}</div>
                <button
                  onClick={() => remove(h.id)}
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
    </div>
  );
}
