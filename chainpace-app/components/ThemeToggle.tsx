"use client";

import { useTheme } from "@/lib/theme-context";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-1 dark:border-border-dark dark:bg-surface-dark">
      <button
        onClick={() => setTheme("dark")}
        className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors ${
          theme === "dark"
            ? "bg-violet-dark text-white"
            : "text-faint dark:text-faint-dark"
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme("light")}
        className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors ${
          theme === "light"
            ? "bg-violet-dark text-white"
            : "text-faint dark:text-faint-dark"
        }`}
      >
        Light
      </button>
    </div>
  );
}
