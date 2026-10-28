"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import ThemeToggle from "@/components/ThemeToggle";
import WalletConnectButton from "@/components/WalletConnectButton";
import GoogleSignIn from "@/components/GoogleSignIn";
import { useUser } from "@/lib/user-context";
import { walletAuth, requestOtp, verifyOtp, login as passwordLogin, ApiError } from "@/lib/api";

type Step = "home" | "otp" | "otp-code" | "otp-username" | "password" | "wallet-name";

type PasswordForm = { identifier: string; password: string };
type EmailForm = { email: string };
type CodeForm = { code: string };
type NameForm = { username: string };

export default function LoginPage() {
  const router = useRouter();
  const { refetch } = useUser();
  const [step, setStep] = useState<Step>("home");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [walletAddr, setWalletAddr] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [mailHint, setMailHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordForm = useForm<PasswordForm>();
  const emailForm = useForm<EmailForm>();
  const codeForm = useForm<CodeForm>();
  const nameForm = useForm<NameForm>();

  const done = async () => {
    await refetch();
    router.push("/dashboard");
  };

  const afterWallet = async (addr: string) => {
    setWalletAddr(addr);
    setBusy(true);
    setError(null);
    try {
      const res = await walletAuth({ walletAddress: addr });
      if (res.requiresUsername || (res.isNew && !res.user)) {
        setStep("wallet-name");
        return;
      }
      await done();
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || "Wallet login failed");
    } finally {
      setBusy(false);
    }
  };

  const submitWalletName = nameForm.handleSubmit(async ({ username }) => {
    setBusy(true);
    setError(null);
    try {
      await walletAuth({ walletAddress: walletAddr, username: username.trim() });
      await done();
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || "Could not create account");
    } finally {
      setBusy(false);
    }
  });

  const sendCode = emailForm.handleSubmit(async ({ email: raw }) => {
    setBusy(true);
    setError(null);
    setMailHint(null);
    try {
      const res = await requestOtp(raw.trim());
      setEmail(raw.trim());
      setDevCode(res.devCode || null);
      if (res.sent) setMailHint("Code sent. Check inbox and spam.");
      else if (res.mailError) setMailHint(res.mailError);
      setStep("otp-code");
    } catch (e: any) {
      setError(e?.message || "Could not send code");
    } finally {
      setBusy(false);
    }
  });

  const checkCode = codeForm.handleSubmit(async ({ code: raw }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await verifyOtp({ email, code: raw.trim() });
      setCode(raw.trim());
      if (res.requiresUsername) {
        setStep("otp-username");
        return;
      }
      await done();
    } catch (e: any) {
      setError(e?.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  });

  const finishNew = nameForm.handleSubmit(async ({ username }) => {
    setBusy(true);
    setError(null);
    try {
      await verifyOtp({ email, code, username: username.trim() });
      await done();
    } catch (e: any) {
      setError(e?.message || "Could not finish signup");
    } finally {
      setBusy(false);
    }
  });

  const doPassword = passwordForm.handleSubmit(async ({ identifier, password }) => {
    setBusy(true);
    setError(null);
    try {
      await passwordLogin({ identifier: identifier.trim(), password });
      await done();
    } catch (e: any) {
      setError(e?.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  });

  const field = "w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm dark:border-border-dark dark:bg-surface-dark";

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-lg font-bold">Chainpace</span>
        <ThemeToggle />
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-12">
        {error && <div className="mb-4 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-[13px] text-coral">{error}</div>}
        {mailHint && <div className="mb-4 rounded-lg border border-border px-3 py-2 text-[13px] text-dim dark:border-border-dark">{mailHint}</div>}

        {step === "home" && (
          <div className="space-y-3">
            <h1 className="font-display text-[28px] font-semibold">Sign in</h1>
            <p className="text-[14px] text-dim">Google, wallet, or email. Session cookie lasts 4 days.</p>
            <GoogleSignIn onSuccess={done} />
            <WalletConnectButton onConnected={afterWallet} />
            <button type="button" onClick={() => setStep("otp")} className="w-full rounded-xl border border-border py-3.5 text-sm font-semibold dark:border-border-dark">Email one-time code</button>
            <button type="button" onClick={() => setStep("password")} className="w-full text-center text-[13px] text-faint underline">Use password instead</button>
          </div>
        )}

        {step === "otp" && (
          <form onSubmit={sendCode} className="space-y-3">
            <button type="button" onClick={() => setStep("home")} className="text-sm text-faint">← Back</button>
            <h1 className="font-display text-[24px] font-semibold">Email code</h1>
            <input {...emailForm.register("email", { required: true, pattern: /.+@.+/ })} placeholder="you@email.com" type="email" className={field} />
            <button disabled={busy} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Send code"}</button>
          </form>
        )}

        {step === "otp-code" && (
          <form onSubmit={checkCode} className="space-y-3">
            <button type="button" onClick={() => setStep("otp")} className="text-sm text-faint">← Back</button>
            <h1 className="font-display text-[24px] font-semibold">Enter code</h1>
            {devCode && <p className="text-xs text-gold">Dev fallback code: {devCode}</p>}
            <input {...codeForm.register("code", { required: true, minLength: 4 })} placeholder="6-digit code" inputMode="numeric" className={`${field} text-center font-mono text-lg tracking-[0.3em]`} />
            <button disabled={busy} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">Verify</button>
          </form>
        )}

        {step === "otp-username" && (
          <form onSubmit={finishNew} className="space-y-3">
            <h1 className="font-display text-[24px] font-semibold">Pick a username</h1>
            <input {...nameForm.register("username", { required: true, minLength: 3 })} placeholder="username" className={field} />
            <button disabled={busy} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">Create account</button>
          </form>
        )}

        {step === "wallet-name" && (
          <form onSubmit={submitWalletName} className="space-y-3">
            <h1 className="font-display text-[24px] font-semibold">Pick a username</h1>
            <input {...nameForm.register("username", { required: true, minLength: 3 })} placeholder="username" className={field} />
            <button disabled={busy} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">Continue</button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={doPassword} className="space-y-3">
            <button type="button" onClick={() => setStep("home")} className="text-sm text-faint">← Back</button>
            <h1 className="font-display text-[24px] font-semibold">Password</h1>
            <input {...passwordForm.register("identifier", { required: true })} placeholder="email or username" className={field} />
            <input {...passwordForm.register("password", { required: true, minLength: 6 })} type="password" placeholder="password" className={field} />
            <button disabled={busy} className="w-full rounded-xl bg-violet-dark py-3 text-sm font-semibold text-white disabled:opacity-50">Sign in</button>
          </form>
        )}
      </div>
    </div>
  );
}
