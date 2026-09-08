import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
        settings: {
          evmVersion: "london",
          optimizer: { enabled: true, runs: 200 },
        },
      },
      production: {
        version: "0.8.24",
        settings: {
          evmVersion: "cancun",
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    ganache: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: [configVariable("GANACHE_PRIVATE_KEY")],
    },
    seiTestnet: {
      type: "http",
      chainType: "l1",
      chainId: 1328,
      url: "https://evm-rpc-testnet.sei-apis.com",
      accounts: [configVariable("SEI_PRIVATE_KEY")],
    },
    sei: {
      type: "http",
      chainType: "l1",
      chainId: 1329,
      url: "https://evm-rpc.sei-apis.com",
      accounts: [configVariable("SEI_PRIVATE_KEY")],
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
