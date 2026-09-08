import { network } from "hardhat";

const { ethers } = await network.create({
  network: "seiTestnet",
  chainType: "l1",
});

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Network: Sei Testnet (atlantic-2 / 1328)");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const chainpace = await ethers.deployContract("ChainpaceCore");
  await chainpace.waitForDeployment();

  const address = await chainpace.getAddress();
  console.log("ChainpaceCore deployed to:", address);
  console.log("Explorer:", `https://testnet.seiscan.io/address/${address}`);
}

await main();
