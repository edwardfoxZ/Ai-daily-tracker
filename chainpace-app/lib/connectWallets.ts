import { BrowserProvider } from "ethers";

export type MobileWallet = "metamask" | "trust" | "walletconnect";

function injected(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? (window as any).trustwallet ?? null;
}

function pickInjected(kind: MobileWallet): any | null {
  const eth = injected();
  if (!eth) return null;
  const list: any[] = eth.providers ?? [eth];
  if (kind === "trust") {
    return list.find((p) => p.isTrust || p.isTrustWallet) ?? ((eth.isTrust || eth.isTrustWallet) ? eth : (window as any).trustwallet ?? null);
  }
  if (kind === "metamask") {
    return list.find((p) => p.isMetaMask && !p.isTrust) ?? (eth.isMetaMask ? eth : eth);
  }
  return eth;
}

export async function connectInjectedOrWc(kind: MobileWallet): Promise<string> {
  const inj = pickInjected(kind) ?? injected();
  if (inj) {
    const accounts: string[] = await inj.request({ method: "eth_requestAccounts" });
    if (!accounts?.[0]) throw new Error("No account returned");
    try {
      const provider = new BrowserProvider(inj);
      const signer = await provider.getSigner();
      await signer.signMessage("Chainpace login");
    } catch (e: any) {
      if (e?.code === 4001) throw new Error("Signature rejected");
    }
    return accounts[0];
  }

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "No wallet in this browser. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (free at cloud.reown.com) to connect Trust or MetaMask from a phone without leaving the app.",
    );
  }

  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 1328);
  const wc = await EthereumProvider.init({
    projectId,
    chains: [chainId],
    optionalChains: [1, 1328, 1329],
    showQrModal: true,
    metadata: {
      name: "Chainpace",
      description: "Proof-of-habit",
      url: typeof window !== "undefined" ? window.location.origin : "https://chainpace.app",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });
  await wc.connect();
  const accts = wc.accounts;
  if (!accts?.[0]) throw new Error("WalletConnect returned no account");
  return accts[0];
}
