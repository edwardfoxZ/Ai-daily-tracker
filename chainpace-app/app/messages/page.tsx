"use client";

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel } from "@/components/ui";
import { useUser } from "@/lib/user-context";
import {
  ApiMessage,
  ApiUser,
  listMessages,
  searchUsers,
  sendMessage,
} from "@/lib/api";

export default function MessagesPage() {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiUser[]>([]);
  const [peer, setPeer] = useState<ApiUser | null>(null);
  const [thread, setThread] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!peer) return;
    listMessages(peer.id)
      .then((res) => setThread(res.messages))
      .catch((e) => setError(e.message));
  }, [peer]);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await searchUsers(query);
      setResults(res.users.filter((u) => u.id !== user?.id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!peer || !draft.trim()) return;
    try {
      const res = await sendMessage(peer.id, draft.trim());
      setThread((prev) => [...prev, res.message]);
      setDraft("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader title="Messages" subtitle="Stored in your Go backend — not on-chain" />
        {error && <p className="mb-3 text-sm text-coral">{error}</p>}
        {!user && (
          <Panel>
            <p className="text-sm text-dim">Sign in to send messages.</p>
          </Panel>
        )}
        {user && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <Panel>
              <form onSubmit={search} className="mb-3 flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search username"
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm dark:border-border-dark dark:bg-bg-dark"
                />
                <button className="rounded-lg bg-violet-dark px-3 text-xs font-semibold text-white">
                  Go
                </button>
              </form>
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setPeer(u)}
                  className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
                    peer?.id === u.id ? "bg-violet-dark/15" : "hover:bg-surface2"
                  }`}
                >
                  {u.username}
                </button>
              ))}
            </Panel>
            <Panel>
              {!peer ? (
                <p className="py-10 text-center text-sm text-faint">Pick someone to chat.</p>
              ) : (
                <>
                  <div className="mb-3 text-sm font-semibold">Chat with {peer.username}</div>
                  <div className="mb-3 max-h-[360px] space-y-2 overflow-y-auto">
                    {thread.map((m) => (
                      <div
                        key={m.id}
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] ${
                          m.fromUserId === user.id
                            ? "ml-auto bg-violet-dark text-white"
                            : "bg-surface2 dark:bg-surface2-dark"
                        }`}
                      >
                        {m.body}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={send} className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Message"
                      className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm dark:border-border-dark dark:bg-bg-dark"
                    />
                    <button className="rounded-lg bg-violet-dark px-4 text-sm font-semibold text-white">
                      Send
                    </button>
                  </form>
                </>
              )}
            </Panel>
          </div>
        )}
      </main>
    </div>
  );
}
