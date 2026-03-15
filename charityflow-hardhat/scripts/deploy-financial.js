const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying FinancialContract...");
  console.log("Deployer (owner):", deployer.address);

  const FinancialContract = await ethers.getContractFactory("FinancialContract");
  const contract = await FinancialContract.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("FinancialContract deployed to:", address);

  // Write config for workshop5 frontend
  const configPath = path.join(__dirname, "../../workshop5/financial-dapp/config.json");
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({
    contractAddress: address,
    chainId: 31337,
    deployer: deployer.address,
  }, null, 2));
  console.log("Config written to workshop5/financial-dapp/config.json");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
