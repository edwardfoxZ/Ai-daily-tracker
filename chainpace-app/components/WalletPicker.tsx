"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = { open: boolean; onClose: () => void; onPick: (id: string) => void };

const WALLETS = [
  { id: "metamask", name: "MetaMask", hint: "Browser extension", color: "#f6851b", mark: "M" },
  { id: "coinbase", name: "Coinbase Wallet", hint: "Extension", color: "#0052ff", mark: "C" },
  { id: "injected", name: "Browser wallet", hint: "Brave, Rabby, OKX", color: "#7c5cfc", mark: "W" },
  { id: "phantom", name: "Phantom", hint: "Solana", color: "#ab9ff2", mark: "P" },
];

export default function WalletPicker({ open, onClose, onPick }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl dark:border-border-dark dark:bg-surface-dark" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Connect a wallet</h3>
          <button type="button" onClick={onClose} className="text-faint">✕</button>
        </div>
        <div className="space-y-2">
          {WALLETS.map((w) => (
            <button key={w.id} type="button" onClick={() => onPick(w.id)} className="flex w-full items-center gap-3 rounded-2xl border border-border px-3 py-3 text-left transition active:scale-[0.98] hover:border-violet-dark dark:border-border-dark">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: w.color }}>{w.mark}</span>
              <span>
                <span className="block text-sm font-semibold">{w.name}</span>
                <span className="text-[11px] text-faint">{w.hint}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-faint">Wallet-only login creates an account. Google users get the wallet linked to the same account.</p>
      </div>
    </div>,
    document.body,
  );
}
