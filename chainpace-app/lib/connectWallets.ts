import { BrowserProvider } from "ethers";
import { friendlyWalletError, WALLET_SESSION_KEY } from "@/lib/walletSession";

export const SEI_TESTNET = {
  chainId: 1328,
  hexId: "0x530",
  name: "Sei Testnet",
  rpcUrl: "https://evm-rpc-testnet.sei-apis.com",
  explorerUrl: "https://testnet.seiscan.io",
  nativeCurrency: { name: "SEI", symbol: "SEI", decimals: 18 },
};

const METAMASK_WC_ID = "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96";

let lastProvider: any = null;

export function getWalletProvider() {
  return lastProvider;
}

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function injected(): any | null {
  if (typeof window === "undefined") return null;
  const eth = (window as any).ethereum;
  if (eth?.providers?.length) {
    return eth.providers.find((p: any) => p.isMetaMask) || eth.providers[0];
  }
  return eth ?? (window as any).trustwallet ?? null;
}

/** True only inside MetaMask / Trust in-app browsers, not phone Chrome/Safari. */
function inWalletAppBrowser() {
  const eth = injected();
  if (!eth) return false;
  if (eth.isTrust || eth.isTrustWallet) return true;
  if (eth.isMetaMask && !eth.isBraveWallet && !eth.isRabby) {
    // Phone Chrome sometimes exposes a stub isMetaMask that cannot open the app.
    return isMobile() && /MetaMaskMobile|WebView|wv/i.test(navigator.userAgent);
  }
  return false;
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
      if (/^0x[a-fA-F0-9]{40}$/.test(addr) && !out.includes(addr.toLowerCase())) out.push(addr);
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
    return parseInt(String(await p.request({ method: "eth_chainId" })), 16);
  } catch {
    return null;
  }
}

export async function addSeiTestnet(): Promise<{ added: boolean; reason?: string }> {
  const p = lastProvider || injected();
  if (!p?.request) return { added: false, reason: "No wallet connected" };
  if (p.isTrust || p.isTrustWallet) {
    return { added: false, reason: "Add Sei Testnet inside Trust Wallet. Auto-add only works in MetaMask." };
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
  if (!accounts[0]) throw new Error("Wallet returned no account. Unlock it and try again.");
  try {
    const provider = new BrowserProvider(inj);
    await (await provider.getSigner()).signMessage("Chainpace login");
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
    chains: [1],
    optionalChains: [SEI_TESTNET.chainId, 1329, 8453, 137],
    showQrModal: true,
    qrModalOptions: {
      themeMode: "dark",
      explorerRecommendedWalletIds: [METAMASK_WC_ID],
    },
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
    throw new Error("Approve the session in MetaMask, then tap Connect wallet again.");
  }
  localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify({ walletId: "walletconnect", kind: "evm" }));
  return found[0];
}

export async function connectWallet(): Promise<string> {
  try {
    // Desktop extension: use it.
    if (!isMobile() && injected()) {
      return await connectInjected();
    }
    // Opened inside MetaMask/Trust app browser: use inject.
    if (isMobile() && inWalletAppBrowser()) {
      return await connectInjected();
    }
    // Phone Chrome/Safari: WalletConnect sheet → MetaMask / Trust.
    return await connectWalletConnect();
  } catch (e: any) {
    throw new Error(friendlyWalletError(e));
  }
}
