import { BrowserProvider } from "ethers";
import { SEI_TESTNET } from "@/lib/connectWallets";

export type WcSession = { uri: string; addressPromise: Promise<string>; cancel: () => void };

function isMobile() {
  return typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function walletDeepLinks(uri: string) {
  const encoded = encodeURIComponent(uri);
  return [
    { name: "MetaMask", href: `https://metamask.app.link/wc?uri=${encoded}` },
    { name: "Trust Wallet", href: `https://link.trustwallet.com/wc?uri=${encoded}` },
    { name: "Coinbase", href: `https://go.cb-w.com/wc?uri=${encoded}` },
  ];
}

export async function startWalletConnect(): Promise<WcSession> {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for phone wallet connect.");
  }
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const wc = await EthereumProvider.init({
    projectId,
    chains: [1],
    optionalChains: [SEI_TESTNET.chainId, 1329],
    showQrModal: false,
    metadata: {
      name: "Chainpace",
      description: "Proof-of-habit",
      url: window.location.origin,
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });

  let resolveUri: (uri: string) => void = () => {};
  const uriPromise = new Promise<string>((resolve) => {
    resolveUri = resolve;
  });
  wc.on("display_uri", (uri: string) => resolveUri(uri));

  const connecting = wc.connect();
  const uri = await Promise.race([
    uriPromise,
    new Promise<string>((_, reject) => setTimeout(() => reject(new Error("WalletConnect timed out")), 25000)),
  ]);

  if (isMobile()) {
    window.location.href = walletDeepLinks(uri)[0].href;
  }

  const addressPromise = (async () => {
    await connecting;
    const accounts = (wc as any).accounts as string[] | undefined;
    const raw = accounts?.[0] || "";
    const address = raw.includes(":") ? raw.split(":").pop() || "" : raw;
    if (!address) throw new Error("Approve the connection in your wallet, then return to this page.");
    const provider = new BrowserProvider(wc as any);
    await (await provider.getSigner()).signMessage("Chainpace login");
    try {
      await (wc as any).request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEI_TESTNET.hexId }],
      });
    } catch {
      /* user can switch later */
    }
    return address;
  })();

  return { uri, addressPromise, cancel: () => wc.disconnect().catch(() => {}) };
}
