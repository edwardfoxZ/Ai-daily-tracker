"use client";

import { usePathname } from "next/navigation";
import GoogleSignIn from "@/components/GoogleSignIn";

export default function LoginGoogleSlot() {
  const path = usePathname();
  if (path !== "/login") return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-[70] w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-border bg-surface p-4 shadow-lg dark:border-border-dark dark:bg-surface-dark">
      <div className="mb-2 text-sm font-semibold">Continue with Google</div>
      <GoogleSignIn />
    </div>
  );
}
