"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState("mentor");

  const conversations = [
    { id: "mentor", initials: "DR", name: "Dr. Reyes", mentor: true, time: "2m", last: "Great consistency this week — let's talk sleep timing", unread: 2, online: true },
  ];
  const friends = [
    { id: "friend1", initials: "JT", name: "Jordan_T", time: "14m", last: "bro you beat my streak 😤 rematch?", online: true },
    { id: "friend2", initials: "SK", name: "Sarah_K", time: "1h", last: "just logged today's run, proof attached" },
    { id: "friend3", initials: "AL", name: "Alex_L", time: "Yesterday", last: "nice, see you on the leaderboard" },
  ];
  const pending = [
    { id: "p1", initials: "NB", name: "Nadia_B" },
    { id: "p2", initials: "TW", name: "Theo_W" },
  ];

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />

      <div className="flex h-screen flex-1">
        {/* conversation list */}
        <div className="flex w-[308px] shrink-0 px-3 flex-col border-r border-bordersoft bg-bg dark:border-bordersoft-dark dark:bg-bg-dark">
          <div className="px-4.5 pb-3.5 pt-5">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Messages</h2>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 dark:border-border-dark dark:bg-surface-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-faint dark:text-faint-dark">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search mentors & friends"
                className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-faint dark:placeholder:text-faint-dark"
              />
            </div>
          </div>

          <div className="flex gap-1.5 px-4.5 pb-3.5">
            {["All", "Mentors", "Friends", "Requests · 2"].map((f, i) => (
              <div
                key={f}
                className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                  i === 0
                    ? "border-transparent bg-violet-dark text-white"
                    : "border-border bg-surface text-dim dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark"
                }`}
              >
                {f}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-2.5 pb-4">
            <SectionLabel>Mentor</SectionLabel>
            {conversations.map((c) => (
              <ConvItem key={c.id} {...c} active={activeId === c.id} onClick={() => setActiveId(c.id)} />
            ))}

            <SectionLabel>Friends</SectionLabel>
            {friends.map((f) => (
              <ConvItem key={f.id} {...f} active={activeId === f.id} onClick={() => setActiveId(f.id)} />
            ))}

            <SectionLabel>Pending requests</SectionLabel>
            {pending.map((p) => (
              <div key={p.id} className="mb-0.5 flex items-center gap-2.5 rounded-xl px-2 py-2">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-bordersoft bg-surface2 font-display text-[13px] font-semibold text-violet-bright opacity-70 dark:border-bordersoft-dark dark:bg-surface2-dark">
                  {p.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold">{p.name}</div>
                  <div className="text-[10.5px] text-faint dark:text-faint-dark">wants to connect</div>
                </div>
                <div className="flex gap-1.5">
                  <button className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-violet-dark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="h-3 w-3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button className="flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3 text-dim dark:text-dim-dark">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* thread */}
        <div className="flex min-w-0 flex-1 flex-col bg-elevated dark:bg-elevated-dark">
          <div className="flex shrink-0 items-center justify-between border-b border-bordersoft px-6 py-4 dark:border-bordersoft-dark">
            <div className="flex items-center gap-3">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-violet-bright to-violet-deep font-display text-[13px] font-semibold text-white shadow-glow">
                DR
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[14.5px] font-semibold">
                  Dr. Reyes
                  <span className="rounded-md border border-gold/30 bg-gold/10 px-1.5 py-0.5 font-mono text-[8.5px] text-gold">
                    MENTOR
                  </span>
                </div>
                <div className="mt-0.5 text-[11.5px] text-mint">● Online · licensed sleep &amp; habit coach</div>
              </div>
            </div>
            <div className="flex gap-2">
              <IconButton>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              </IconButton>
              <IconButton>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </IconButton>
            </div>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
            <div className="text-center font-mono text-[10.5px] text-faint dark:text-faint-dark">Today</div>

            <Bubble side="in" avatar="DR" mentor>
              Hey Marcus — I looked at your last 14 days. Your consistency on the morning run is excellent. Let&apos;s work on your sleep window next.
              <Time>9:02 AM</Time>
            </Bubble>

            <div className="flex max-w-[64%] gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-violet-bright to-violet-deep font-display text-[10px] font-semibold text-white">
                DR
              </div>
              <div className="max-w-[340px] rounded-2xl rounded-bl-[4px] border border-violet-dark/30 bg-gradient-to-br from-violet-dark/12 to-mint/5 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-violet-bright">
                  📎 Mentor tip · research-backed
                </div>
                <p className="text-[12.5px] leading-relaxed">
                  Going to bed within a consistent 30-minute window improves next-day habit adherence more than total sleep hours alone.
                </p>
                <div className="mt-1.5 text-[10.5px] text-faint dark:text-faint-dark">Source: Sleep Health Journal, 2024</div>
              </div>
            </div>

            <Bubble side="out" avatar="MR">
              That makes sense, I&apos;ve been going to bed anywhere between 10:30 and 1am 😅
              <Time out>9:05 AM</Time>
            </Bubble>

            <Bubble side="in" avatar="DR" mentor>
              Let&apos;s fix that first, before adding anything else. I&apos;ll set a check-in reminder at 10:15 PM.
              <Time>9:06 AM</Time>
            </Bubble>

            <div className="ml-auto flex max-w-[64%] flex-row-reverse gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-surface2 font-display text-[10px] font-semibold text-violet-bright dark:bg-surface2-dark">
                MR
              </div>
              <div>
                <div className="max-w-[250px] rounded-2xl rounded-br-[4px] border border-mint/30 bg-surface p-3.5 dark:bg-surface-dark">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-mint">
                    ✓ Proof submitted
                  </div>
                  <div className="text-[12.5px] font-semibold">Morning run — 5km</div>
                  <div className="text-[11px] text-faint dark:text-faint-dark">AI-verified · 6:42 AM · 14-day streak</div>
                </div>
                <div className="mt-1 text-right text-[10px] text-faint dark:text-faint-dark">9:10 AM</div>
              </div>
            </div>

            <Bubble side="in" avatar="DR" mentor>
              Great consistency this week — let&apos;s talk sleep timing when you&apos;re free today.
              <Time>9:12 AM</Time>
            </Bubble>
          </div>

          <div className="shrink-0 border-t border-bordersoft px-6 pb-5 pt-4 dark:border-bordersoft-dark">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface py-1.5 pl-3.5 pr-1.5 dark:border-border-dark dark:bg-surface-dark">
              <IconButton small>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21.4 11.1l-9.2 9.2a4.5 4.5 0 01-6.4-6.4l9.2-9.2a3 3 0 014.2 4.2l-9.2 9.2a1.5 1.5 0 01-2.1-2.1l8.5-8.5" />
                </svg>
              </IconButton>
              <input
                type="text"
                placeholder="Message Dr. Reyes…"
                className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-faint dark:placeholder:text-faint-dark"
              />
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-violet-bright to-violet-deep shadow-glow">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" className="h-[15px] w-[15px]">
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            <div className="mt-2 pl-1 text-[10.5px] text-faint dark:text-faint-dark">
              Mentor replies are reviewed against published clinical &amp; psychology research.
            </div>
          </div>
        </div>

        {/* info panel */}
        <div className="hidden w-[264px] shrink-0 overflow-y-auto border-l border-bordersoft px-5 py-6 dark:border-bordersoft-dark xl:block">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-gradient-to-br from-violet-bright to-violet-deep font-display text-xl font-bold text-white shadow-glow-strong">
              DR
            </div>
            <div className="text-[15px] font-semibold">Dr. Reyes</div>
            <div className="mt-0.5 font-mono text-[11px] text-gold">Sleep & Habit Mentor</div>
            <div className="mt-3.5 flex justify-center gap-5">
              <MiniStat value="312" label="Mentees" />
              <MiniStat value="4.9" label="Rating" />
              <MiniStat value="3y" label="On Chainpace" />
            </div>
          </div>

          <div className="mt-4 border-t border-bordersoft pt-4 dark:border-bordersoft-dark">
            <h4 className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wide text-faint dark:text-faint-dark">
              Shared focus areas
            </h4>
            {["Morning run consistency", "Deep work blocks", "Sleep window (new)"].map((s) => (
              <div key={s} className="flex items-center gap-2.5 py-1.5 text-xs text-dim dark:text-dim-dark">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-bright shadow-[0_0_6px_#B98CF0]" />
                {s}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-bordersoft pt-4 dark:border-bordersoft-dark">
            <h4 className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wide text-faint dark:text-faint-dark">
              Actions
            </h4>
            {["View mentor profile", "Schedule check-in", "Mute conversation"].map((a) => (
              <button
                key={a}
                className="mb-1.5 w-full rounded-lg border border-border bg-surface py-2.5 text-[12.5px] font-semibold text-dim hover:border-violet-dark hover:text-ink dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark dark:hover:text-ink-dark"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-wide text-faint dark:text-faint-dark">
      {children}
    </div>
  );
}

function ConvItem({
  initials,
  name,
  mentor,
  time,
  last,
  unread,
  online,
  active,
  onClick,
}: {
  initials: string;
  name: string;
  mentor?: boolean;
  time: string;
  last: string;
  unread?: number;
  online?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2.5 ${
        active
          ? "bg-surface2 shadow-[inset_2px_0_0_#B98CF0] dark:bg-surface2-dark"
          : "hover:bg-surface2 dark:hover:bg-surface2-dark"
      }`}
    >
      <div
        className={`relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-semibold ${
          mentor
            ? "bg-gradient-to-br from-violet-bright to-violet-deep text-white shadow-glow"
            : "border border-bordersoft bg-surface2 text-violet-bright dark:border-bordersoft-dark dark:bg-surface2-dark"
        }`}
      >
        {initials}
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-mint shadow-[0_0_6px_#5EEAD4] dark:border-bg-dark" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="flex items-center gap-1.5 truncate text-[13px] font-semibold">
            {name}
            {mentor && (
              <span className="shrink-0 rounded-md border border-gold/30 bg-gold/10 px-1 py-0.5 font-mono text-[8.5px] text-gold">
                MENTOR
              </span>
            )}
          </span>
          <span className="shrink-0 text-[10.5px] text-faint dark:text-faint-dark">{time}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-1.5">
          <span className="truncate text-[11.5px] text-faint dark:text-faint-dark">{last}</span>
          {unread && (
            <span className="flex h-4.5 min-w-[17px] shrink-0 items-center justify-center rounded-full bg-violet-dark px-1.5 font-mono text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({
  side,
  avatar,
  mentor,
  children,
}: {
  side: "in" | "out";
  avatar: string;
  mentor?: boolean;
  children: React.ReactNode;
}) {
  const out = side === "out";
  return (
    <div className={`flex max-w-[64%] gap-2.5 ${out ? "ml-auto flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] font-display text-[10px] font-semibold ${
          mentor
            ? "bg-gradient-to-br from-violet-bright to-violet-deep text-white"
            : "bg-surface2 text-violet-bright dark:bg-surface2-dark"
        }`}
      >
        {avatar}
      </div>
      <div
        className={`rounded-2xl p-3.5 text-[13px] leading-relaxed ${
          out
            ? "rounded-br-[4px] bg-gradient-to-br from-violet-bright to-violet-deep text-white shadow-glow"
            : "rounded-bl-[4px] border border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Time({ children, out }: { children: React.ReactNode; out?: boolean }) {
  return (
    <span className={`mt-1 block text-[10px] ${out ? "text-white/65" : "text-faint dark:text-faint-dark"}`}>
      {children}
    </span>
  );
}

function IconButton({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <button
      className={`flex items-center justify-center rounded-[10px] border border-border bg-surface text-dim hover:border-violet-dark hover:text-ink dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark ${
        small ? "h-8 w-8 border-none bg-surface2 dark:bg-surface2-dark" : "h-[34px] w-[34px]"
      }`}
    >
      <span className="h-[15px] w-[15px]">{children}</span>
    </button>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <b className="block font-display text-base">{value}</b>
      <span className="text-[10px] text-faint dark:text-faint-dark">{label}</span>
    </div>
  );
}
