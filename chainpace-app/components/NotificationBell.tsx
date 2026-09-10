"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotifications } from "@/lib/notifications";

export default function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-dim hover:border-violet-dark hover:text-ink dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark"
        aria-label="Notifications"
      >
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-coral shadow-[0_0_6px_#F97066]" />
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 01-3.4 0" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg dark:border-border-dark dark:bg-surface-dark">
          <div className="border-b border-bordersoft px-3 py-2 text-[12px] font-semibold dark:border-bordersoft-dark">
            Notifications {unread > 0 ? `· ${unread} new` : ""}
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
                  className="block border-b border-bordersoft px-3 py-2.5 last:border-none hover:bg-surface2 dark:border-bordersoft-dark"
                >
                  <div className="text-[12.5px] font-semibold">{n.title}</div>
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
