"use client";

import { usePathname } from "next/navigation";
import GoogleSignIn from "@/components/GoogleSignIn";

export default function LoginGoogleSlot() {
  const path = usePathname();
  if (path !== "/login") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[70] flex justify-center px-4">
      <div className="pointer-events-auto w-[min(24rem,calc(100%-2rem))] rounded-3xl border border-border bg-surface/95 p-4 shadow-xl backdrop-blur dark:border-border-dark dark:bg-surface-dark/95">
        <div className="mb-3 text-center font-display text-lg font-semibold">Sign in</div>
        <GoogleSignIn />
        <p className="mt-3 text-center text-[11px] text-faint">Or use email below. Wallet-only users can connect from the navbar after this page.</p>
      </div>
    </div>
  );
}
