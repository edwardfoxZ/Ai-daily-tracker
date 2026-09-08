"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useChainpace } from "@/lib/useChainpace";
import { shortAddr } from "@/lib/contract";

export type NoticeKind =
  | "habit"
  | "completion"
  | "friend"
  | "competition"
  | "reward";

export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  href?: string;
  at: number;
  read: boolean;
}

interface Ctx {
  items: Notice[];
  unread: number;
  push: (n: Omit<Notice, "id" | "at" | "read">) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<Ctx | null>(null);
const KEY = "chainpace_notices";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const chain = useChainpace();
  const [items, setItems] = useState<Notice[]>([]);
  const prevIncoming = useRef<number | null>(null);
  const prevPoints = useRef<number | null>(null);
  const prevComps = useRef<number | null>(null);
  const prevHabits = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 40)));
  }, [items]);

  const push = useCallback((n: Omit<Notice, "id" | "at" | "read">) => {
    setItems((prev) => [
      {
        ...n,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: Date.now(),
        read: false,
      },
      ...prev,
    ].slice(0, 40));
  }, []);

  useEffect(() => {
    const onHabit = () =>
      push({
        kind: "habit",
        title: "Habit created",
        body: "A new habit was written on-chain.",
        href: "/habits",
      });
    window.addEventListener("chainpace:habits-changed", onHabit);
    return () => window.removeEventListener("chainpace:habits-changed", onHabit);
  }, [push]);

  useEffect(() => {
    if (!chain.ready) return;
    if (prevIncoming.current === null) {
      prevIncoming.current = chain.incoming.length;
    } else if (chain.incoming.length > prevIncoming.current) {
      const newest = chain.incoming[chain.incoming.length - 1];
      push({
        kind: "friend",
        title: "Friend request",
        body: `${shortAddr(newest)} sent you a request.`,
        href: "/friends",
      });
      prevIncoming.current = chain.incoming.length;
    } else {
      prevIncoming.current = chain.incoming.length;
    }
  }, [chain.ready, chain.incoming, push]);

  useEffect(() => {
    if (!chain.ready) return;
    if (prevPoints.current === null) {
      prevPoints.current = chain.points;
      return;
    }
    if (chain.points > prevPoints.current) {
      push({
        kind: "reward",
        title: "Points earned",
        body: `On-chain balance is now ${chain.points} pts.`,
        href: "/rewards",
      });
    }
    prevPoints.current = chain.points;
  }, [chain.ready, chain.points, push]);

  useEffect(() => {
    if (!chain.ready) return;
    if (prevComps.current === null) {
      prevComps.current = chain.competitions.length;
      return;
    }
    if (chain.competitions.length > prevComps.current) {
      push({
        kind: "competition",
        title: "Competition update",
        body: "A challenge was created or updated on-chain.",
        href: "/competitions",
      });
    }
    prevComps.current = chain.competitions.length;
  }, [chain.ready, chain.competitions.length, push]);

  useEffect(() => {
    if (!chain.ready) return;
    if (prevHabits.current === null) {
      prevHabits.current = chain.habits.length;
      return;
    }
    if (chain.habits.length > prevHabits.current) {
      push({
        kind: "habit",
        title: "New habit on-chain",
        body: `${chain.habits[0]?.title ?? "A habit"} is now live.`,
        href: "/habits",
      });
    }
    prevHabits.current = chain.habits.length;
  }, [chain.ready, chain.habits, push]);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unread = items.filter((n) => !n.read).length;
  const value = useMemo(
    () => ({ items, unread, push, markAllRead }),
    [items, unread, push, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      items: [] as Notice[],
      unread: 0,
      push: () => {},
      markAllRead: () => {},
    };
  }
  return ctx;
}
