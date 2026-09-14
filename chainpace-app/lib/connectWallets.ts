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
    return eth.providers.find((p: any) => p.isMetaMask && !p.isBraveWallet) || eth.providers[0];
  }
  return eth ?? null;
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

async function signLogin(provider: any) {
  try {
    const ethersProvider = new BrowserProvider(provider);
    await (await ethersProvider.getSigner()).signMessage("Chainpace login");
  } catch (e: any) {
    if (e?.code === 4001) throw new Error(friendlyWalletError(e));
  }
}

async function connectInjectedMetaMask(): Promise<string> {
  const inj = injected();
  if (!inj) throw new Error("NO_INJECTED");
  lastProvider = inj;
  const accounts = await accountsFrom(inj);
  if (!accounts[0]) throw new Error("MetaMask returned no account. Unlock it and try again.");
  await signLogin(inj);
  localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify({ walletId: "metamask", kind: "evm" }));
  return accounts[0];
}

function openMetaMask(uri: string) {
  const encoded = encodeURIComponent(uri);
  const url = `https://metamask.app.link/wc?uri=${encoded}`;
  // Stay on this page if possible; fall back to navigation.
  const w = window.open(url, "_blank");
  if (!w) window.location.href = url;
}

async function connectMetaMaskWalletConnect(): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID on this deploy");
  }
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const wc = await EthereumProvider.init({
    projectId,
    chains: [1],
    optionalChains: [SEI_TESTNET.chainId, 1329, 8453],
    showQrModal: false,
    metadata: {
      name: "Chainpace",
      description: "Proof-of-habit",
      url: typeof window !== "undefined" ? window.location.origin : "https://esthertrackerai.vercel.app",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });
  lastProvider = wc;

  if (wc.session) {
    const existing = await accountsFrom(wc);
    if (existing[0]) {
      await signLogin(wc);
      return existing[0];
    }
  }

  const uriReady = new Promise<string>((resolve) => {
    wc.on("display_uri", (uri: string) => resolve(uri));
  });

  const connecting = wc.connect();
  const uri = await Promise.race([
    uriReady,
    new Promise<string>((_, reject) => setTimeout(() => reject(new Error("WalletConnect timed out")), 20000)),
  ]);

  if (isMobile()) {
    openMetaMask(uri);
  }

  await connecting;
  try {
    await wc.enable();
  } catch {
    /* ok */
  }
  const found = await accountsFrom(wc);
  if (!found[0]) {
    throw new Error("Approve the request inside MetaMask, then tap MetaMask again.");
  }
  await signLogin(wc);
  localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify({ walletId: "metamask", kind: "evm" }));
  return found[0];
}

/** Desktop extension or phone → MetaMask only. */
export async function connectWallet(): Promise<string> {
  try {
    if (!isMobile() && injected()) {
      return await connectInjectedMetaMask();
    }
    if (isMobile() && injected()?.isMetaMask && /MetaMaskMobile/i.test(navigator.userAgent)) {
      return await connectInjectedMetaMask();
    }
    return await connectMetaMaskWalletConnect();
  } catch (e: any) {
    throw new Error(friendlyWalletError(e));
  }
}
