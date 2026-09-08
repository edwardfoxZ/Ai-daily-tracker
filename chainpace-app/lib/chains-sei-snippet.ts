"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserProvider, JsonRpcSigner, formatEther } from "ethers";

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
  hexId?: string;
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
  seiTestnet: {
    id: 1328,
    kind: "evm",
    name: "Sei Testnet",
    hexId: "0x530",
    rpcUrl: "https://evm-rpc-testnet.sei-apis.com",
    explorerUrl: "https://testnet.seiscan.io",
    nativeCurrency: { name: "SEI", symbol: "SEI", decimals: 18 },
  },
  sei: {
    id: 1329,
    kind: "evm",
    name: "Sei",
    hexId: "0x531",
    rpcUrl: "https://evm-rpc.sei-apis.com",
    explorerUrl: "https://seiscan.io",
    nativeCurrency: { name: "SEI", symbol: "SEI", decimals: 18 },
  },
  ganache: {
    id: 1337,
    kind: "evm",
    name: "Ganache",
    hexId: "0x539",
    rpcUrl: "http://127.0.0.1:7545",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  solana: {
    id: "mainnet-beta",
    kind: "solana",
    name: "Solana",
    explorerUrl: "https://explorer.solana.com",
    nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
  },
};
