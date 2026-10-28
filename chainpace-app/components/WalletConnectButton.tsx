"use client";

import { useState } from "react";
import WalletPicker from "@/components/WalletPicker";
import { useWeb3, type WalletId } from "@/lib/useWeb3";
import { useUser } from "@/lib/user-context";
import { linkWallet, walletAuth } from "@/lib/api";
import { shortAddr } from "@/lib/contract";

type Props = {
  onConnected?: (address: string) => void | Promise<void>;
  className?: string;
};

export default function WalletConnectButton({ onConnected, className }: Props) {
  const web3 = useWeb3();
  const { user, refetch } = useUser();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (id: WalletId) => {
    setOpen(false);
    setErr(null);
    try {
      await web3.connect(id);
      await web3.switchChain("seiTestnet").catch(() => {});
      const accounts = await window.ethereum?.request?.({ method: "eth_accounts" });
      const walletAddress = accounts?.[0] || web3.address;
      if (!walletAddress) {
        setErr("Wallet connected but no address returned.");
        return;
      }
      if (onConnected) {
        await onConnected(walletAddress);
        return;
      }
      if (user) {
        await linkWallet(walletAddress).catch(() => {});
      } else {
        await walletAuth({ walletAddress }).catch(() => {});
      }
      await refetch();
    } catch (e: any) {
      setErr(e?.message || "Could not connect wallet");
    }
  };

  if (web3.isConnected && web3.address && !onConnected) {
    return (
      <button type="button" onClick={() => web3.disconnect()} className="rounded-full border border-border px-3 py-1.5 font-mono text-xs font-semibold dark:border-border-dark" title="Disconnect">
        {shortAddr(web3.address)}
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className || "w-full rounded-xl bg-violet-dark px-3 py-3 text-sm font-semibold text-white active:scale-[0.98]"}>
        {web3.isConnecting ? "Connecting…" : "Connect wallet"}
      </button>
      {err && <p className="mt-2 text-center text-[12px] text-coral">{err}</p>}
      <WalletPicker open={open} onClose={() => setOpen(false)} onPick={(id) => pick(id as WalletId)} />
    </>
  );
}
