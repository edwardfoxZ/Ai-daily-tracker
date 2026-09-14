"use client";

import { useEffect, useState } from "react";
import { addSeiTestnet, connectWallet, getActiveChainId, SEI_TESTNET } from "@/lib/connectWallets";
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
  const [chainId, setChainId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const refreshChain = async () => setChainId(await getActiveChainId());

  useEffect(() => {
    refreshChain();
  }, [address]);

  const connect = async () => {
    setError(null);
    setBusy(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      await onConnected(addr);
      await refreshChain();
    } catch (e: any) {
      setError(friendlyWalletError(e));
    } finally {
      setBusy(false);
    }
  };

  const addNetwork = async () => {
    setError(null);
    setAdding(true);
    try {
      await addSeiTestnet();
      await refreshChain();
    } catch (e: any) {
      setError(friendlyWalletError(e));
    } finally {
      setAdding(false);
    }
  };

  const needSei = !!address && chainId !== null && chainId !== SEI_TESTNET.chainId;

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-[13px] text-coral">{error}</div>
      )}
      <button
        type="button"
        onClick={connect}
        disabled={disabled || busy}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-violet-bright to-violet-deep py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="2" y="6" width="20" height="13" rx="3" stroke="white" strokeWidth="1.7" />
          <path d="M2 10h20" stroke="white" strokeWidth="1.7" />
          <circle cx="17" cy="14.5" r="1.2" fill="white" />
        </svg>
        {busy ? "Check MetaMask…" : address ? "Wallet connected" : "Connect wallet"}
      </button>
      {needSei && (
        <button
          type="button"
          onClick={addNetwork}
          disabled={adding}
          className="mt-2.5 w-full rounded-xl border border-gold/40 bg-gold/10 py-3 text-sm font-semibold text-gold"
        >
          {adding ? "Adding Sei Testnet…" : "Add Sei Testnet to MetaMask"}
        </button>
      )}
    </div>
  );
}
