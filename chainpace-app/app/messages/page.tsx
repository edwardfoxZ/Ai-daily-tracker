"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, Panel } from "@/components/ui";
import { useUser } from "@/lib/user-context";
import {
  AgentChatMessage,
  AgentRoutine,
  ApiMessage,
  ApiUser,
  Conversation,
  agentChat,
  agentCta,
  agentProfile,
  agentThread,
  listConversations,
  listMessages,
  searchUsers,
  sendMessage,
} from "@/lib/api";

const PACE: ApiUser = { id: 0, username: "Pace" };

export default function MessagesPage() {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [inbox, setInbox] = useState<Conversation[]>([]);
  const [results, setResults] = useState<ApiUser[]>([]);
  const [peer, setPeer] = useState<ApiUser | null>(PACE);
  const [thread, setThread] = useState<ApiMessage[]>([]);
  const [agentMsgs, setAgentMsgs] = useState<AgentChatMessage[]>([]);
  const [routines, setRoutines] = useState<AgentRoutine[]>([]);
  const [stateLabel, setStateLabel] = useState("on_track");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const isPace = peer?.id === 0;

  const loadInbox = () => {
    if (!user) return;
    listConversations().then((r) => setInbox(r.conversations)).catch((e) => setError(e.message));
  };
  const loadPace = () => {
    agentThread().then((r) => setAgentMsgs(r.messages)).catch((e) => setError(e.message));
    agentProfile().then((r) => {
      setRoutines(r.routines || []);
      setStateLabel(r.state || "on_track");
    }).catch(() => {});
  };

  useEffect(() => {
    loadInbox();
    loadPace();
  }, [user?.id]);

  useEffect(() => {
    if (!peer || isPace) return;
    listMessages(peer.id).then((res) => setThread(res.messages)).catch((e) => setError(e.message));
  }, [peer, isPace]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length, agentMsgs.length]);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await searchUsers(query);
      setResults(res.users.filter((u) => u.id !== user?.id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!peer || !draft.trim() || busy) return;
    const body = draft.trim();
    setDraft("");
    setBusy(true);
    try {
      if (isPace) {
        const res = await agentChat(body);
        setAgentMsgs((prev) => [...prev, { id: Date.now(), role: "user", body, createdAt: new Date().toISOString() }, res.message]);
        if (res.state) setStateLabel(res.state);
        loadPace();
      } else {
        const res = await sendMessage(peer.id, body);
        setThread((prev) => [...prev, res.message]);
        loadInbox();
      }
    } catch (err: any) {
      setError(err.message);
      setDraft(body);
    } finally {
      setBusy(false);
    }
  };

  const lastPace = [...agentMsgs].reverse().find((m) => m.role === "assistant")?.body || "Your private consistency coach";

  return (
    <AppShell>
      <PageHeader title="Messages" subtitle="Pace is pinned first — friends stay in the same inbox" />
      {error && <p className="mb-3 text-sm text-coral">{error}</p>}
      {!user && (<Panel><p className="text-sm text-dim">Sign in to chat.</p></Panel>)}
      {user && (
        <div className="grid min-h-[70vh] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-bordersoft lg:border-b-0 lg:border-r dark:border-bordersoft-dark">
            <form onSubmit={search} className="flex gap-2 border-b border-bordersoft p-3 dark:border-bordersoft-dark">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a user" className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm dark:border-border-dark dark:bg-bg-dark" />
              <button className="rounded-lg bg-violet-dark px-3 text-xs font-semibold text-white">Find</button>
            </form>
            <button onClick={() => setPeer(PACE)} className={`flex w-full flex-col items-start gap-0.5 border-b border-bordersoft px-4 py-3 text-left hover:bg-surface2 dark:border-bordersoft-dark ${isPace ? "bg-violet-dark/10" : ""}`}>
              <span className="flex items-center gap-2 text-[13.5px] font-semibold">Pace <span className="rounded-full bg-violet-dark/15 px-1.5 py-0.5 text-[10px] uppercase text-violet-dark">coach</span></span>
              <span className="w-full truncate text-[12px] text-faint">{lastPace}</span>
            </button>
            {results.map((u) => (
              <button key={u.id} onClick={() => { setPeer(u); setResults([]); }} className="w-full px-4 py-2 text-left text-sm hover:bg-surface2">{u.username}</button>
            ))}
            {inbox.map((c) => (
              <button key={c.peer.id} onClick={() => setPeer(c.peer)} className={`flex w-full flex-col items-start border-b border-bordersoft px-4 py-3 text-left dark:border-bordersoft-dark ${peer?.id === c.peer.id ? "bg-violet-dark/10" : ""}`}>
                <span className="text-[13.5px] font-semibold">{c.peer.username}</span>
                <span className="w-full truncate text-[12px] text-faint">{c.lastBody}</span>
              </button>
            ))}
          </aside>
          <section className="flex min-h-[55vh] flex-col">
            <div className="border-b border-bordersoft px-3 py-3 dark:border-bordersoft-dark">
              <div className="font-semibold">{peer?.username}</div>
              {isPace && <div className="text-[11px] uppercase text-faint">{stateLabel.replace("_", " ")}</div>}
            </div>
            {isPace && routines.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-b border-bordersoft px-3 py-2 dark:border-bordersoft-dark">
                {routines.map((r) => <span key={r.id} className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] dark:border-border-dark">{r.name}</span>)}
              </div>
            )}
            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {isPace ? agentMsgs.map((m) => (
                <div key={m.id}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] ${m.role === "user" ? "ml-auto bg-violet-dark text-white" : "bg-surface2 dark:bg-surface2-dark"}`}>{m.body}</div>
                  {m.cta && m.cta.status !== "accepted" && m.cta.status !== "declined" && (
                    <div className="mt-2 max-w-[85%] rounded-xl border border-border p-3 text-[12.5px] dark:border-border-dark">
                      <div className="mb-2 font-medium">{m.cta.label}</div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => agentCta(m.cta!.id, true).then((res) => { setAgentMsgs((p) => [...p, res.message]); loadPace(); })} className="rounded-full bg-violet-dark px-3 py-1 text-xs font-semibold text-white">Confirm</button>
                        <button type="button" onClick={() => agentCta(m.cta!.id, false).then((res) => { setAgentMsgs((p) => [...p, res.message]); })} className="rounded-full border border-border px-3 py-1 text-xs dark:border-border-dark">Not now</button>
                      </div>
                    </div>
                  )}
                </div>
              )) : thread.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] ${m.fromUserId === user.id ? "ml-auto bg-violet-dark text-white" : "bg-surface2 dark:bg-surface2-dark"}`}>{m.body}</div>
              ))}
              <div ref={bottom} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-bordersoft p-3 dark:border-bordersoft-dark">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={isPace ? "Tell Pace a routine or what is breaking…" : `Message @${peer?.username}` } className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm dark:border-border-dark dark:bg-bg-dark" />
              <button disabled={busy} className="rounded-full bg-violet-dark px-4 text-sm font-semibold text-white disabled:opacity-60">{busy ? "…" : "Send"}</button>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
