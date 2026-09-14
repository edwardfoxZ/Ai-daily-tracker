export const WALLET_SESSION_KEY = "chainpace_wallet_session";

export function friendlyWalletError(err: any): string {
  const code = err?.code ?? err?.info?.error?.code;
  const msg = String(err?.shortMessage || err?.message || "");
  if (code === 4001 || /user rejected|rejected the request|denied|cancelled|canceled/i.test(msg)) {
    return "Connection cancelled. You rejected the request in your wallet.";
  }
  if (/already pending/i.test(msg)) {
    return "A wallet popup is already open. Check MetaMask or Trust Wallet.";
  }
  return msg || "Could not connect wallet.";
}

export function hardDisconnectWallet() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WALLET_SESSION_KEY);
  try {
    (window as any).solana?.disconnect?.();
  } catch {
    /* ignore */
  }
}
