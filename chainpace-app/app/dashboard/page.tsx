"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

type Range = "daily" | "weekly" | "monthly";

const chartData: Record<
  Range,
  { labels: string[]; values: number[]; todayIdx: number }
> = {
  daily: {
    labels: ["4a", "8a", "12p", "4p", "8p", "12a"],
    values: [10, 40, 65, 55, 90, 30],
    todayIdx: 5,
  },
  weekly: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [70, 85, 60, 90, 75, 95, 86],
    todayIdx: 6,
  },
  monthly: {
    labels: ["W1", "W2", "W3", "W4"],
    values: [62, 74, 80, 86],
    todayIdx: 3,
  },
};

interface Habit {
  id: string;
  title: string;
  meta: string;
  streak: number;
  done: boolean;
  verified: boolean;
}

const initialHabits: Habit[] = [
  {
    id: "1",
    title: "Morning run — 5km",
    meta: "Health · logged 6:42 AM",
    streak: 14,
    done: true,
    verified: true,
  },
  {
    id: "2",
    title: "Deep work block — 2h",
    meta: "Work · logged 10:15 AM",
    streak: 9,
    done: true,
    verified: true,
  },
  {
    id: "3",
    title: "Read 20 pages",
    meta: "Growth · logged 1:30 PM",
    streak: 21,
    done: true,
    verified: true,
  },
  {
    id: "4",
    title: "Drink 3L water",
    meta: "Health · logged 3:00 PM",
    streak: 30,
    done: true,
    verified: true,
  },
  {
    id: "5",
    title: "Evening meditation — 10min",
    meta: "Mindfulness · due by 9:00 PM",
    streak: 7,
    done: false,
    verified: false,
  },
  {
    id: "6",
    title: "Plan tomorrow's tasks",
    meta: "Work · due by 10:00 PM",
    streak: 4,
    done: false,
    verified: false,
  },
];

