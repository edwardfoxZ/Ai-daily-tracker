"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-dvh bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-bordersoft bg-elevated/95 px-3 py-2.5 backdrop-blur lg:hidden dark:border-bordersoft-dark dark:bg-elevated-dark/95">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border dark:border-border-dark"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="font-display text-[15px] font-bold">Chainpace</span>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-16 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
