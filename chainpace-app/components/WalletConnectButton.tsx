"use client";

import { useState } from "react";
import WalletPicker from "@/components/WalletPicker";
import { useWeb3 } from "@/lib/useWeb3";
import { shortAddr } from "@/lib/contract";

export default function WalletConnectButton() {
  const web3 = useWeb3();
  const [open, setOpen] = useState(false);

  const pick = async (id: string) => {
    setOpen(false);
    const eth = (window as any).ethereum;
    if (!eth) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    try {
      if (id === "coinbase" && eth.providers) {
        const cb = eth.providers.find((p: any) => p.isCoinbaseWallet);
        if (cb) await cb.request({ method: "eth_requestAccounts" });
      }
      await eth.request({ method: "eth_requestAccounts" });
      if (typeof web3.connect === "function") await web3.connect();
    } catch {
      /* user rejected */
    }
  };

  if (web3.isConnected && web3.address) {
    return (
      <button type="button" onClick={() => web3.disconnect?.()} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold dark:border-border-dark">
        {shortAddr(web3.address)}
      </button>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-violet-dark px-3 py-1.5 text-xs font-semibold text-white">
        Connect wallet
      </button>
      <WalletPicker open={open} onClose={() => setOpen(false)} onPick={pick} />
    </>
  );
}
