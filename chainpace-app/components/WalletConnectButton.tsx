"use client";

import { useState } from "react";
import WalletPicker from "@/components/WalletPicker";
import { useWeb3, type WalletId } from "@/lib/useWeb3";
import { useUser } from "@/lib/user-context";
import { linkWallet, walletAuth } from "@/lib/api";
import { shortAddr } from "@/lib/contract";

export default function WalletConnectButton() {
  const web3 = useWeb3();
  const { user, refresh } = useUser();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (id: WalletId) => {
    setOpen(false);
    setErr(null);
    try {
      await web3.connect(id);
      await web3.switchChain("seiTestnet").catch(() => {});
      const addr = (window as any).__chainpaceAddr as string | undefined;
      const address = addr || web3.address;
      const accounts = await window.ethereum?.request?.({ method: "eth_accounts" });
      const walletAddress = accounts?.[0] || address;
      if (!walletAddress) {
        setErr("Wallet connected but no address returned.");
        return;
      }
      if (user) {
        await linkWallet(walletAddress).catch(() => {});
        await refresh?.();
      } else {
        await walletAuth({ walletAddress }).catch(() => {});
        await refresh?.();
      }
    } catch (e: any) {
      setErr(e?.message || "Could not connect wallet");
    }
  };

  if (web3.isConnected && web3.address) {
    return (
      <button type="button" onClick={() => web3.disconnect()} className="rounded-full border border-border px-3 py-1.5 font-mono text-xs font-semibold dark:border-border-dark" title="Disconnect">
        {shortAddr(web3.address)}
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-violet-dark px-3 py-1.5 text-xs font-semibold text-white active:scale-95">
        {web3.isConnecting ? "Connecting…" : "Connect wallet"}
      </button>
      {err && <span className="sr-only">{err}</span>}
      <WalletPicker open={open} onClose={() => setOpen(false)} onPick={(id) => pick(id as WalletId)} />
    </>
  );
}
