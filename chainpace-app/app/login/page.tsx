"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useWeb3 } from "@/lib/useWeb3";
import { signup, login, walletAuth, checkUsername, ApiError } from "@/lib/api";

type Step =
  | "method"
  | "wallet-connect"
  | "wallet-username"
  | "email-form"
  | "phone-form"
  | "connect-nudge";

type AuthMode = "in" | "up";

export default function LoginPage() {
  const router = useRouter();
  const web3 = useWeb3();

  const [authMode, setAuthMode] = useState<AuthMode>("in");
  const [step, setStep] = useState<Step>("method");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const [identifier, setIdentifier] = useState(""); // email or username, sign-in
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const isUp = authMode === "up";

  /* -------- debounce username availability check -------- */
  useEffect(() => {
    if (username.trim().length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const available = await checkUsername(username.trim());
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const resetError = () => setError(null);

  const goWallet = async () => {
    resetError();
    setStep("wallet-connect");
    try {
      await web3.connect("metamask");
    } catch (err: any) {
      setError(err?.message || "Failed to connect wallet");
    }
  };

  // once web3 reports connected, check backend for an existing account tied to this wallet
  useEffect(() => {
    if (step !== "wallet-connect") return;
    if (!web3.isConnected || !web3.address) return;

    (async () => {
      setLoading(true);
      resetError();
      try {
        const res = await walletAuth({ walletAddress: web3.address! });
        if (res.isNew) {
          setStep("wallet-username");
        } else {
          router.push("/dashboard");
        }
      } catch (err: any) {
        setError(err instanceof ApiError ? err.message : "Failed to verify wallet");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3.isConnected, web3.address, step]);

  const submitWalletUsername = async () => {
    if (!web3.address) return;
    resetError();
    setLoading(true);
    try {
      await walletAuth({ walletAddress: web3.address, username: username.trim() });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const submitEmailForm = async () => {
    resetError();
    setLoading(true);
    try {
      if (isUp) {
        await signup({ username: username.trim(), email: email.trim(), password });
        setStep("connect-nudge");
      } else {
        await login({ identifier: identifier.trim(), password });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const submitPhoneForm = async () => {
    resetError();
    setLoading(true);
    try {
      if (isUp) {
        await signup({ username: username.trim(), phone: phone.trim(), password });
        setStep("connect-nudge");
      } else {
        await login({ identifier: identifier.trim(), password });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      {/* LEFT: BRAND PANEL */}
      <div
        className="relative hidden min-h-screen flex-1 flex-col justify-between overflow-hidden border-r border-bordersoft bg-elevated p-14 dark:border-bordersoft-dark dark:bg-elevated-dark md:flex"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 700px 500px at 20% 15%, rgba(155,93,229,.14), transparent 60%), radial-gradient(ellipse 600px 600px at 80% 85%, rgba(94,234,212,.06), transparent 60%)",
        }}
      >
        <div className="z-10 flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-[9px] bg-gradient-to-br from-violet-bright to-violet-deep shadow-glow">
            <div className="absolute inset-2 rounded bg-elevated dark:bg-elevated-dark" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Chainpace</span>
        </div>

        <div className="z-10 max-w-[440px]">
          <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-violet-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_8px_#5EEAD4]" />
            Proof-of-habit, on-chain
          </div>
          <h1 className="mb-4 font-display text-4xl font-semibold leading-tight tracking-tight">
            Your routine, verified. Your streak, shared.
          </h1>
          <p className="text-[15px] leading-relaxed text-dim dark:text-dim-dark">
            Connect your wallet, log your work, and let AI check it against
            real clinical research — then let your circle hold you to it.
          </p>
        </div>

        <div className="relative z-10 my-5 flex h-[260px] w-full items-center justify-center">
          <div className="absolute h-[220px] w-[220px] animate-spin-slow rounded-full border border-border dark:border-border-dark" />
          <div className="absolute h-[170px] w-[170px] animate-spin-slow-reverse rounded-full border border-dashed border-border opacity-50 dark:border-border-dark" />
          <div className="absolute h-[120px] w-[120px] rounded-full border border-violet-dark shadow-glow" />
          {[
            { top: "14%", left: "50%" },
            { top: "50%", left: "88%" },
            { top: "86%", left: "50%" },
            { top: "50%", left: "12%" },
          ].map((pos, i) => (
            <div key={i} className="absolute h-[9px] w-[9px] rounded-full bg-mint shadow-[0_0_10px_#5EEAD4]" style={pos} />
          ))}
          <div
            className="relative z-10 flex h-[84px] w-[84px] animate-pulse-glow items-center justify-center rounded-full shadow-glow-strong"
            style={{ backgroundImage: "radial-gradient(circle at 35% 30%, #B98CF0, #6D2FC7 70%)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[34px] w-[34px]">
              <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#fff" />
            </svg>
          </div>
        </div>

        <div className="z-10 flex flex-wrap gap-2.5">
          {["14-day streak · verified", "ML-scored consistency", "Wallet-linked identity"].map((chip) => (
            <div key={chip} className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-[11px] text-dim dark:border-border-dark dark:bg-surface-dark dark:text-dim-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-bright" />
              {chip}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: FORM PANEL */}
      <div className="relative flex flex-1 items-center justify-center p-10">
        <div className="absolute right-8 top-7">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[392px]">
          {error && (
            <div className="mb-5 rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-[12.5px] text-coral">
              {error}
            </div>
          )}

          {step === "method" && (
            <div>
              <div className="mb-6 flex gap-1.5">
                <button
                  onClick={() => { setAuthMode("in"); resetError(); }}
                  className={`flex-1 border-b-2 pb-2.5 text-[12.5px] font-semibold transition-colors ${!isUp ? "border-violet-dark text-ink dark:text-ink-dark" : "border-border text-dim dark:border-border-dark dark:text-dim-dark"}`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setAuthMode("up"); resetError(); }}
                  className={`flex-1 border-b-2 pb-2.5 text-[12.5px] font-semibold transition-colors ${isUp ? "border-violet-dark text-ink dark:text-ink-dark" : "border-border text-dim dark:border-border-dark dark:text-dim-dark"}`}
                >
                  Create account
                </button>
              </div>

              <h2 className="mb-1.5 font-display text-[26px] font-semibold tracking-tight">
                {isUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mb-7 text-[13.5px] leading-relaxed text-dim dark:text-dim-dark">
                {isUp
                  ? "Sign up with a wallet in one step, or use email / phone."
                  : "Connect your wallet for the full experience, or continue with email."}
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={goWallet}
                  className="flex w-full items-center gap-3 rounded-xl border-none bg-gradient-to-br from-violet-bright to-violet-deep p-3.5 text-left text-white shadow-glow transition hover:shadow-glow-strong hover:-translate-y-0.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-white/15">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="6" width="20" height="13" rx="3" stroke="#fff" strokeWidth="1.6" />
                      <path d="M2 10h20" stroke="#fff" strokeWidth="1.6" />
                      <circle cx="17" cy="14.5" r="1.3" fill="#fff" />
                    </svg>
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">Continue with wallet</span>
                    <small className="block text-[11.5px] font-normal text-white/75">MetaMask (extend via useWeb3 for others)</small>
                  </span>
                </button>

                <button
                  onClick={() => { setStep("email-form"); resetError(); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left transition hover:-translate-y-0.5 hover:border-violet-dark hover:shadow-glow dark:border-border-dark dark:bg-surface-dark"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-bordersoft bg-surface2 dark:border-bordersoft-dark dark:bg-surface2-dark">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18v12H3z" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                  <span className="flex-1 text-sm font-medium">Continue with email</span>
                </button>

                <button
                  onClick={() => { setStep("phone-form"); resetError(); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left transition hover:-translate-y-0.5 hover:border-violet-dark hover:shadow-glow dark:border-border-dark dark:bg-surface-dark"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-bordersoft bg-surface2 dark:border-bordersoft-dark dark:bg-surface2-dark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M11 18h2" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                  <span className="flex-1 text-sm font-medium">Continue with phone</span>
                </button>
              </div>

              <p className="mt-6 text-center text-[12.5px] text-faint dark:text-faint-dark">
                By continuing you agree to the{" "}
                <a className="cursor-pointer font-medium text-violet-bright hover:underline">Terms</a> and{" "}
                <a className="cursor-pointer font-medium text-violet-bright hover:underline">Privacy Policy</a>.
              </p>
            </div>
          )}

          {step === "wallet-connect" && (
            <div>
              <button
                onClick={() => setStep("method")}
                className="mb-5 text-[12.5px] text-faint hover:text-dim dark:text-faint-dark dark:hover:text-dim-dark"
              >
                ← Back
              </button>
              <div className="flex flex-col items-center pb-1.5 pt-5 text-center">
                <div
                  className="mb-4.5 flex h-16 w-16 animate-pulse-glow-fast items-center justify-center rounded-full shadow-glow-strong"
                  style={{ backgroundImage: "radial-gradient(circle at 35% 30%, #B98CF0, #6D2FC7 70%)" }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="6" width="20" height="13" rx="3" stroke="#fff" strokeWidth="1.6" />
                    <path d="M2 10h20" stroke="#fff" strokeWidth="1.6" />
                  </svg>
                </div>
                <div className="mb-1 text-[13.5px] text-dim dark:text-dim-dark">
                  {web3.isConnecting
                    ? "Waiting for signature in your wallet…"
                    : loading
                    ? "Verifying wallet with Chainpace…"
                    : web3.isConnected
                    ? "Wallet connected."
                    : "Connecting…"}
                </div>
                <div className="font-mono text-xs text-faint dark:text-faint-dark">
                  {web3.address ? `${web3.address.slice(0, 6)}...${web3.address.slice(-4)}` : "Approve the connection request in your wallet"}
                </div>
              </div>
            </div>
          )}

          {step === "wallet-username" && (
            <div>
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-mint/25 bg-mint/10 px-2.5 py-1 font-mono text-[11px] text-mint">
                ✓ Wallet connected
              </span>
              <h2 className="mb-1.5 font-display text-[26px] font-semibold tracking-tight">Choose your username</h2>
              <p className="mb-7 text-[13.5px] text-dim dark:text-dim-dark">
                <span className="font-mono text-faint dark:text-faint-dark">
                  {web3.address ? `${web3.address.slice(0, 6)}...${web3.address.slice(-4)}` : ""}
                </span>{" "}
                — this is how your circle will find you.
              </p>
              <div className="relative mb-4">
                <label className="mb-1.5 block text-[12.5px] font-semibold text-dim dark:text-dim-dark">Username</label>
                <input
                  type="text"
                  placeholder="e.g. morning_marcus"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm outline-none transition focus:border-violet-dark focus:ring-4 focus:ring-violet-dark/15 dark:border-border-dark dark:bg-surface-dark"
                />
                {usernameAvailable !== null && (
                  <span className={`absolute right-3 top-9 font-mono text-[11px] ${usernameAvailable ? "text-mint" : "text-coral"}`}>
                    {usernameAvailable ? "✓ available" : "✕ taken"}
                  </span>
                )}
              </div>
              <button
                onClick={submitWalletUsername}
                disabled={loading || !username.trim() || usernameAvailable === false}
                className="mt-1.5 w-full rounded-xl bg-gradient-to-br from-violet-bright to-violet-deep py-3.5 text-[14.5px] font-semibold text-white shadow-glow transition hover:shadow-glow-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Enter Chainpace"}
              </button>
            </div>
          )}

          {step === "email-form" && (
            <div>
              <button
                onClick={() => setStep("method")}
                className="mb-5 text-[12.5px] text-faint hover:text-dim dark:text-faint-dark dark:hover:text-dim-dark"
              >
                ← Back
              </button>
              <h2 className="mb-1.5 font-display text-[26px] font-semibold tracking-tight">
                {isUp ? "Sign up with email" : "Sign in with email"}
              </h2>
              <p className="mb-6 text-[13.5px] text-dim dark:text-dim-dark">
                {isUp ? "Choose a username and password to get started." : "Welcome back — enter your details to continue."}
              </p>

              {isUp ? (
                <>
                  <Field label="Username" placeholder="e.g. morning_marcus" value={username} onChange={setUsername} />
                  <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
                  <Field label="Password" type="password" placeholder="••••••••••" value={password} onChange={setPassword} hint="Minimum 8 characters." />
                </>
              ) : (
                <>
                  <Field label="Email or username" placeholder="you@example.com" value={identifier} onChange={setIdentifier} />
                  <Field label="Password" type="password" placeholder="••••••••••" value={password} onChange={setPassword} />
                </>
              )}

              <button
                onClick={submitEmailForm}
                disabled={loading}
                className="mt-1.5 w-full rounded-xl bg-gradient-to-br from-violet-bright to-violet-deep py-3.5 text-[14.5px] font-semibold text-white shadow-glow transition hover:shadow-glow-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Please wait…" : "Continue"}
              </button>

              {!isUp && (
                <p className="mt-5 text-center text-[12.5px] text-faint dark:text-faint-dark">
                  New here?{" "}
                  <span onClick={() => setAuthMode("up")} className="cursor-pointer font-medium text-violet-bright hover:underline">
                    Create an account
                  </span>
                </p>
              )}
            </div>
          )}

          {step === "phone-form" && (
            <div>
              <button
                onClick={() => setStep("method")}
                className="mb-5 text-[12.5px] text-faint hover:text-dim dark:text-faint-dark dark:hover:text-dim-dark"
              >
                ← Back
              </button>
              <h2 className="mb-1.5 font-display text-[26px] font-semibold tracking-tight">
                {isUp ? "Sign up with phone" : "Sign in with phone"}
              </h2>
              <p className="mb-6 text-[13.5px] text-dim dark:text-dim-dark">
                {isUp ? "Choose a username and password to get started." : "Welcome back — enter your details to continue."}
              </p>

              {isUp ? (
                <>
                  <Field label="Username" placeholder="e.g. morning_marcus" value={username} onChange={setUsername} />
                  <Field label="Phone number" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={setPhone} />
                  <Field label="Password" type="password" placeholder="••••••••••" value={password} onChange={setPassword} />
                </>
              ) : (
                <>
                  <Field label="Phone number" type="tel" placeholder="+1 (555) 000-0000" value={identifier} onChange={setIdentifier} />
                  <Field label="Password" type="password" placeholder="••••••••••" value={password} onChange={setPassword} />
                </>
              )}

              <button
                onClick={submitPhoneForm}
                disabled={loading}
                className="mt-1.5 w-full rounded-xl bg-gradient-to-br from-violet-bright to-violet-deep py-3.5 text-[14.5px] font-semibold text-white shadow-glow transition hover:shadow-glow-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Please wait…" : "Continue"}
              </button>

              <p className="mt-5 text-center text-[12.5px] text-faint dark:text-faint-dark">
                New here?{" "}
                <span onClick={() => setAuthMode("up")} className="cursor-pointer font-medium text-violet-bright hover:underline">
                  Create an account
                </span>
              </p>
            </div>
          )}

          {step === "connect-nudge" && (
            <div>
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-mint/25 bg-mint/10 px-2.5 py-1 font-mono text-[11px] text-mint">
                ✓ Account created
              </span>
              <h2 className="mb-1.5 font-display text-[26px] font-semibold tracking-tight">Unlock the full experience</h2>
              <p className="mb-6 text-[13.5px] leading-relaxed text-dim dark:text-dim-dark">
                Connect a wallet to verify your habit proofs on-chain, join circles, and appear on leaderboards. You can skip this for now.
              </p>
              <button
                onClick={goWallet}
                className="mb-3 flex w-full items-center gap-3 rounded-xl bg-gradient-to-br from-violet-bright to-violet-deep p-3.5 text-left text-white shadow-glow transition hover:shadow-glow-strong"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-white/15">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="6" width="20" height="13" rx="3" stroke="#fff" strokeWidth="1.6" />
                    <path d="M2 10h20" stroke="#fff" strokeWidth="1.6" />
                  </svg>
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">Connect wallet now</span>
                  <small className="block text-[11.5px] font-normal text-white/75">Recommended</small>
                </span>
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full rounded-xl border border-border py-3 text-[14.5px] font-semibold text-dim transition hover:border-violet-dark hover:text-ink dark:border-border-dark dark:text-dim-dark dark:hover:text-ink-dark"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[12.5px] font-semibold text-dim dark:text-dim-dark">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm outline-none transition focus:border-violet-dark focus:ring-4 focus:ring-violet-dark/15 dark:border-border-dark dark:bg-surface-dark"
      />
      {hint && <div className="mt-1.5 text-[11.5px] text-faint dark:text-faint-dark">{hint}</div>}
    </div>
  );
}
