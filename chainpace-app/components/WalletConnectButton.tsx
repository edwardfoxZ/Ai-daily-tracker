"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/connectWallets";
import { friendlyWalletError } from "@/lib/walletSession";

export default function WalletConnectButton({
  onConnected,
  disabled,
}: {
  onConnected: (address: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const connect = async () => {
    setError(null);
    setHint("Opening MetaMask…");
    setBusy(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      setHint(null);
      await onConnected(addr);
    } catch (e: any) {
      setHint(null);
      setError(friendlyWalletError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-[13px] text-coral">{error}</div>
      )}
      {hint && !error && (
        <div className="mb-3 rounded-xl border border-border px-3 py-2 text-[13px] text-dim dark:border-border-dark">{hint}</div>
      )}

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Wallets</p>
      <button
        type="button"
        onClick={connect}
        disabled={disabled || busy}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left transition hover:border-violet-dark dark:border-border-dark dark:bg-surface-dark disabled:opacity-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E2761B]">
          <svg width="26" height="26" viewBox="0 0 35 33" fill="none" aria-hidden>
            <path d="M32.96 1L19.74 10.79l2.45-5.74L32.96 1z" fill="#E2761B" stroke="#E2761B" strokeLinejoin="round" />
            <path d="M2.04 1l13.1 9.88-2.33-5.83L2.04 1zM28.23 23.53l-3.5 5.36 7.5 2.06 2.15-7.3-6.15-.12zM.64 23.64l2.14 7.3 7.49-2.06-3.5-5.36-6.13.12z" fill="#E4761B" stroke="#E4761B" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">MetaMask</span>
          <span className="block text-[12px] text-faint">
            {busy ? "Approve the MetaMask popup" : address ? "Connected" : "Connect — Sei Testnet popup if needed"}
          </span>
        </span>
        <span className="text-[12px] font-semibold text-violet-bright">{busy ? "…" : "Connect"}</span>
      </button>
    </div>
  );
}
