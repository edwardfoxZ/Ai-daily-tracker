"use client";

import { useState } from "react";
import WalletPicker from "@/components/WalletPicker";
import { useWeb3, type WalletId } from "@/lib/useWeb3";
import { useUser } from "@/lib/user-context";
import { linkWallet, walletAuth } from "@/lib/api";
import { shortAddr } from "@/lib/contract";
import { startWalletConnect, walletDeepLinks } from "@/lib/mobileWallet";

type Props = {
  onConnected?: (address: string) => void | Promise<void>;
  className?: string;
};

export default function WalletConnectButton({ onConnected, className }: Props) {
  const web3 = useWeb3();
  const { user, refetch } = useUser();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const finish = async (walletAddress: string) => {
    if (onConnected) {
      await onConnected(walletAddress);
      return;
    }
    if (user) await linkWallet(walletAddress).catch(() => {});
    else await walletAuth({ walletAddress }).catch(() => {});
    await refetch();
  };

  const pick = async (id: string) => {
    setOpen(false);
    setErr(null);
    try {
      if (id === "walletconnect") {
        setWaiting(true);
        const session = await startWalletConnect();
        setWcUri(session.uri);
        const address = await session.addressPromise;
        setWcUri(null);
        setWaiting(false);
        await finish(address);
        return;
      }
      await web3.connect(id as WalletId);
      await web3.switchChain("seiTestnet").catch(() => {});
      const accounts = await window.ethereum?.request?.({ method: "eth_accounts" });
      const walletAddress = accounts?.[0] || web3.address;
      if (!walletAddress) {
        setErr("No address from the wallet.");
        return;
      }
      await finish(walletAddress);
    } catch (e: any) {
      setWaiting(false);
      setWcUri(null);
      setErr(e?.message || "Could not connect wallet");
    }
  };

  if (web3.isConnected && web3.address && !onConnected) {
    return (
      <button type="button" onClick={() => web3.disconnect()} className="rounded-full border border-border px-3 py-1.5 font-mono text-xs font-semibold dark:border-border-dark">
        {shortAddr(web3.address)}
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className || "w-full rounded-xl bg-violet-dark px-3 py-3 text-sm font-semibold text-white active:scale-[0.98]"}>
        {waiting ? "Waiting for wallet…" : "Connect wallet"}
      </button>
      {err && <p className="mt-2 text-center text-[12px] text-coral">{err}</p>}
      <WalletPicker open={open} onClose={() => setOpen(false)} onPick={pick} />
      {wcUri && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 text-center dark:border-border-dark dark:bg-surface-dark">
            <h3 className="font-display text-lg font-semibold">Open your wallet</h3>
            <p className="mt-1 text-[12.5px] text-faint">Scan or tap. Sign “Chainpace login” in the wallet, then come back here.</p>
            <img alt="WalletConnect QR" className="mx-auto my-4 h-44 w-44 rounded-xl bg-white p-2" src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(wcUri)}`} />
            <div className="space-y-2">
              {walletDeepLinks(wcUri).map((link) => (
                <a key={link.name} href={link.href} className="block rounded-xl border border-border py-2 text-sm font-semibold dark:border-border-dark">{link.name}</a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
