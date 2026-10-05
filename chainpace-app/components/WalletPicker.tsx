"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = { open: boolean; onClose: () => void; onPick: (id: string) => void };

const WALLETS = [
  { id: "metamask", name: "MetaMask", hint: "Browser extension" },
  { id: "coinbase", name: "Coinbase Wallet", hint: "Extension or mobile" },
  { id: "injected", name: "Browser wallet", hint: "Any injected EVM wallet" },
];

export default function WalletPicker({ open, onClose, onPick }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl dark:border-border-dark dark:bg-surface-dark" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Connect a wallet</h3>
          <button type="button" onClick={onClose} className="text-faint">✕</button>
        </div>
        <p className="mb-4 text-[12.5px] text-faint">Pick a wallet. This is the RainbowKit-style picker — no private key leaves the extension.</p>
        <div className="space-y-2">
          {WALLETS.map((w) => (
            <button key={w.id} type="button" onClick={() => onPick(w.id)} className="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-left hover:border-violet-dark dark:border-border-dark">
              <span>
                <span className="block text-sm font-semibold">{w.name}</span>
                <span className="text-[11px] text-faint">{w.hint}</span>
              </span>
              <span className="text-xs text-violet-bright">Connect</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
