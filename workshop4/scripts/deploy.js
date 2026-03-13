const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("  Workshop 4 - MDT915 Blockchain Technology");
  console.log("  Student: Seif Sid Ali Maloufi");
  console.log("=".repeat(60));
  console.log("\nDeploying Vault contract...");
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log("\nVault deployed successfully.");
  console.log("Contract address:", address);
  console.log("Network: Ganache (localhost:7545)");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
