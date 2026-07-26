"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-[23px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-dim dark:text-dim-dark">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        {actions}
      </div>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark ${className}`}>
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="font-display text-[15px] font-semibold">{title}</h3>
        {sub && <div className="mt-0.5 text-[11.5px] text-faint dark:text-faint-dark">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg border border-bordersoft bg-surface2 font-display font-semibold text-violet-bright dark:border-bordersoft-dark dark:bg-surface2-dark"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  );
}

export function Chip({ children, tone = "violet" }: { children: ReactNode; tone?: "violet" | "mint" | "gold" | "coral" }) {
  const tones: Record<string, string> = {
    violet: "border-violet-dark/30 bg-violet-dark/10 text-violet-bright",
    mint: "border-mint/25 bg-mint/10 text-mint",
    gold: "border-gold/30 bg-gold/10 text-gold",
    coral: "border-coral/30 bg-coral/10 text-coral",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10.5px] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-bordersoft bg-surface2 text-faint dark:border-bordersoft-dark dark:bg-surface2-dark dark:text-faint-dark">
        {icon}
      </div>
      <div className="text-[13.5px] font-semibold">{title}</div>
      {sub && <div className="mt-1 max-w-[280px] text-[12px] text-faint dark:text-faint-dark">{sub}</div>}
    </div>
  );
}
