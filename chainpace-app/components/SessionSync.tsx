"use client";

import { useEffect, useRef } from "react";
import { useWeb3 } from "@/lib/useWeb3";
import { useUser } from "@/lib/user-context";

/**
 * Mounted once, globally, inside the providers tree.
 * Watches the connected wallet address and forces a backend logout
 * whenever the wallet disconnects, or switches to a different account
 * than the one the current session is tied to.
 */
export default function SessionSync() {
  const { address } = useWeb3();
  const { user, logout } = useUser();
  const prevAddress = useRef<string | null>(null);

  useEffect(() => {
    const hadAddress = prevAddress.current;
    prevAddress.current = address;

    if (!user?.walletAddress) return; // only applies to wallet-based sessions

    // wallet was connected, now isn't -> force logout
    if (hadAddress && !address) {
      logout();
      return;
    }

    // wallet switched to a different account than the logged-in one -> force logout
    if (address && address.toLowerCase() !== user.walletAddress.toLowerCase()) {
      logout();
    }
  }, [address, user, logout]);

  return null;
}