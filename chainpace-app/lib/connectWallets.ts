import { BrowserProvider } from "ethers";
import { friendlyWalletError } from "@/lib/walletSession";

export const SEI_TESTNET = {
  chainId: 1328,
  hexId: "0x530",
  name: "Sei Testnet",
  rpcUrl: "https://evm-rpc-testnet.sei-apis.com",
  explorerUrl: "https://testnet.seiscan.io",
  nativeCurrency: { name: "SEI", symbol: "SEI", decimals: 18 },
};

let lastProvider: any = null;

export function getWalletProvider() {
  return lastProvider;
}

function injected(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? (window as any).trustwallet ?? null;
}

function isMetaMaskProvider(p: any) {
  return !!(p?.isMetaMask && !p?.isTrust && !p?.isTrustWallet);
}

function parseAccount(raw: string) {
  if (!raw) return "";
  if (raw.startsWith("0x")) return raw;
  const parts = raw.split(":");
  return parts[parts.length - 1] || "";
}

async function accountsFrom(provider: any): Promise<string[]> {
  const out: string[] = [];
  const push = (v: any) => {
    if (!v) return;
    const list = Array.isArray(v) ? v : [v];
    for (const item of list) {
      const addr = parseAccount(String(item));
      if (addr.startsWith("0x") && !out.includes(addr.toLowerCase())) out.push(addr);
    }
  };
  push(provider?.accounts);
  try {
    push(await provider.request({ method: "eth_accounts" }));
  } catch {
    /* ignore */
  }
  try {
    push(await provider.request({ method: "eth_requestAccounts" }));
  } catch {
    /* user may have already approved */
  }
  try {
    const ns = provider?.session?.namespaces?.eip155?.accounts;
    push(ns);
  } catch {
    /* ignore */
  }
  return out;
}

export async function getActiveChainId(): Promise<number | null> {
  const p = lastProvider || injected();
  if (!p?.request) return null;
  try {
    const hex = await p.request({ method: "eth_chainId" });
    return parseInt(hex, 16);
  } catch {
    return null;
  }
}

/** MetaMask supports wallet_addEthereumChain. Trust/WC may ignore it. */
export async function addSeiTestnet(): Promise<{ added: boolean; reason?: string }> {
  const p = lastProvider || injected();
  if (!p?.request) return { added: false, reason: "No wallet connected" };
  if (p.isTrust || p.isTrustWallet) {
    return { added: false, reason: "Add Sei Testnet in Trust Wallet networks. Auto-add only works in MetaMask." };
  }
  try {
    await p.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEI_TESTNET.hexId }],
    });
    return { added: true };
  } catch (switchErr: any) {
    if (switchErr?.code !== 4902 && !/unrecognized|not added/i.test(String(switchErr?.message))) {
      throw new Error(friendlyWalletError(switchErr));
    }
  }
  try {
    await p.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: SEI_TESTNET.hexId,
          chainName: SEI_TESTNET.name,
          rpcUrls: [SEI_TESTNET.rpcUrl],
          blockExplorerUrls: [SEI_TESTNET.explorerUrl],
          nativeCurrency: SEI_TESTNET.nativeCurrency,
        },
      ],
    });
    return { added: true };
  } catch (e: any) {
    throw new Error(friendlyWalletError(e));
  }
}

async function connectWalletConnect(): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID on this deploy");
  }
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const wc = await EthereumProvider.init({
    projectId,
    chains: [SEI_TESTNET.chainId],
    optionalChains: [SEI_TESTNET.chainId, 1329, 1, 8453],
    showQrModal: true,
    metadata: {
      name: "Chainpace",
      description: "Proof-of-habit",
      url: typeof window !== "undefined" ? window.location.origin : "https://esthertrackerai.vercel.app",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });
  lastProvider = wc;
  if (!wc.session) {
    await wc.connect();
  }
  try {
    await wc.enable();
  } catch {
    /* older providers */
  }
  const found = await accountsFrom(wc);
  if (!found[0]) {
    throw new Error("Wallet connected but no account came back. Open the wallet, approve the session, then tap Connect again.");
  }
  return found[0];
}

export async function connectWallet(): Promise<string> {
  try {
    const inj = injected();
    const inWalletApp = !!(inj && (inj.isMetaMask || inj.isTrust || inj.isTrustWallet || inj.isCoinbaseWallet));
    if (inj && inWalletApp) {
      lastProvider = inj;
      const accounts = await accountsFrom(inj);
      if (!accounts[0]) throw new Error("No account returned from wallet");
      try {
        const provider = new BrowserProvider(inj);
        const signer = await provider.getSigner();
        await signer.signMessage("Chainpace login");
      } catch (e: any) {
        throw new Error(friendlyWalletError(e));
      }
      return accounts[0];
    }
    const addr = await connectWalletConnect();
    try {
      const provider = new BrowserProvider(lastProvider);
      const signer = await provider.getSigner();
      await signer.signMessage("Chainpace login");
    } catch (e: any) {
      if (e?.code === 4001) throw new Error(friendlyWalletError(e));
    }
    return addr;
  } catch (e: any) {
    throw new Error(friendlyWalletError(e));
  }
}

export { isMetaMaskProvider };
