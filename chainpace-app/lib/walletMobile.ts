export function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function hasInjectedWallet() {
  return typeof window !== "undefined" && !!(window as any).ethereum;
}

/** Deep-link so phone Chrome/Safari opens this page inside MetaMask. */
export function openInMetaMaskApp() {
  if (typeof window === "undefined") return;
  const href = window.location.href.replace(/^https?:\/\//, "");
  window.location.href = `https://metamask.app.link/dapp/${href}`;
}
