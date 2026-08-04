"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PageHeader, Panel, PanelHead, Avatar, Chip } from "@/components/ui";
import { useUser } from "@/lib/user-context";
import { useWeb3 } from "@/lib/useWeb3";

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
  const { user, loading, logout } = useUser();
  const web3 = useWeb3();

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(user?.username ?? "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [copied, setCopied] = useState(false);

  const startEdit = () => {
    setUsernameDraft(user?.username ?? "");
    setEditingUsername(true);
  };

  const saveUsername = async () => {
    // TODO: wire to PATCH /api/auth/profile once that endpoint exists.
    // Kept as a local-only save for now so the UI is fully usable today.
    setSavingUsername(true);
    await new Promise((r) => setTimeout(r, 500));
    setSavingUsername(false);
    setEditingUsername(false);
  };

  const copyWallet = async () => {
    if (!user?.walletAddress) return;
    await navigator.clipboard.writeText(user.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const connectWallet = async () => {
    try {
      await web3.connect("metamask");
      // TODO: once connected, call your walletAuth/attach-wallet endpoint
      // to link web3.address to this existing account.
    } catch (err: any) {
      alert(err?.message || "Failed to connect wallet");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-sm text-faint dark:text-faint-dark">
            Loading profile…
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
        <Sidebar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="text-sm text-faint dark:text-faint-dark">
            You&apos;re not signed in.
          </div>
          <a
            href="/login"
            className="rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-5 py-2.5 text-[13px] font-semibold text-white shadow-glow"
          >
            Go to sign in
          </a>
        </main>
      </div>
    );
  }

  const initials = initialsFrom(user.username);

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 px-8 pb-16 pt-6">
        <PageHeader
          title="Profile"
          subtitle="Manage your identity, wallet, and account settings"
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
          {/* LEFT: identity card */}
          <div className="flex flex-col gap-5">
            <Panel>
              <div className="flex flex-col items-center text-center">
                <div
                  className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl font-display text-2xl font-bold text-white shadow-glow-strong"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 35% 30%, #B98CF0, #6D2FC7 70%)",
                  }}
                >
                  {initials}
                </div>

                {editingUsername ? (
                  <div className="w-full">
                    <input
                      value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)}
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-center text-[15px] font-semibold outline-none focus:border-violet-dark dark:border-border-dark dark:bg-bg-dark"
                      autoFocus
                    />
                    <div className="mt-2.5 flex justify-center gap-2">
                      <button
                        onClick={saveUsername}
                        disabled={savingUsername || !usernameDraft.trim()}
                        className="rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-4 py-1.5 text-[12px] font-semibold text-white shadow-glow disabled:opacity-50"
                      >
                        {savingUsername ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingUsername(false)}
                        className="rounded-lg border border-border px-4 py-1.5 text-[12px] font-semibold text-dim dark:border-border-dark dark:text-dim-dark"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="text-[17px] font-semibold">
                        {user.username}
                      </div>
                      <button
                        onClick={startEdit}
                        className="rounded-md p-1 text-faint hover:bg-surface2 hover:text-ink dark:text-faint-dark dark:hover:bg-surface2-dark dark:hover:text-ink-dark"
                        title="Edit username"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-3.5 w-3.5"
                        >
                          <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1">
                      <Chip tone="mint">Active member</Chip>
                    </div>
                  </>
                )}

                <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-bordersoft pt-4 dark:border-bordersoft-dark">
                  <div className="text-center">
                    <div className="font-display text-lg font-bold">14</div>
                    <div className="text-[10px] text-faint dark:text-faint-dark">
                      Streak
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-lg font-bold">92</div>
                    <div className="text-[10px] text-faint dark:text-faint-dark">
                      Proof score
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-lg font-bold">#2</div>
                    <div className="text-[10px] text-faint dark:text-faint-dark">
                      Circle rank
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHead title="Danger zone" />
              <button
                onClick={() => {
                  web3.disconnect();
                  logout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-coral/30 bg-coral/10 py-2.5 text-[13px] font-semibold text-coral hover:bg-coral/15"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Log out
              </button>
            </Panel>
          </div>

          {/* RIGHT: account details */}
          <div className="flex flex-col gap-5">
            <Panel>
              <PanelHead
                title="Contact details"
                sub="Used for sign-in and notifications"
              />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 dark:border-border-dark">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-bordersoft bg-surface2 dark:border-bordersoft-dark dark:bg-surface2-dark">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M3 6h18v12H3z" />
                        <path d="M3 7l9 6 9-6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[11px] text-faint dark:text-faint-dark">
                        Email
                      </div>
                      <div className="text-[13px] font-medium">
                        {user.email || "Not linked"}
                      </div>
                    </div>
                  </div>
                  <button className="text-[12px] font-semibold text-violet-bright hover:underline">
                    {user.email ? "Change" : "Add"}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 dark:border-border-dark">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-bordersoft bg-surface2 dark:border-bordersoft-dark dark:bg-surface2-dark">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <rect x="6" y="2" width="12" height="20" rx="2" />
                        <path d="M11 18h2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[11px] text-faint dark:text-faint-dark">
                        Phone
                      </div>
                      <div className="text-[13px] font-medium">
                        {user.phone || "Not linked"}
                      </div>
                    </div>
                  </div>
                  <button className="text-[12px] font-semibold text-violet-bright hover:underline">
                    {user.phone ? "Change" : "Add"}
                  </button>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHead
                title="Wallet"
                sub={
                  user.walletAddress
                    ? "Verified on-chain identity"
                    : "Connect a wallet to unlock full features"
                }
              />
              {user.walletAddress ? (
                <div className="flex items-center justify-between rounded-lg border border-mint/25 bg-mint/5 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-glow"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg,#B98CF0,#6D2FC7)",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="1.6"
                      >
                        <rect x="2" y="6" width="20" height="13" rx="3" />
                        <path d="M2 10h20" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-mono text-[13px] font-medium">
                        {shortWallet(user.walletAddress)}
                      </div>
                      <div className="mt-0.5">
                        <Chip tone="mint">✓ Verified</Chip>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyWallet}
                      className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-semibold text-dim hover:border-violet-dark hover:text-ink dark:border-border-dark dark:text-dim-dark dark:hover:text-ink-dark"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => web3.disconnect()}
                      className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-1.5 text-[12px] font-semibold text-coral hover:bg-coral/15"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-br from-violet-bright to-violet-deep p-3.5 text-left text-white shadow-glow hover:shadow-glow-strong"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-white/15">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="2"
                        y="6"
                        width="20"
                        height="13"
                        rx="3"
                        stroke="#fff"
                        strokeWidth="1.6"
                      />
                      <path d="M2 10h20" stroke="#fff" strokeWidth="1.6" />
                    </svg>
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">
                      Connect wallet
                    </span>
                    <small className="block text-[11.5px] font-normal text-white/75">
                      Unlock on-chain proof, circles, and leaderboards
                    </small>
                  </span>
                </button>
              )}
            </Panel>

            <Panel>
              <PanelHead title="Preferences" />
              <div className="flex items-center justify-between border-b border-bordersoft py-3 dark:border-bordersoft-dark">
                <div>
                  <div className="text-[13px] font-medium">
                    Email notifications
                  </div>
                  <div className="text-[11px] text-faint dark:text-faint-dark">
                    Streak reminders, mentor messages
                  </div>
                </div>
                <ToggleSwitch defaultOn />
              </div>
              <div className="flex items-center justify-between border-b border-bordersoft py-3 dark:border-bordersoft-dark">
                <div>
                  <div className="text-[13px] font-medium">
                    Public leaderboard visibility
                  </div>
                  <div className="text-[11px] text-faint dark:text-faint-dark">
                    Let friends see your rank
                  </div>
                </div>
                <ToggleSwitch defaultOn />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[13px] font-medium">
                    AI mentor suggestions
                  </div>
                  <div className="text-[11px] text-faint dark:text-faint-dark">
                    Research-backed tips in Messages
                  </div>
                </div>
                <ToggleSwitch defaultOn />
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToggleSwitch({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-violet-dark" : "bg-surface2 dark:bg-surface2-dark"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
