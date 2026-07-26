"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead, Avatar, Chip } from "@/components/ui";

const friends = [
  { initials: "JT", name: "Jordan_T", streak: 22, score: 97, mutual: 4 },
  { initials: "SK", name: "Sarah_K", streak: 9, score: 88, mutual: 6 },
  { initials: "AL", name: "Alex_L", streak: 6, score: 81, mutual: 2 },
  { initials: "NB", name: "Nadia_B", streak: 5, score: 77, mutual: 3 },
  { initials: "TW", name: "Theo_W", streak: 12, score: 84, mutual: 1 },
];

const pending = [
  { initials: "MP", name: "Maya_P", mutual: 2 },
  { initials: "RC", name: "Ryan_C", mutual: 5 },
];

export default function FriendsPage() {
  const [tab, setTab] = useState<"all" | "requests">("all");
  const [query, setQuery] = useState("");

  const filtered = friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader title="Friends" subtitle={`${friends.length} friends · ${pending.length} pending requests`} />

        <div className="mb-5 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 dark:border-border-dark dark:bg-surface-dark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-faint dark:text-faint-dark">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends or add by username / wallet"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint dark:placeholder:text-faint-dark"
            />
          </div>
          <button className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow hover:shadow-glow-strong">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add friend
          </button>
        </div>

        <div className="mb-5 flex gap-1.5">
          <button
            onClick={() => setTab("all")}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${
              tab === "all" ? "border-transparent bg-violet-dark text-white" : "border-border bg-surface text-dim dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark"
            }`}
          >
            All friends
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${
              tab === "requests" ? "border-transparent bg-violet-dark text-white" : "border-border bg-surface text-dim dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark"
            }`}
          >
            Requests · {pending.length}
          </button>
        </div>

        {tab === "all" ? (
          <Panel>
            {filtered.map((f) => (
              <div key={f.name} className="flex items-center gap-3.5 border-b border-bordersoft py-3.5 last:border-none dark:border-bordersoft-dark">
                <Avatar initials={f.initials} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{f.name}</div>
                  <div className="text-[11.5px] text-faint dark:text-faint-dark">🔥 {f.streak} day streak · {f.mutual} mutual habits</div>
                </div>
                <Chip tone="gold">{f.score} pts</Chip>
                <button className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-semibold text-dim hover:border-violet-dark hover:text-ink dark:border-border-dark dark:text-dim-dark dark:hover:text-ink-dark">
                  Message
                </button>
              </div>
            ))}
            {filtered.length === 0 && <div className="py-10 text-center text-sm text-faint dark:text-faint-dark">No friends match &quot;{query}&quot;.</div>}
          </Panel>
        ) : (
          <Panel>
            {pending.map((p) => (
              <div key={p.name} className="flex items-center gap-3.5 border-b border-bordersoft py-3.5 last:border-none dark:border-bordersoft-dark">
                <Avatar initials={p.initials} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{p.name}</div>
                  <div className="text-[11.5px] text-faint dark:text-faint-dark">{p.mutual} mutual habits</div>
                </div>
                <button className="rounded-lg bg-violet-dark px-3.5 py-1.5 text-[12px] font-semibold text-white">Accept</button>
                <button className="rounded-lg border border-border px-3.5 py-1.5 text-[12px] font-semibold text-dim dark:border-border-dark dark:text-dim-dark">Decline</button>
              </div>
            ))}
          </Panel>
        )}
      </main>
    </div>
  );
}
