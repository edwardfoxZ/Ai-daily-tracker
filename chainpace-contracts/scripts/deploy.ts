import { network } from "hardhat";

const { ethers } = await network.create({
  network: "ganache",
  chainType: "l1",
});

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const chainpace = await ethers.deployContract("ChainpaceCore");
  await chainpace.waitForDeployment();

  const address = await chainpace.getAddress();
  console.log("ChainpaceCore deployed to:", address);
}

await main();
