"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserProvider, JsonRpcSigner, formatEther } from "ethers";

/* ---------------------------------------------------
   Types
--------------------------------------------------- */

export type ChainKind = "evm" | "solana";

export type WalletId =
  | "metamask"
  | "coinbase"
  | "walletconnect"
  | "phantom"
  | "injected";

export interface ChainInfo {
  id: number | string;
  kind: ChainKind;
  name: string;
  hexId?: string; // for EVM chains
  rpcUrl?: string;
  explorerUrl?: string;
  nativeCurrency?: { name: string; symbol: string; decimals: number };
}

export const CHAINS: Record<string, ChainInfo> = {
  ethereum: {
    id: 1,
    kind: "evm",
    name: "Ethereum",
    hexId: "0x1",
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  polygon: {
    id: 137,
    kind: "evm",
    name: "Polygon",
    hexId: "0x89",
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
  bsc: {
    id: 56,
    kind: "evm",
    name: "BNB Chain",
    hexId: "0x38",
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  },
  arbitrum: {
    id: 42161,
    kind: "evm",
    name: "Arbitrum One",
    hexId: "0xa4b1",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  optimism: {
    id: 10,
    kind: "evm",
    name: "Optimism",
    hexId: "0xa",
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  base: {
    id: 8453,
    kind: "evm",
    name: "Base",
    hexId: "0x2105",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  avalanche: {
    id: 43114,
    kind: "evm",
    name: "Avalanche",
    hexId: "0xa86a",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorerUrl: "https://snowtrace.io",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  },
  solana: {
    id: "mainnet-beta",
    kind: "solana",
    name: "Solana",
    explorerUrl: "https://explorer.solana.com",
    nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
  },
};

export interface Web3State {
  address: string | null;
  chain: ChainInfo | null;
  balance: string | null; // formatted native balance
  isConnecting: boolean;
  isConnected: boolean;
  walletId: WalletId | null;
  error: string | null;
}

interface UseWeb3Return extends Web3State {
  connect: (wallet: WalletId) => Promise<void>;
  disconnect: () => void;
  switchChain: (chainKey: keyof typeof CHAINS) => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  getProvider: () => BrowserProvider | null;
  getSigner: () => Promise<JsonRpcSigner | null>;
}

/* ---------------------------------------------------
   Window augmentation
--------------------------------------------------- */

declare global {
  interface Window {
    ethereum?: any;
    coinbaseWalletExtension?: any;
    solana?: any;
  }
}

const STORAGE_KEY = "chainpace_wallet_session";

/* ---------------------------------------------------
   Helpers
--------------------------------------------------- */

function getEvmProviderObject(wallet: WalletId): any | null {
  if (typeof window === "undefined") return null;
  const eth = window.ethereum;
  if (!eth) return null;

  // multiple injected providers (EIP-5749 / providers array)
  const providers: any[] = eth.providers ?? [eth];

  switch (wallet) {
    case "metamask":
      return (
        providers.find((p) => p.isMetaMask) ?? (eth.isMetaMask ? eth : null)
      );
    case "coinbase":
      return (
        providers.find((p) => p.isCoinbaseWallet) ??
        window.coinbaseWalletExtension ??
        (eth.isCoinbaseWallet ? eth : null)
      );
    case "injected":
      return eth;
    default:
      return null;
  }
}

function findChainByHexId(hexId: string): ChainInfo | null {
  const entry = Object.values(CHAINS).find(
    (c) => c.kind === "evm" && c.hexId?.toLowerCase() === hexId.toLowerCase(),
  );
  return entry ?? null;
}

/* ---------------------------------------------------
   useWeb3 hook
--------------------------------------------------- */

export function useWeb3(): UseWeb3Return {
  const [state, setState] = useState<Web3State>({
    address: null,
    chain: null,
    balance: null,
    isConnecting: false,
    isConnected: false,
    walletId: null,
    error: null,
  });

  const providerRef = useRef<BrowserProvider | null>(null);
  const evmObjRef = useRef<any | null>(null);

  const patch = (partial: Partial<Web3State>) =>
    setState((prev) => ({ ...prev, ...partial }));

  /* ---------- EVM connect ---------- */
  const connectEvm = useCallback(async (wallet: WalletId) => {
    const injected = getEvmProviderObject(wallet);
    if (!injected) {
      throw new Error(
        wallet === "metamask"
          ? "MetaMask not detected. Install it or choose another wallet."
          : wallet === "coinbase"
            ? "Coinbase Wallet not detected."
            : "No injected EVM wallet found.",
      );
    }

    const accounts: string[] = await injected.request({
      method: "eth_requestAccounts",
    });
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts returned from wallet.");
    }

    const browserProvider = new BrowserProvider(injected);
    const network = await browserProvider.getNetwork();
    const hexChainId = "0x" + network.chainId.toString(16);
    const chainInfo =
      findChainByHexId(hexChainId) ??
      ({
        id: Number(network.chainId),
        kind: "evm",
        name: `Chain ${network.chainId}`,
        hexId: hexChainId,
      } as ChainInfo);

    const rawBalance = await browserProvider.getBalance(accounts[0]);

    providerRef.current = browserProvider;
    evmObjRef.current = injected;

    patch({
      address: accounts[0],
      chain: chainInfo,
      balance: formatEther(rawBalance),
      isConnected: true,
      isConnecting: false,
      walletId: wallet,
      error: null,
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ walletId: wallet, kind: "evm" }),
    );

    injected.on?.("accountsChanged", handleEvmAccountsChanged);
    injected.on?.("chainChanged", handleEvmChainChanged);
  }, []);

  /* ---------- Solana connect (Phantom / any window.solana wallet) ---------- */
  const connectSolana = useCallback(async () => {
    const sol = window.solana;
    if (!sol || !sol.isPhantom) {
      throw new Error("Phantom (or a compatible Solana wallet) not detected.");
    }
    const resp = await sol.connect();
    const address = resp.publicKey.toString();

    patch({
      address,
      chain: CHAINS.solana,
      balance: null, // fetch via @solana/web3.js Connection if needed
      isConnected: true,
      isConnecting: false,
      walletId: "phantom",
      error: null,
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ walletId: "phantom", kind: "solana" }),
    );

    sol.on?.("accountChanged", (pubKey: any) => {
      if (pubKey) {
        patch({ address: pubKey.toString() });
      } else {
        disconnect();
      }
    });
  }, []);

  /* ---------- Public connect entrypoint ---------- */
  const connect = useCallback(
    async (wallet: WalletId) => {
      patch({ isConnecting: true, error: null });
      try {
        if (wallet === "phantom") {
          await connectSolana();
        } else {
          // metamask | coinbase | injected | walletconnect(fallback→injected)
          await connectEvm(wallet === "walletconnect" ? "injected" : wallet);
        }
      } catch (err: any) {
        patch({
          isConnecting: false,
          isConnected: false,
          error: err?.message ?? "Failed to connect wallet.",
        });
      }
    },
    [connectEvm, connectSolana],
  );

  /* ---------- Disconnect ---------- */
  const disconnect = useCallback(() => {
    evmObjRef.current?.removeListener?.(
      "accountsChanged",
      handleEvmAccountsChanged,
    );
    evmObjRef.current?.removeListener?.("chainChanged", handleEvmChainChanged);
    if (window.solana?.disconnect) {
      window.solana.disconnect().catch(() => {});
    }
    providerRef.current = null;
    evmObjRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
    setState({
      address: null,
      chain: null,
      balance: null,
      isConnecting: false,
      isConnected: false,
      walletId: null,
      error: null,
    });
  }, []);

  /* ---------- Switch EVM chain ---------- */
  const switchChain = useCallback(async (chainKey: keyof typeof CHAINS) => {
    const target = CHAINS[chainKey];
    const injected = evmObjRef.current;
    if (!target || target.kind !== "evm" || !injected) {
      throw new Error(
        "Chain switching is only supported for connected EVM wallets.",
      );
    }
    try {
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: target.hexId }],
      });
    } catch (switchError: any) {
      // chain not added to wallet yet
      if (switchError?.code === 4902) {
        await injected.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: target.hexId,
              chainName: target.name,
              rpcUrls: [target.rpcUrl],
              blockExplorerUrls: target.explorerUrl ? [target.explorerUrl] : [],
              nativeCurrency: target.nativeCurrency,
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  /* ---------- Sign message (EVM + Solana) ---------- */
  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (state.chain?.kind === "solana" && window.solana) {
        const encoded = new TextEncoder().encode(message);
        const signed = await window.solana.signMessage(encoded, "utf8");
        return Buffer.from(signed.signature).toString("hex");
      }
      if (providerRef.current) {
        const signer = await providerRef.current.getSigner();
        return await signer.signMessage(message);
      }
      return null;
    },
    [state.chain],
  );

  const getProvider = useCallback(() => providerRef.current, []);
  const getSigner = useCallback(async () => {
    if (!providerRef.current) return null;
    return await providerRef.current.getSigner();
  }, []);

  /* ---------- EVM event handlers ---------- */
  function handleEvmAccountsChanged(accounts: string[]) {
    if (!accounts || accounts.length === 0) {
      disconnect();
    } else {
      patch({ address: accounts[0] });
    }
  }

  function handleEvmChainChanged(hexChainId: string) {
    const chainInfo =
      findChainByHexId(hexChainId) ??
      ({
        id: parseInt(hexChainId, 16),
        kind: "evm",
        name: `Chain ${parseInt(hexChainId, 16)}`,
        hexId: hexChainId,
      } as ChainInfo);
    patch({ chain: chainInfo });
  }

  /* ---------- Auto-reconnect on mount ---------- */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const { walletId } = JSON.parse(saved) as { walletId: WalletId };
      connect(walletId);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchChain,
    signMessage,
    getProvider,
    getSigner,
  };
}
