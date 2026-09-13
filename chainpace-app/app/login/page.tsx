"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useWeb3 } from "@/lib/useWeb3";
import { useUser } from "@/lib/user-context";
import {
  walletAuth,
  requestOtp,
  verifyOtp,
  login as passwordLogin,
  ApiError,
} from "@/lib/api";
import { hasInjectedWallet, isMobileBrowser, openInMetaMaskApp } from "@/lib/walletMobile";

type Step = "home" | "otp" | "otp-code" | "otp-username" | "password" | "wallet-name";

export default function LoginPage() {
  const router = useRouter();
  const web3 = useWeb3();
  const { refetch } = useUser();
  const [step, setStep] = useState<Step>("home");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = async () => {
    await refetch();
    router.push("/dashboard");
  };

  const goWallet = async () => {
    setError(null);
    if (!hasInjectedWallet()) {
      if (isMobileBrowser()) {
        openInMetaMaskApp();
        setError("Opening MetaMask. When this page reloads inside the app, tap Connect wallet again.");
        return;
      }
      setError("Install MetaMask (desktop extension) or open this site in the MetaMask app.");
      return;
    }
    setLoading(true);
    try {
      await web3.connect("injected");
      const addr = web3.address;
      // connect() sets state async — read from window
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      const walletAddress = accounts?.[0] || addr;
      if (!walletAddress) throw new Error("No wallet address");
      const res = await walletAuth({ walletAddress });
      if (res.requiresUsername || res.isNew && !res.user) {
        setStep("wallet-name");
        return;
      }
      await done();
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || "Wallet connect failed");
    } finally {
      setLoading(false);
    }
  };

  const submitWalletName = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
      await walletAuth({ walletAddress: accounts[0], username: username.trim() });
      await done();
    } catch (e: any) {
      setError(e?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestOtp(email.trim());
      setDevCode(res.devCode || null);
      setStep("otp-code");
    } catch (e: any) {
      setError(e?.message || "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  const checkCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyOtp({ email: email.trim(), code: code.trim() });
      if (res.requiresUsername) {
        setStep("otp-username");
        return;
      }
      await done();
    } catch (e: any) {
      setError(e?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const finishNew = async () => {
    setLoading(true);
    setError(null);
    try {
      await verifyOtp({ email: email.trim(), code: code.trim(), username: username.trim() });
      await done();
    } catch (e: any) {
      setError(e?.message || "Could not finish signup");
    } finally {
      setLoading(false);
    }
  };

  const doPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      await passwordLogin({ identifier: identifier.trim(), password });
      await done();
    } catch (e: any) {
      setError(e?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-lg font-bold">Chainpace</span>
        <ThemeToggle />
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-12">
        {error && (
          <div className="mb-4 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-[13px] text-coral">{error}</div>
        )}

        {step === "home" && (
          <>
            <h1 className="font-display text-[28px] font-semibold">Sign in</h1>
            <p className="mb-6 mt-2 text-[14px] text-dim">Wallet on desktop or inside the MetaMask app. Email works on any phone.</p>
            <button onClick={goWallet} disabled={loading} className="mb-2.5 w-full rounded-xl bg-gradient-to-br from-violet-bright to-violet-deep py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50">
              {loading ? "Connecting…" : isMobileBrowser() && !hasInjectedWallet() ? "Open in MetaMask" : "Connect wallet"}
            </button>
            <button onClick={() => setStep("otp")} className="mb-2.5 w-full rounded-xl border border-border bg-surface py-3.5 text-sm font-semibold dark:border-border-dark dark:bg-surface-dark">
              Email one-time code
            </button>
            <button onClick={() => setStep("password")} className="w-full text-center text-[13px] text-faint underline">
              Use password instead
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <button onClick={() => setStep("home")} className="mb-4 text-left text-sm text-faint">← Back</button>
            <h1 className="mb-4 font-display text-[24px] font-semibold">Email code</h1>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" className="mb-3 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm dark:border-border-dark dark:bg-surface-dark" />
            <button onClick={sendCode} disabled={loading || !email.includes("@")} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Sending…" : "Send code"}
            </button>
          </>
        )}

        {step === "otp-code" && (
          <>
            <button onClick={() => setStep("otp")} className="mb-4 text-left text-sm text-faint">← Back</button>
            <h1 className="mb-2 font-display text-[24px] font-semibold">Enter code</h1>
            <p className="mb-4 text-sm text-dim">Sent to {email}</p>
            {devCode && <p className="mb-3 text-xs text-gold">Dev mode code: {devCode}</p>}
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" className="mb-3 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-center font-mono text-lg tracking-[0.3em] dark:border-border-dark dark:bg-surface-dark" />
            <button onClick={checkCode} disabled={loading || code.length < 4} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Checking…" : "Verify"}
            </button>
          </>
        )}

        {step === "otp-username" && (
          <>
            <h1 className="mb-4 font-display text-[24px] font-semibold">Pick a username</h1>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="mb-3 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm dark:border-border-dark dark:bg-surface-dark" />
            <button onClick={finishNew} disabled={loading || username.trim().length < 3} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">
              Create account
            </button>
          </>
        )}

        {step === "wallet-name" && (
          <>
            <h1 className="mb-4 font-display text-[24px] font-semibold">Pick a username</h1>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="mb-3 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm dark:border-border-dark dark:bg-surface-dark" />
            <button onClick={submitWalletName} disabled={loading || username.trim().length < 3} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">
              Continue
            </button>
          </>
        )}

        {step === "password" && (
          <>
            <button onClick={() => setStep("home")} className="mb-4 text-left text-sm text-faint">← Back</button>
            <h1 className="mb-4 font-display text-[24px] font-semibold">Password</h1>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="email or username" className="mb-2 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm dark:border-border-dark dark:bg-surface-dark" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" className="mb-3 w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm dark:border-border-dark dark:bg-surface-dark" />
            <button onClick={doPassword} disabled={loading} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
