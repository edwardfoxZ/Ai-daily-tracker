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
import { useUser } from "@/lib/user-context";
import { listConversations } from "@/lib/api";
import { shortAddr } from "@/lib/contract";

export type NoticeKind =
  | "habit"
  | "completion"
  | "friend"
  | "competition"
  | "reward"
  | "message"
  | "insight";

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
  push: (n: Omit<Notice, "id" | "at" | "read"> & { id?: string }) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<Ctx | null>(null);
const KEY = "chainpace_notices_v2";
const SEEN = "chainpace_notice_seen_v2";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const chain = useChainpace();
  const { user } = useUser();
  const [items, setItems] = useState<Notice[]>([]);
  const primed = useRef(false);
  const seen = useRef({
    incoming: 0,
    points: 0,
    comps: 0,
    habits: 0,
    inbox: 0,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: Notice[] = JSON.parse(raw);
        setItems(parsed.map((n) => ({ ...n, read: true })));
      }
      const s = localStorage.getItem(SEEN);
      if (s) seen.current = { ...seen.current, ...JSON.parse(s) };
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 30)));
  }, [items]);

  const persistSeen = () => {
    localStorage.setItem(SEEN, JSON.stringify(seen.current));
  };

  const push = useCallback((n: Omit<Notice, "id" | "at" | "read"> & { id?: string }) => {
    const id = n.id || `${n.kind}-${Date.now()}`;
    setItems((prev) => {
      if (prev.some((x) => x.id === id)) return prev;
      return [
        { ...n, id, at: Date.now(), read: false },
        ...prev.filter((x) => x.read || Date.now() - x.at < 86_400_000),
      ].slice(0, 30);
    });
  }, []);

  useEffect(() => {
    if (!chain.ready) return;
    if (!primed.current) {
      seen.current.incoming = chain.incoming.length;
      seen.current.points = chain.points;
      seen.current.comps = chain.competitions.length;
      seen.current.habits = chain.habits.length;
      primed.current = true;
      persistSeen();
      return;
    }
    if (chain.incoming.length > seen.current.incoming) {
      const newest = chain.incoming[chain.incoming.length - 1];
      push({
        id: `friend-${newest}`,
        kind: "friend",
        title: "Friend request",
        body: `${shortAddr(newest)} sent you a request.`,
        href: "/friends",
      });
    }
    if (chain.points > seen.current.points) {
      push({
        id: `reward-${chain.points}`,
        kind: "reward",
        title: "Points earned",
        body: `Balance is now ${chain.points} pts.`,
        href: "/rewards",
      });
    }
    if (chain.competitions.length > seen.current.comps) {
      push({
        id: `comp-${chain.competitions.length}`,
        kind: "competition",
        title: "Competition",
        body: "A challenge was created or updated.",
        href: "/competitions",
      });
    }
    if (chain.habits.length > seen.current.habits) {
      push({
        id: `habit-${chain.habits[0]?.id}`,
        kind: "habit",
        title: "Habit added",
        body: chain.habits[0]?.title || "New habit on-chain",
        href: "/habits",
      });
    }
    seen.current.incoming = chain.incoming.length;
    seen.current.points = chain.points;
    seen.current.comps = chain.competitions.length;
    seen.current.habits = chain.habits.length;
    persistSeen();
  }, [chain.ready, chain.incoming, chain.points, chain.competitions.length, chain.habits, push]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const tick = async () => {
      try {
        const res = await listConversations();
        if (!alive) return;
        const last = res.conversations[0];
        const stamp = last ? Date.parse(last.lastAt) || res.conversations.length : 0;
        if (seen.current.inbox === 0) {
          seen.current.inbox = stamp;
          persistSeen();
          return;
        }
        if (stamp > seen.current.inbox && last && last.lastFromId !== user.id) {
          push({
            id: `msg-${last.peer.id}-${stamp}`,
            kind: "message",
            title: `Message from ${last.peer.username}`,
            body: last.lastBody,
            href: "/messages",
          });
          seen.current.inbox = stamp;
          persistSeen();
        }
      } catch {
        /* not signed in / backend down */
      }
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [user, push]);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unread = items.filter((n) => !n.read).length;
  const value = useMemo(
    () => ({ items, unread, push, markAllRead }),
    [items, unread, push, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
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
