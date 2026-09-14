"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, Panel, PanelHead, Chip } from "@/components/ui";
import { useUser } from "@/lib/user-context";
import { useWeb3 } from "@/lib/useWeb3";
import { useChainpace } from "@/lib/useChainpace";
import { connectInjectedOrWc, MobileWallet } from "@/lib/connectWallets";
import { friendlyWalletError, hardDisconnectWallet } from "@/lib/walletSession";
import { linkWallet, updateMe } from "@/lib/api";

function initialsFrom(name: string) {
  if (name.startsWith("0x")) return name.slice(2, 4).toUpperCase();
  const parts = name.split(/[_\s.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
  const { user, loading, logout, refetch } = useUser();
  const web3 = useWeb3();
  const chain = useChainpace();
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(user?.username ?? "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletMsg, setWalletMsg] = useState<string | null>(null);
  const [walletErr, setWalletErr] = useState<string | null>(null);

  const liveAddress = web3.address || user?.walletAddress || null;

  const saveUsername = async () => {
    setSavingUsername(true);
    try {
      await updateMe({ username: usernameDraft.trim(), bio: user?.bio || "" });
      await refetch();
      setEditingUsername(false);
    } catch (e: any) {
      setWalletErr(e?.message || "Could not save username");
    } finally {
      setSavingUsername(false);
    }
  };

  const copyWallet = async () => {
    if (!liveAddress) return;
    await navigator.clipboard.writeText(liveAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const connectWallet = async (kind: MobileWallet) => {
    setWalletErr(null);
    setWalletMsg(null);
    setWalletBusy(true);
    try {
      const addr = await connectInjectedOrWc(kind);
      await linkWallet(addr);
      await refetch();
      setWalletMsg(`Connected ${shortWallet(addr)}`);
      window.dispatchEvent(
        new CustomEvent("chainpace:notify", {
          detail: {
            kind: "reward",
            title: "Wallet linked",
            body: shortWallet(addr),
            href: "/profile",
          },
        }),
      );
    } catch (err: any) {
      setWalletErr(friendlyWalletError(err));
    } finally {
      setWalletBusy(false);
    }
  };

  const disconnectWalletOnly = () => {
    web3.disconnect();
    hardDisconnectWallet();
    setWalletMsg("Wallet session cleared on this device.");
  };

  const fullLogout = async () => {
    web3.disconnect();
    hardDisconnectWallet();
    await logout();
  };

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-faint">Loading profile…</p>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <p className="mb-3 text-sm text-faint">You&apos;re not signed in.</p>
        <a href="/login" className="rounded-lg bg-violet-dark px-5 py-2.5 text-sm font-semibold text-white">Go to sign in</a>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Identity, wallet, and session" />
      {walletErr && (
        <div className="mb-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{walletErr}</div>
      )}
      {walletMsg && (
        <div className="mb-4 rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm">{walletMsg}</div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-5">
          <Panel>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-bright to-violet-deep font-display text-2xl font-bold text-white">
                {initialsFrom(user.username)}
              </div>
              {editingUsername ? (
                <div className="w-full">
                  <input value={usernameDraft} onChange={(e) => setUsernameDraft(e.target.value)} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-center text-[15px] font-semibold dark:border-border-dark dark:bg-bg-dark" />
                  <div className="mt-2.5 flex justify-center gap-2">
                    <button onClick={saveUsername} disabled={savingUsername} className="rounded-lg bg-violet-dark px-4 py-1.5 text-[12px] font-semibold text-white">{savingUsername ? "Saving…" : "Save"}</button>
                    <button onClick={() => setEditingUsername(false)} className="rounded-lg border border-border px-4 py-1.5 text-[12px]">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[17px] font-semibold">{user.username}</div>
                  <button onClick={() => { setUsernameDraft(user.username); setEditingUsername(true); }} className="mt-1 text-[12px] text-violet-bright">Edit username</button>
                </>
              )}
              <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-bordersoft pt-4 dark:border-bordersoft-dark">
                <div className="text-center">
                  <div className="font-display text-lg font-bold">{chain.habits.filter((h) => h.active).length}</div>
                  <div className="text-[10px] text-faint">Active habits</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-lg font-bold">{chain.points}</div>
                  <div className="text-[10px] text-faint">On-chain pts</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-lg font-bold">{chain.friends.length}</div>
                  <div className="text-[10px] text-faint">Friends</div>
                </div>
              </div>
            </div>
          </Panel>
          <Panel>
            <PanelHead title="Session" />
            <button onClick={fullLogout} className="w-full rounded-lg border border-coral/30 bg-coral/10 py-2.5 text-[13px] font-semibold text-coral">
              Log out and disconnect wallet
            </button>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel>
            <PanelHead title="Contact" sub="Account login details" />
            <div className="text-sm">Email: {user.email || "Not linked"}</div>
            <div className="mt-2 text-sm">Phone: {user.phone || "Not linked"}</div>
          </Panel>

          <Panel>
            <PanelHead title="Wallet" sub={liveAddress ? "Connected on this device" : "Link MetaMask or Trust"} />
            {liveAddress ? (
              <div className="rounded-lg border border-mint/25 bg-mint/5 px-4 py-3.5">
                <div className="font-mono text-[13px] font-medium">{shortWallet(liveAddress)}</div>
                <div className="mt-1 break-all font-mono text-[11px] text-faint">{liveAddress}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip tone="mint">Connected</Chip>
                  <button onClick={copyWallet} className="rounded-lg border border-border px-3 py-1.5 text-[12px]">{copied ? "Copied" : "Copy"}</button>
                  <button onClick={disconnectWalletOnly} className="rounded-lg border border-coral/30 px-3 py-1.5 text-[12px] text-coral">Disconnect</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button disabled={walletBusy} onClick={() => connectWallet("metamask")} className="rounded-xl bg-gradient-to-br from-violet-bright to-violet-deep py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {walletBusy ? "Waiting for wallet…" : "Connect MetaMask"}
                </button>
                <button disabled={walletBusy} onClick={() => connectWallet("trust")} className="rounded-xl border border-border py-3 text-sm font-semibold dark:border-border-dark">
                  Connect Trust Wallet
                </button>
                <button disabled={walletBusy} onClick={() => connectWallet("walletconnect")} className="rounded-xl border border-border py-3 text-sm font-semibold dark:border-border-dark">
                  WalletConnect
                </button>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
