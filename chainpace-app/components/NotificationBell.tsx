"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotifications } from "@/lib/notifications";

function ago(at: number) {
  const s = Math.max(1, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-dim hover:border-violet-dark hover:text-ink dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark"
        aria-label="Notifications"
      >
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-coral px-1 text-center text-[9px] font-bold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 01-3.4 0" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg dark:border-border-dark dark:bg-surface-dark">
          <div className="flex items-center justify-between border-b border-bordersoft px-3 py-2 dark:border-bordersoft-dark">
            <span className="text-[12px] font-semibold">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-[11px] text-violet-bright">
                Mark read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] text-faint">No activity yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href || "/dashboard"}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-bordersoft px-3 py-2.5 last:border-none hover:bg-surface2 dark:border-bordersoft-dark ${n.read ? "" : "bg-violet-dark/5"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12.5px] font-semibold">{n.title}</div>
                    <div className="text-[10px] text-faint">{ago(n.at)}</div>
                  </div>
                  <div className="text-[11px] text-faint">{n.body}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
