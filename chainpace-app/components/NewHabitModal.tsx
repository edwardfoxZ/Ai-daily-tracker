// components/NewHabitModal.tsx
"use client";

import { useState } from "react";
import { useContract } from "@/lib/useContract";

export default function NewHabitModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { createHabit } = useContract();
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createHabit(title.trim(), cadence);
      setTitle("");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.reason || err?.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
        <h3 className="mb-1 font-display text-lg font-semibold">New habit</h3>
        <p className="mb-4 text-[12.5px] text-faint dark:text-faint-dark">
          This writes to the blockchain — confirm the transaction in your
          wallet.
        </p>

        {error && (
          <div className="mb-3 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-[12px] text-coral">
            {error}
          </div>
        )}

        <label className="mb-1.5 block text-[12.5px] font-semibold text-dim dark:text-dim-dark">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Cold shower — 3 min"
          className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-violet-dark dark:border-border-dark dark:bg-bg-dark"
        />

        <label className="mb-1.5 block text-[12.5px] font-semibold text-dim dark:text-dim-dark">
          Cadence (days)
        </label>
        <input
          type="number"
          min={1}
          value={cadence}
          onChange={(e) => setCadence(Number(e.target.value))}
          className="mb-5 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-violet-dark dark:border-border-dark dark:bg-bg-dark"
        />

        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={loading || !title.trim()}
            className="flex-1 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep py-2.5 text-[13px] font-semibold text-white shadow-glow disabled:opacity-50"
          >
            {loading ? "Confirm in wallet…" : "Create on-chain"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-semibold text-dim dark:border-border-dark dark:text-dim-dark"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
