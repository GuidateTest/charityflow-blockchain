const { ethers } = require("hardhat");

/**
 * Workshop 4 - Balance Check Script
 * Student: Seif Sid Ali Maloufi
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  if (!CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS environment variable is not set.");
  }

  const vault = await ethers.getContractAt("Vault", CONTRACT_ADDRESS);
  const contractBalance = await vault.getContractBalance();

  console.log("=".repeat(60));
  console.log("  Workshop 4 - MDT915 Blockchain Technology");
  console.log("  Student: Seif Sid Ali Maloufi");
  console.log("=".repeat(60));
  console.log("  Contract:", CONTRACT_ADDRESS);
  console.log("  Current Balance:", ethers.formatEther(contractBalance), "ETH");
  console.log("  Current Balance (wei):", contractBalance.toString(), "wei");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
