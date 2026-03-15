/**
 * Deploy SWC-106 vulnerable and fixed contracts for Lab 7 Group A
 * Run: npx hardhat run scripts/deploy-swc106.js --network ganache
 */
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy vulnerable contract
  const Vulnerable = await hre.ethers.getContractFactory("VulnerableContract_SWC106");
  const vulnerable = await Vulnerable.deploy();
  await vulnerable.waitForDeployment();
  const vulnerableAddr = await vulnerable.getAddress();
  console.log("VulnerableContract_SWC106 deployed to:", vulnerableAddr);

  // Deploy fixed contract
  const Secure = await hre.ethers.getContractFactory("SecureContract_SWC106_Fixed");
  const secure = await Secure.deploy();
  await secure.waitForDeployment();
  const secureAddr = await secure.getAddress();
  console.log("SecureContract_SWC106_Fixed deployed to:", secureAddr);

  console.log("\n--- SWC-106 Lab 7 Group A ---");
  console.log("Vulnerable (anyone can destroy):", vulnerableAddr);
  console.log("Fixed (onlyOwner):", secureAddr);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
