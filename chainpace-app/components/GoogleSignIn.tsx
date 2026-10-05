"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleSignIn() {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const [pressed, setPressed] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    const start = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential?: string }) => {
          if (!resp.credential) return;
          const res = await fetch("/api/auth/google", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: resp.credential }),
          });
          if (!res.ok) {
            setErr("Google sign-in failed");
            return;
          }
          router.push("/dashboard");
          router.refresh();
        },
      });
    };
    if (window.google?.accounts?.id) start();
    else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = start;
      document.body.appendChild(s);
    }
  }, [clientId, router]);

  const click = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 180);
    if (!clientId) {
      setErr("Set NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }
    window.google?.accounts?.id?.prompt();
  };

  return (
    <div>
      <button
        type="button"
        onClick={click}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition active:scale-[0.97] dark:border-border-dark ${
          pressed ? "scale-[0.97]" : ""
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7.1l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
        </svg>
        Continue with Google
      </button>
      {err && <p className="mt-2 text-center text-[12px] text-coral">{err}</p>}
    </div>
  );
}
