"use client";

import { useEffect, useState } from "react";

const KEY = "chainpace_cookie_ok";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[80] mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:items-center">
      <p className="text-[13px] leading-relaxed text-dim">
        Chainpace uses a session cookie to keep you signed in, plus local storage for theme and notification state. No ad tracking.
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(KEY, "1");
          document.cookie = "chainpace_cookie=1; Path=/; Max-Age=31536000; SameSite=Lax";
          setShow(false);
        }}
        className="shrink-0 rounded-full bg-violet-dark px-4 py-2 text-sm font-semibold text-white"
      >
        Accept
      </button>
    </div>
  );
}
