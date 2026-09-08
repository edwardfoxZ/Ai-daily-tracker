"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, Avatar, Chip } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";
import { initialsFromAddr, shortAddr } from "@/lib/contract";

export default function FriendsPage() {
  const chain = useChainpace();
  const [tab, setTab] = useState<"all" | "requests">("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = chain.friends.filter((a) =>
    a.toLowerCase().includes(query.toLowerCase()),
  );

  const add = async () => {
    if (!query.startsWith("0x") || query.length !== 42) return;
    setBusy(true);
    try {
      await chain.sendFriendRequest(query);
      setQuery("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader
          title="Friends"
          subtitle={`${chain.friends.length} friends · ${chain.incoming.length} pending requests`}
        />
        {chain.error && (
          <Panel className="mb-5">
            <p className="text-sm text-coral">{chain.error}</p>
          </Panel>
        )}
        <div className="mb-5 flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste a wallet 0x… to add a friend"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none dark:border-border-dark dark:bg-surface-dark"
          />
          <button
            onClick={add}
            disabled={busy || !chain.ready}
            className="rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Confirm…" : "Add friend"}
          </button>
        </div>
        <div className="mb-5 flex gap-1.5">
          <button onClick={() => setTab("all")} className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${tab === "all" ? "border-transparent bg-violet-dark text-white" : "border-border bg-surface text-dim dark:border-border-dark"}`}>All friends</button>
          <button onClick={() => setTab("requests")} className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${tab === "requests" ? "border-transparent bg-violet-dark text-white" : "border-border bg-surface text-dim dark:border-border-dark"}`}>Requests · {chain.incoming.length}</button>
        </div>
        {tab === "all" ? (
          <Panel>
            {filtered.map((addr) => (
              <div key={addr} className="flex items-center gap-3.5 border-b border-bordersoft py-3.5 last:border-none dark:border-bordersoft-dark">
                <Avatar initials={initialsFromAddr(addr)} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{shortAddr(addr)}</div>
                  <div className="font-mono text-[11px] text-faint">{addr}</div>
                </div>
                <Chip tone="gold">on-chain</Chip>
              </div>
            ))}
            {filtered.length === 0 && <div className="py-10 text-center text-sm text-faint">No on-chain friends yet.</div>}
          </Panel>
        ) : (
          <Panel>
            {chain.incoming.map((addr) => (
              <div key={addr} className="flex items-center gap-3.5 border-b border-bordersoft py-3.5 last:border-none dark:border-bordersoft-dark">
                <Avatar initials={initialsFromAddr(addr)} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{shortAddr(addr)}</div>
                </div>
                <button onClick={() => chain.acceptFriendRequest(addr)} className="rounded-lg bg-violet-dark px-3.5 py-1.5 text-[12px] font-semibold text-white">Accept</button>
                <button onClick={() => chain.declineFriendRequest(addr)} className="rounded-lg border border-border px-3.5 py-1.5 text-[12px] font-semibold">Decline</button>
              </div>
            ))}
            {chain.incoming.length === 0 && <div className="py-10 text-center text-sm text-faint">No pending requests.</div>}
          </Panel>
        )}
      </main>
    </div>
  );
}
