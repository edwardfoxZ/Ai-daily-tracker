"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, Panel, Avatar, Chip } from "@/components/ui";
import { useChainpace } from "@/lib/useChainpace";
import { initialsFromAddr, shortAddr } from "@/lib/contract";
import { getSettings, recordFriend, updateSettings } from "@/lib/api";

export default function FriendsPage() {
  const chain = useChainpace();
  const [tab, setTab] = useState<"all" | "requests">("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [openDms, setOpenDms] = useState(false);
  const filtered = chain.friends.filter((a) => a.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    getSettings()
      .then((s) => setOpenDms(s.allowAnyoneMessage))
      .catch(() => {});
  }, []);

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

  const accept = async (addr: string) => {
    await chain.acceptFriendRequest(addr);
    try {
      await recordFriend({ walletAddress: addr });
    } catch {
      /* peer may not have a SQL account yet */
    }
  };

  return (
    <AppShell>
      <PageHeader title="Friends" subtitle={`${chain.friends.length} friends · ${chain.incoming.length} pending`} />
      {chain.error && <Panel className="mb-5"><p className="text-sm text-coral">{chain.error}</p></Panel>}
      <Panel className="mb-5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={openDms}
            onChange={async (e) => {
              const v = e.target.checked;
              setOpenDms(v);
              try {
                await updateSettings(v);
              } catch {
                setOpenDms(!v);
              }
            }}
          />
          <span>
            <span className="font-semibold">Allow anyone to message me</span>
            <span className="mt-0.5 block text-[12px] text-faint">
              Off = only accepted friends. On = anyone who knows your username or wallet can DM.
            </span>
          </span>
        </label>
      </Panel>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Paste a wallet 0x…" className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] dark:border-border-dark dark:bg-surface-dark" />
        <button onClick={add} disabled={busy || !chain.ready} className="rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50">
          {busy ? "Confirm…" : "Add friend"}
        </button>
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        <button onClick={() => setTab("all")} className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${tab === "all" ? "border-transparent bg-violet-dark text-white" : "border-border bg-surface text-dim"}`}>All friends</button>
        <button onClick={() => setTab("requests")} className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${tab === "requests" ? "border-transparent bg-violet-dark text-white" : "border-border bg-surface text-dim"}`}>Requests · {chain.incoming.length}</button>
      </div>
      <Panel>
        {tab === "all" ? (
          <>
            {filtered.map((addr) => (
              <div key={addr} className="flex items-center gap-3 border-b border-bordersoft py-3 last:border-none dark:border-bordersoft-dark">
                <Avatar initials={initialsFromAddr(addr)} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{shortAddr(addr)}</div>
                  <div className="truncate font-mono text-[11px] text-faint">{addr}</div>
                </div>
                <Chip tone="gold">on-chain</Chip>
              </div>
            ))}
            {filtered.length === 0 && <div className="py-10 text-center text-sm text-faint">No on-chain friends yet.</div>}
          </>
        ) : (
          <>
            {chain.incoming.map((addr) => (
              <div key={addr} className="flex flex-wrap items-center gap-2 border-b border-bordersoft py-3 last:border-none">
                <Avatar initials={initialsFromAddr(addr)} size={36} />
                <div className="min-w-0 flex-1 text-[13.5px] font-semibold">{shortAddr(addr)}</div>
                <button onClick={() => accept(addr)} className="rounded-lg bg-violet-dark px-3 py-1.5 text-[12px] font-semibold text-white">Accept</button>
                <button onClick={() => chain.declineFriendRequest(addr)} className="rounded-lg border border-border px-3 py-1.5 text-[12px]">Ignore</button>
              </div>
            ))}
            {chain.incoming.length === 0 && <div className="py-10 text-center text-sm text-faint">No pending requests.</div>}
          </>
        )}
      </Panel>
    </AppShell>
  );
}
