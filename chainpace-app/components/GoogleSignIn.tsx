"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleSignIn() {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) return;
    const id = "google-gsi";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = render;
      document.body.appendChild(s);
    } else {
      render();
    }
    function render() {
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
          if (res.ok) router.push("/dashboard");
        },
      });
      const el = document.getElementById("google-btn");
      if (el) window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", text: "continue_with", width: 280 });
    }
  }, [clientId, router]);

  if (!clientId) {
    return (
      <p className="text-[12px] text-faint">
        Google sign-in needs NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.
      </p>
    );
  }
  return <div id="google-btn" className="flex justify-center" />;
}
