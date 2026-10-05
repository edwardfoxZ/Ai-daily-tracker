"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import NewHabitModal from "@/components/NewHabitModal";
import { useWeb3 } from "@/lib/useWeb3";
import { CHAINPACE_ADDRESS, EXPECTED_CHAIN_ID } from "@/lib/contract";

export default function NewHabitButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const web3 = useWeb3();

  useEffect(() => setMounted(true), []);

  const ready =
    web3.isConnected && !!web3.address && !!CHAINPACE_ADDRESS && web3.chain?.kind === "evm";
  const wrongNetwork =
    ready && typeof web3.chain?.id === "number" && web3.chain.id !== EXPECTED_CHAIN_ID;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={wrongNetwork ? `Switch to chain ${EXPECTED_CHAIN_ID}` : "Create a habit"}
        className={
          className ||
          "flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-bright to-violet-deep px-3 py-2.5 text-[13px] font-semibold text-white"
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New habit
      </button>
      {mounted &&
        createPortal(
          <NewHabitModal
            open={open}
            onClose={() => setOpen(false)}
            onCreated={() => {
              window.dispatchEvent(new Event("chainpace:habits-changed"));
              setOpen(false);
              router.push("/habits");
            }}
          />,
          document.body,
        )}
    </>
  );
}
