"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, Panel } from "@/components/ui";
import { useUser } from "@/lib/user-context";
import {
  ApiMessage,
  ApiUser,
  Conversation,
  listConversations,
  listMessages,
  searchUsers,
  sendMessage,
} from "@/lib/api";

export default function MessagesPage() {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [inbox, setInbox] = useState<Conversation[]>([]);
  const [results, setResults] = useState<ApiUser[]>([]);
  const [peer, setPeer] = useState<ApiUser | null>(null);
  const [thread, setThread] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const loadInbox = () => {
    if (!user) return;
    listConversations()
      .then((r) => setInbox(r.conversations))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!peer) return;
    listMessages(peer.id)
      .then((res) => setThread(res.messages))
      .catch((e) => setError(e.message));
  }, [peer]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

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

  const openPeer = (u: ApiUser) => {
    setPeer(u);
    setResults([]);
    setQuery("");
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!peer || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    try {
      const res = await sendMessage(peer.id, body);
      setThread((prev) => [...prev, res.message]);
      loadInbox();
    } catch (err: any) {
      setError(err.message);
      setDraft(body);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Messages" subtitle="Direct messages — stored on your server" />
      {error && <p className="mb-3 text-sm text-coral">{error}</p>}
      {!user && (
        <Panel>
          <p className="text-sm text-dim">Sign in to chat.</p>
        </Panel>
      )}
      {user && (
        <div className="grid min-h-[70vh] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark lg:grid-cols-[280px_1fr]">
          <aside className={`border-b border-bordersoft lg:border-b-0 lg:border-r dark:border-bordersoft-dark ${peer ? "hidden lg:block" : "block"}`}>
            <form onSubmit={search} className="flex gap-2 border-b border-bordersoft p-3 dark:border-bordersoft-dark">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a user"
                className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm dark:border-border-dark dark:bg-bg-dark"
              />
              <button className="rounded-lg bg-violet-dark px-3 text-xs font-semibold text-white">Find</button>
            </form>
            {results.length > 0 && (
              <div className="border-b border-bordersoft p-2 dark:border-bordersoft-dark">
                <div className="px-2 pb-1 text-[10px] uppercase text-faint">Results</div>
                {results.map((u) => (
                  <button key={u.id} onClick={() => openPeer(u)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2">
                    {u.username}
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-[50vh] overflow-y-auto lg:max-h-[60vh]">
              {inbox.length === 0 && results.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-faint">No conversations yet. Find someone above.</p>
              )}
              {inbox.map((c) => (
                <button
                  key={c.peer.id}
                  onClick={() => openPeer(c.peer)}
                  className={`flex w-full flex-col items-start gap-0.5 border-b border-bordersoft px-4 py-3 text-left last:border-none hover:bg-surface2 dark:border-bordersoft-dark ${
                    peer?.id === c.peer.id ? "bg-violet-dark/10" : ""
                  }`}
                >
                  <span className="text-[13.5px] font-semibold">{c.peer.username}</span>
                  <span className="w-full truncate text-[12px] text-faint">{c.lastBody}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className={`flex min-h-[55vh] flex-col ${peer ? "flex" : "hidden lg:flex"}`}>
            {!peer ? (
              <div className="m-auto text-sm text-faint">Select a conversation</div>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-bordersoft px-3 py-3 dark:border-bordersoft-dark">
                  <button type="button" className="rounded-md px-2 py-1 text-sm text-faint lg:hidden" onClick={() => setPeer(null)}>
                    ←
                  </button>
                  <div className="font-semibold">{peer.username}</div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                  {thread.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed ${
                        m.fromUserId === user.id
                          ? "ml-auto rounded-br-md bg-violet-dark text-white"
                          : "rounded-bl-md bg-surface2 dark:bg-surface2-dark"
                      }`}
                    >
                      {m.body}
                    </div>
                  ))}
                  <div ref={bottom} />
                </div>
                <form onSubmit={send} className="flex gap-2 border-t border-bordersoft p-3 dark:border-bordersoft-dark">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message @${peer.username}`}
                    className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm dark:border-border-dark dark:bg-bg-dark"
                  />
                  <button className="rounded-full bg-violet-dark px-4 text-sm font-semibold text-white">Send</button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