export default function DashboardPage() {
  const [range, setRange] = useState<Range>("daily");
  const [habits, setHabits] = useState(initialHabits);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
    );
  };

  const data = chartData[range];
  const completedCount = habits.filter((h) => h.done).length;

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />

      <main className="flex-1 px-8 pb-16 pt-6">
        {/* topbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[23px] font-semibold tracking-tight">
              Good evening, Marcus
            </h1>
            <p className="mt-1 text-[13px] text-dim dark:text-dim-dark">
              You&apos;ve completed {completedCount} of {habits.length} habits
              today — keep the streak alive.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-dim hover:border-violet-dark hover:text-ink dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark">
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-coral shadow-[0_0_6px_#F97066]" />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 01-3.4 0" />
              </svg>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow hover:shadow-glow-strong">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New habit
            </button>
          </div>
        </div>

        {/* stat strip */}
        <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatCard
            label="Current streak"
            value="14 days"
            delta="↑ personal best"
            up
            glow
            icon={<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />}
            iconColor="#B98CF0"
          />
          <StatCard
            label="Weekly completion"
            value="86%"
            delta="↑ 6% vs last week"
            up
            icon={<path d="M9 11l3 3L22 4" />}
            iconColor="#5EEAD4"
          />
          <StatCard
            label="Proof score"
            value="92 / 100"
            delta="AI-verified"
            up
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </>
            }
            iconColor="#F2C94C"
          />
          <StatCard
            label="Circle rank"
            value="#2 of 18"
            delta="↓ 1 spot this week"
            icon={
              <>
                <path d="M12 15a4 4 0 100-8 4 4 0 000 8z" />
                <path d="M8.5 14.5L6 21l6-3 6 3-2.5-6.5" />
              </>
            }
            iconColor="#F97066"
          />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          {/* left column */}
          <div className="flex flex-col gap-4">
            {/* chart panel */}
            <Panel>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-[15px] font-semibold">
                    Your tracking
                  </h3>
                  <div className="mt-0.5 text-[11.5px] text-faint dark:text-faint-dark">
                    Habit completion over time
                  </div>
                </div>
                <div className="flex rounded-lg border border-bordersoft bg-surface2 p-1 dark:border-bordersoft-dark dark:bg-surface2-dark">
                  {(["daily", "weekly", "monthly"] as Range[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold capitalize transition-colors ${
                        range === r
                          ? "bg-violet-dark text-white"
                          : "text-faint dark:text-faint-dark"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex h-[200px] items-end pt-1">
                {data.values.map((v, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div
                      className={`w-full max-w-[30px] rounded-t-md rounded-b-sm ${
                        i === data.todayIdx
                          ? "bg-gradient-to-b from-mint to-[#22C3A6] shadow-[0_0_14px_rgba(94,234,212,.3)]"
                          : "bg-gradient-to-b from-violet-bright to-violet-deep shadow-[0_0_14px_rgba(155,93,229,.25)]"
                      }`}
                      style={{ height: `${v}%` }}
                    />
                    <div className="font-mono text-[10.5px] text-faint dark:text-faint-dark">
                      {data.labels[i]}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* habits panel */}
            <Panel>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-[15px] font-semibold">
                    Today&apos;s plans &amp; habits
                  </h3>
                  <div className="mt-0.5 text-[11.5px] text-faint dark:text-faint-dark">
                    {completedCount} of {habits.length} complete
                  </div>
                </div>
                <span className="cursor-pointer text-xs font-semibold text-violet-bright">
                  View all
                </span>
              </div>
              <div>
                {habits.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 border-b border-bordersoft py-2.5 last:border-none dark:border-bordersoft-dark"
                  >
                    <button
                      onClick={() => toggleHabit(h.id)}
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition ${
                        h.done
                          ? "border-transparent bg-gradient-to-br from-violet-bright to-violet-deep shadow-[0_0_10px_rgba(155,93,229,.4)]"
                          : "border-border dark:border-border-dark"
                      }`}
                    >
                      {h.done && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="3"
                          className="h-3 w-3"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-[13.5px] font-medium ${h.done ? "text-faint line-through dark:text-faint-dark" : ""}`}
                      >
                        {h.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-faint dark:text-faint-dark">
                        {h.meta}
                      </div>
                    </div>
                    {h.verified && (
                      <div className="shrink-0 rounded-full border border-mint/25 bg-mint/10 px-2 py-0.5 text-[10px] text-mint">
                        ✓ AI-verified
                      </div>
                    )}
                    <div
                      className={`shrink-0 font-mono text-[11px] ${h.done ? "text-gold" : "text-faint dark:text-faint-dark"}`}
                    >
                      🔥 {h.streak}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* right column */}
          <div className="flex flex-col gap-4">
            {/* competition panel */}
            <Panel>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-[15px] font-semibold">
                    Active competition
                  </h3>
                  <div className="mt-0.5 text-[11.5px] text-faint dark:text-faint-dark">
                    7-day streak challenge
                  </div>
                </div>
                <span className="cursor-pointer text-xs font-semibold text-violet-bright">
                  All
                </span>
              </div>

              <div className="rounded-2xl border border-violet-dark/30 bg-gradient-to-br from-violet-dark/15 to-mint/5 p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">vs. Sarah_K</span>
                  <span className="rounded-full border border-coral/30 bg-coral/10 px-2 py-0.5 font-mono text-[10px] text-coral">
                    2 days left
                  </span>
                </div>
                <div className="my-3.5 flex items-center justify-between">
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <Avatar initials="MR" size={44} />
                    <div className="font-display text-xl font-bold">86%</div>
                    <div className="text-[11.5px] text-dim dark:text-dim-dark">
                      You
                    </div>
                  </div>
                  <div className="px-2 font-mono text-[11px] text-faint dark:text-faint-dark">
                    VS
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <Avatar initials="SK" size={44} />
                    <div className="font-display text-xl font-bold">79%</div>
                    <div className="text-[11.5px] text-dim dark:text-dim-dark">
                      Sarah_K
                    </div>
                  </div>
                </div>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-surface2 dark:bg-surface2-dark">
                  <div
                    className="bg-gradient-to-r from-violet-deep to-violet-bright shadow-[0_0_8px_rgba(155,93,229,.5)]"
                    style={{ width: "52%" }}
                  />
                  <div
                    className="bg-border dark:bg-border-dark"
                    style={{ width: "48%" }}
                  />
                </div>
              </div>

              <button className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep py-2.5 text-[13px] font-semibold text-white shadow-glow hover:shadow-glow-strong">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Challenge a friend
              </button>
            </Panel>

            {/* leaderboard panel */}
            <Panel>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-[15px] font-semibold">
                    Friends leaderboard
                  </h3>
                  <div className="mt-0.5 text-[11.5px] text-faint dark:text-faint-dark">
                    This week&apos;s proof score
                  </div>
                </div>
                <span className="cursor-pointer text-xs font-semibold text-violet-bright">
                  See all
                </span>
              </div>
              {[
                {
                  rank: 1,
                  initials: "JT",
                  name: "Jordan_T",
                  streak: 22,
                  score: 97,
                  top: true,
                },
                {
                  rank: 2,
                  initials: "MR",
                  name: "You",
                  streak: 14,
                  score: 92,
                  you: true,
                },
                {
                  rank: 3,
                  initials: "SK",
                  name: "Sarah_K",
                  streak: 9,
                  score: 88,
                },
                {
                  rank: 4,
                  initials: "AL",
                  name: "Alex_L",
                  streak: 6,
                  score: 81,
                },
                {
                  rank: 5,
                  initials: "NB",
                  name: "Nadia_B",
                  streak: 5,
                  score: 77,
                },
              ].map((f) => (
                <div
                  key={f.rank}
                  className={`flex items-center gap-2.5 py-2 ${
                    f.you
                      ? "my-0.5 -mx-2.5 rounded-lg border border-violet-dark/25 bg-violet-dark/10 px-2.5"
                      : ""
                  }`}
                >
                  <div
                    className={`w-5 text-center font-mono text-xs ${f.top || f.you ? "font-bold text-gold" : "text-faint dark:text-faint-dark"}`}
                  >
                    {f.rank}
                  </div>
                  <Avatar initials={f.initials} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{f.name}</div>
                    <div className="text-[11px] text-faint dark:text-faint-dark">
                      🔥 {f.streak} day streak
                    </div>
                  </div>
                  <div className="shrink-0 font-mono text-[12.5px] font-semibold text-dim dark:text-dim-dark">
                    {f.score}
                  </div>
                </div>
              ))}
            </Panel>

            {/* rewards panel */}
            <Panel>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-[15px] font-semibold">
                    Rewards
                  </h3>
                  <div className="mt-0.5 text-[11.5px] text-faint dark:text-faint-dark">
                    1,240 pts · rank #2 of 18 friends
                  </div>
                </div>
                <span className="cursor-pointer text-xs font-semibold text-violet-bright">
                  View all
                </span>
              </div>
              {[
                {
                  icon: "🏅",
                  title: "14-Day Streak Badge",
                  meta: "Unlocked today",
                  pts: "+150",
                },
                {
                  icon: "📚",
                  title: "Reader's Milestone",
                  meta: "20 pages, 21 days straight",
                  pts: "+90",
                },
                {
                  icon: "🥇",
                  title: "Weekly Top 3",
                  meta: "Circle leaderboard",
                  pts: "+200",
                },
              ].map((r) => (
                <div
                  key={r.title}
                  className="flex items-center gap-3 border-b border-bordersoft py-2.5 last:border-none dark:border-bordersoft-dark"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-bordersoft bg-surface2 dark:border-bordersoft-dark dark:bg-surface2-dark">
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-semibold">{r.title}</div>
                    <div className="text-[11px] text-faint dark:text-faint-dark">
                      {r.meta}
                    </div>
                  </div>
                  <div className="font-mono text-xs font-semibold text-gold">
                    {r.pts}
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
      {children}
    </div>
  );
}

function Avatar({ initials, size }: { initials: string; size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg border border-bordersoft bg-surface2 font-display font-semibold text-violet-bright dark:border-bordersoft-dark dark:bg-surface2-dark"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  up,
  glow,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  delta: string;
  up?: boolean;
  glow?: boolean;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-surface p-4 dark:bg-surface-dark ${
        glow
          ? "border-violet-dark/40 shadow-glow"
          : "border-border dark:border-border-dark"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-dim dark:text-dim-dark">
          {label}
        </span>
        <div className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-surface2 dark:bg-surface2-dark">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor}
            strokeWidth="1.8"
            className="h-3.5 w-3.5"
          >
            {icon}
          </svg>
        </div>
      </div>
      <div className="font-display text-[26px] font-semibold tracking-tight">
        {value}
      </div>
      <div className={`mt-1 text-[11.5px] ${up ? "text-mint" : "text-coral"}`}>
        {delta}
      </div>
    </div>
  );
}
