import { BrowserProvider } from "ethers";
import { friendlyWalletError } from "@/lib/walletSession";
import { WALLET_SESSION_KEY } from "@/lib/walletSession";

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
  const eth = (window as any).ethereum;
  if (eth?.providers?.length) {
    return eth.providers.find((p: any) => p.isMetaMask) || eth.providers[0];
  }
  return eth ?? (window as any).trustwallet ?? null;
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
      if (/^0x[a-fA-F0-9]{40}$/.test(addr) && !out.includes(addr.toLowerCase())) {
        out.push(addr);
      }
    }
  };
  push(provider?.accounts);
  for (const method of ["eth_requestAccounts", "eth_accounts"] as const) {
    try {
      push(await provider.request({ method }));
    } catch {
      /* ignore */
    }
  }
  try {
    push(provider?.session?.namespaces?.eip155?.accounts);
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
    return parseInt(String(hex), 16);
  } catch {
    return null;
  }
}

export async function addSeiTestnet(): Promise<{ added: boolean; reason?: string }> {
  const p = lastProvider || injected();
  if (!p?.request) return { added: false, reason: "No wallet connected" };
  if (p.isTrust || p.isTrustWallet) {
    return {
      added: false,
      reason: "Add Sei Testnet inside Trust Wallet. Auto-add only works in MetaMask.",
    };
  }
  try {
    await p.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEI_TESTNET.hexId }],
    });
    return { added: true };
  } catch (switchErr: any) {
    if (switchErr?.code === 4001) throw new Error(friendlyWalletError(switchErr));
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

async function connectInjected(): Promise<string> {
  const inj = injected();
  if (!inj) throw new Error("NO_INJECTED");
  lastProvider = inj;
  const accounts = await accountsFrom(inj);
  if (!accounts[0]) throw new Error("MetaMask returned no account. Unlock it and try again.");
  try {
    const provider = new BrowserProvider(inj);
    const signer = await provider.getSigner();
    await signer.signMessage("Chainpace login");
  } catch (e: any) {
    throw new Error(friendlyWalletError(e));
  }
  localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify({ walletId: "metamask", kind: "evm" }));
  return accounts[0];
}

async function connectWalletConnect(): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID on this deploy");
  }
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const wc = await EthereumProvider.init({
    projectId,
    // Required chain 1 so MetaMask / Trust appear in the modal.
    // Sei is optional; we switch/add it after connect.
    chains: [1],
    optionalChains: [SEI_TESTNET.chainId, 1329, 8453, 137],
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
    /* ok */
  }
  const found = await accountsFrom(wc);
  if (!found[0]) {
    throw new Error("Wallet session opened but no account yet. Approve in the wallet, then tap Connect again.");
  }
  localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify({ walletId: "walletconnect", kind: "evm" }));
  return found[0];
}

export async function connectWallet(): Promise<string> {
  try {
    if (injected()) {
      return await connectInjected();
    }
    return await connectWalletConnect();
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg === "NO_INJECTED" || /missing|no injected/i.test(msg)) {
      return await connectWalletConnect();
    }
    throw new Error(friendlyWalletError(e));
  }
}
