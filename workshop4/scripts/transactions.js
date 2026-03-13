const { ethers } = require("hardhat");

/**
 * Workshop 4 - Transaction Script
 * Student: Seif Sid Ali Maloufi
 *
 * Executes the following sequence against the deployed Vault:
 *   1. Account 0 deposits 2 ETH
 *   2. Account 1 deposits 5 ETH
 *   3. Account 2 deposits 3 ETH
 *   4. Any account withdraws 4 ETH
 *   5. Prints current contract balance
 */
async function main() {
  // --- Configuration ---
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "CONTRACT_ADDRESS environment variable is not set.\n" +
      "Usage: $env:CONTRACT_ADDRESS='0x...'; npx hardhat run scripts/transactions.js --network ganache"
    );
  }

  const signers = await ethers.getSigners();
  const account0 = signers[0];
  const account1 = signers[1];
  const account2 = signers[2];

  const vault = await ethers.getContractAt("Vault", CONTRACT_ADDRESS);

  console.log("=".repeat(60));
  console.log("  Workshop 4 - MDT915 Blockchain Technology");
  console.log("  Student: Seif Sid Ali Maloufi");
  console.log("=".repeat(60));
  console.log("  Contract:", CONTRACT_ADDRESS);
  console.log("=".repeat(60));

  // --- Step 1: Account 0 deposits 2 ETH ---
  console.log("\n[1/4] Account 0 deposits 2 ETH...");
  console.log("      From:", account0.address);
  let tx = await vault.connect(account0).deposit({ value: ethers.parseEther("2") });
  let receipt = await tx.wait();
  console.log("      TX Hash:", receipt.hash);
  console.log("      Block:", receipt.blockNumber);
  console.log("      Gas Used:", receipt.gasUsed.toString());
  console.log("      Status: SUCCESS");

  // --- Step 2: Account 1 deposits 5 ETH ---
  console.log("\n[2/4] Account 1 deposits 5 ETH...");
  console.log("      From:", account1.address);
  tx = await vault.connect(account1).deposit({ value: ethers.parseEther("5") });
  receipt = await tx.wait();
  console.log("      TX Hash:", receipt.hash);
  console.log("      Block:", receipt.blockNumber);
  console.log("      Gas Used:", receipt.gasUsed.toString());
  console.log("      Status: SUCCESS");

  // --- Step 3: Account 2 deposits 3 ETH ---
  console.log("\n[3/4] Account 2 deposits 3 ETH...");
  console.log("      From:", account2.address);
  tx = await vault.connect(account2).deposit({ value: ethers.parseEther("3") });
  receipt = await tx.wait();
  console.log("      TX Hash:", receipt.hash);
  console.log("      Block:", receipt.blockNumber);
  console.log("      Gas Used:", receipt.gasUsed.toString());
  console.log("      Status: SUCCESS");

  // --- Step 4: Account 0 withdraws 4 ETH ---
  console.log("\n[4/4] Account 0 withdraws 4 ETH...");
  console.log("      From:", account0.address);
  tx = await vault.connect(account0).withdraw(ethers.parseEther("4"));
  receipt = await tx.wait();
  console.log("      TX Hash:", receipt.hash);
  console.log("      Block:", receipt.blockNumber);
  console.log("      Gas Used:", receipt.gasUsed.toString());
  console.log("      Status: SUCCESS");

  // --- Step 5: Print current contract balance ---
  const contractBalance = await vault.getContractBalance();
  console.log("\n" + "=".repeat(60));
  console.log("  Current Contract Balance:", ethers.formatEther(contractBalance), "ETH");
  console.log("  (Total deposited: 10 ETH, Withdrawn: 4 ETH, Remaining: 6 ETH)");
  console.log("=".repeat(60));
  console.log("\nAll transactions completed successfully.");
  console.log("Student: Seif Sid Ali Maloufi");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
