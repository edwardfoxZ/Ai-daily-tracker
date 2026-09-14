import { BrowserProvider } from "ethers";
import { friendlyWalletError } from "@/lib/walletSession";

export type MobileWallet = "metamask" | "trust" | "walletconnect";

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function injected(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? (window as any).trustwallet ?? null;
}

function inWalletBrowser() {
  const eth = injected();
  if (!eth) return false;
  return !!(eth.isTrust || eth.isTrustWallet || eth.isMetaMask || eth.isCoinbaseWallet);
}

function pickInjected(kind: MobileWallet): any | null {
  const eth = injected();
  if (!eth) return null;
  const list: any[] = eth.providers ?? [eth];
  if (kind === "trust") {
    return (
      list.find((p) => p.isTrust || p.isTrustWallet) ??
      (eth.isTrust || eth.isTrustWallet ? eth : (window as any).trustwallet ?? null)
    );
  }
  if (kind === "metamask") {
    return list.find((p) => p.isMetaMask && !p.isTrust) ?? (eth.isMetaMask ? eth : null);
  }
  return eth;
}

async function connectWalletConnect(): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
  }
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 1328);
  const wc = await EthereumProvider.init({
    projectId,
    chains: [chainId],
    optionalChains: [1, 1328, 1329, 8453],
    showQrModal: true,
    metadata: {
      name: "Chainpace",
      description: "Proof-of-habit",
      url: typeof window !== "undefined" ? window.location.origin : "https://esthertrackerai.vercel.app",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });
  await wc.connect();
  const accts = wc.accounts;
  if (!accts?.[0]) throw new Error("WalletConnect returned no account");
  try {
    const provider = new BrowserProvider(wc as any);
    const signer = await provider.getSigner();
    await signer.signMessage("Chainpace login");
  } catch (e: any) {
    throw new Error(friendlyWalletError(e));
  }
  return accts[0];
}

export async function connectInjectedOrWc(kind: MobileWallet): Promise<string> {
  try {
    const useInjected = pickInjected(kind) && (!isMobile() || inWalletBrowser());
    if (useInjected) {
      const inj = pickInjected(kind)!;
      const accounts: string[] = await inj.request({ method: "eth_requestAccounts" });
      if (!accounts?.[0]) throw new Error("No account returned");
      try {
        const provider = new BrowserProvider(inj);
        const signer = await provider.getSigner();
        await signer.signMessage("Chainpace login");
      } catch (e: any) {
        throw new Error(friendlyWalletError(e));
      }
      return accounts[0];
    }
    return await connectWalletConnect();
  } catch (e: any) {
    throw new Error(friendlyWalletError(e));
  }
}
