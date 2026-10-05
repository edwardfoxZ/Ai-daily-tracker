"use client";

import GoogleSignIn from "@/components/GoogleSignIn";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="font-display text-3xl font-semibold">Sign in</h1>
      <p className="text-sm text-faint">Continue with Google, or use email on the existing form after you set the client id.</p>
      <GoogleSignIn />
      <a href="/dashboard" className="text-sm text-violet-bright">Back to app</a>
    </main>
  );
}
