"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useUser } from "@/lib/user-context";
import { useWeb3 } from "@/lib/useWeb3";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  count?: string;
  hot?: boolean;
}

const items: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/habits",
    label: "Habits & Plans",
    count: "6",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    href: "/tracking",
    label: "Tracking",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <path d="M3 3v18h18" />
        <path d="M18 9l-5 5-3-3-4 4" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Messages",
    count: "3",
    hot: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    ),
  },
  {
    href: "/rewards",
    label: "Rewards",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <path d="M12 15a4 4 0 100-8 4 4 0 000 8z" />
        <path d="M8.5 14.5L6 21l6-3 6 3-2.5-6.5" />
      </svg>
    ),
  },
  {
    href: "/competitions",
    label: "Competitions",
    count: "2",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    ),
  },
  {
    href: "/friends",
    label: "Friends",
    count: "18",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.5 20a6.5 6.5 0 0113 0" />
        <circle cx="18" cy="9" r="2.6" />
        <path d="M15.5 20a5 5 0 018.5-3.5" opacity={0.6} />
      </svg>
    ),
  },
];

function initialsFrom(name: string) {
  const clean = name.replace(/^0x/i, "");
  if (/^[0-9a-fA-F]+$/.test(clean) && name.startsWith("0x")) {
    return clean.slice(0, 2).toUpperCase();
  }
  const parts = name.split(/[_\s.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading, logout } = useUser();
  const web3 = useWeb3();

  const displayName = user?.username ?? (loading ? "Loading…" : "Guest");
  const displaySub = user?.walletAddress
    ? shortWallet(user.walletAddress)
    : user?.email
      ? user.email
      : user
        ? "No wallet linked"
        : "Not signed in";
  const initials = user ? initialsFrom(user.username) : "--";

  const handleLogout = async () => {
    web3.disconnect();
    await logout();
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[236px] shrink-0 flex-col border-r border-bordersoft bg-elevated p-4 dark:border-bordersoft-dark dark:bg-elevated-dark">
      <div className="flex items-center gap-2.5 px-2 pb-6 pt-1.5">
        <div className="relative h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep shadow-glow">
          <div className="absolute inset-[7px] rounded-[4px] bg-elevated dark:bg-elevated-dark" />
        </div>
        <span className="font-display text-[16.5px] font-bold">Chainpace</span>
      </div>

      <div className="mb-5">
        <div className="px-2.5 pb-2 font-mono text-[10.5px] uppercase tracking-wider text-faint dark:text-faint-dark">
          Menu
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
                  active
                    ? "bg-surface2 text-ink shadow-[inset_2px_0_0_#B98CF0] dark:bg-surface2-dark dark:text-ink-dark"
                    : "text-dim hover:bg-surface2 hover:text-ink dark:text-dim-dark dark:hover:bg-surface2-dark dark:hover:text-ink-dark"
                }`}
              >
                <span className="h-[17px] w-[17px] shrink-0">{item.icon}</span>
                {item.label}
                {item.count && (
                  <span
                    className={`ml-auto rounded-md px-1.5 py-0.5 font-mono text-[10.5px] ${
                      item.hot
                        ? "bg-violet-dark text-white"
                        : "bg-surface text-faint dark:bg-surface-dark dark:text-faint-dark"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mb-5">
        <div className="px-2.5 pb-2 font-mono text-[10.5px] uppercase tracking-wider text-faint dark:text-faint-dark">
          AI
        </div>
        <Link
          href="/insights"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-dim transition-colors hover:bg-surface2 hover:text-ink dark:text-dim-dark dark:hover:bg-surface2-dark dark:hover:text-ink-dark"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            className="h-[17px] w-[17px] shrink-0"
          >
            <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
            <circle cx="12" cy="12" r="3.4" />
          </svg>
          AI Insights
        </Link>
      </div>

      <div className="mt-auto border-t border-bordersoft pt-3.5 dark:border-bordersoft-dark">
        {user ? (
          <div className="group flex items-center gap-2.5 rounded-lg p-2 hover:bg-surface2 dark:hover:bg-surface2-dark">
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep font-display text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold">
                  {displayName}
                </div>
                <div className="truncate font-mono text-[10.5px] text-faint dark:text-faint-dark">
                  {displaySub}
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Log out"
              className="shrink-0 rounded-md p-1.5 text-faint opacity-0 transition hover:bg-surface hover:text-coral group-hover:opacity-100 dark:text-faint-dark dark:hover:bg-surface-dark"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-3.5 w-3.5"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep py-2.5 text-[12.5px] font-semibold text-white shadow-glow"
          >
            {loading ? "Loading…" : "Sign in"}
          </Link>
        )}
      </div>
    </aside>
  );
}
