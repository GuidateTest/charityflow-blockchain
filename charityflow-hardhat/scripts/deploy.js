const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying CharityDonation contract...");
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Deploy with 2% platform fee (200 basis points)
  const PLATFORM_FEE_BP = 200;
  const CharityDonation = await ethers.getContractFactory("CharityDonation");
  const charityDonation = await CharityDonation.deploy(PLATFORM_FEE_BP);
  await charityDonation.waitForDeployment();

  const address = await charityDonation.getAddress();
  const deploymentTx = charityDonation.deploymentTransaction();
  const deploymentReceipt = deploymentTx ? await deploymentTx.wait() : null;
  console.log("\nCharityDonation deployed to:", address);
  if (deploymentReceipt) {
    console.log("Deployment block:", deploymentReceipt.blockNumber);
  }
  console.log("Platform fee:", PLATFORM_FEE_BP / 100, "%");
  console.log("Network:", network.name);

  // Seed some demo data for local development
  if (
    network.name === "localhost" ||
    network.name === "hardhat"
  ) {
    console.log("\nSeeding demo data...");

    const signers = await ethers.getSigners();
    const charity1 = signers[1];
    const charity2 = signers[2];
    const donor1 = signers[3];
    const donor2 = signers[4];
    const donor3 = signers[5];

    // Verify charities
    await charityDonation.connect(deployer).verifyCharity(charity1.address);
    await charityDonation.connect(deployer).verifyCharity(charity2.address);
    console.log("Charities verified");

    // Create campaigns
    const now = Math.floor(Date.now() / 1000);

    await charityDonation.connect(charity1).createCampaign(
      "Clean Water for Rural Communities",
      "We are working to install water purification systems across 10 rural villages in need. Every donation directly funds water pumps, filtration units, and infrastructure.",
      "Health",
      "QmCleanWaterImageHash",
      ethers.parseEther("5"),
      60
    );

    await charityDonation.connect(charity1).createCampaign(
      "Girls Education Fund 2025",
      "Providing school supplies, uniforms, and tuition support for 200 girls from underprivileged families to complete secondary education.",
      "Education",
      "QmGirlsEducationImageHash",
      ethers.parseEther("3"),
      45
    );

    await charityDonation.connect(charity2).createCampaign(
      "Reforestation: Plant 10,000 Trees",
      "Our team of volunteers will plant 10,000 native trees across deforested zones. Blockchain-tracked progress ensures every donor sees exactly where their trees are planted.",
      "Environment",
      "QmReforestationImageHash",
      ethers.parseEther("8"),
      90
    );

    await charityDonation.connect(charity2).createCampaign(
      "Emergency Food Relief - Crisis Response",
      "Immediate food packages for 500 families affected by recent flooding. Funds are disbursed within 48 hours of receipt — all transactions visible on-chain.",
      "Humanitarian",
      "QmFoodReliefImageHash",
      ethers.parseEther("2"),
      15
    );

    console.log("4 campaigns created");

    // Make donations
    await charityDonation.connect(donor1).donate(1, "Happy to help!", {
      value: ethers.parseEther("1.5"),
    });
    await charityDonation.connect(donor2).donate(1, "Clean water for all", {
      value: ethers.parseEther("0.8"),
    });
    await charityDonation.connect(donor3).donate(1, "", {
      value: ethers.parseEther("0.5"),
    });
    await charityDonation.connect(donor1).donate(2, "Education is key", {
      value: ethers.parseEther("1.0"),
    });
    await charityDonation.connect(donor2).donate(3, "Go green!", {
      value: ethers.parseEther("2.0"),
    });
    await charityDonation.connect(donor3).donate(4, "Urgent help needed", {
      value: ethers.parseEther("0.5"),
    });
    console.log("Donations made");

    // Submit proofs
    await charityDonation.connect(charity1).submitProof(
      1,
      "Water pump installation at Village A",
      "We successfully installed 2 water pumps at Village A serving approximately 150 families. Pump specifications: 500L/hour capacity.",
      "QmPumpInstallationProofHash",
      ethers.parseEther("0.8")
    );

    await charityDonation.connect(charity1).submitProof(
      1,
      "Filtration system delivery - Invoice",
      "Received and installed 3 filtration units. Attached invoice from supplier Aquatech Ltd.",
      "QmFiltrationInvoiceHash",
      ethers.parseEther("0.4")
    );
    console.log("Proofs submitted");

    // Admin verifies proofs
    await charityDonation.connect(deployer).verifyProof(1);
    console.log("Proof 1 verified by admin");

    // Charity withdraws
    await charityDonation.connect(charity1).withdrawFunds(
      1,
      ethers.parseEther("0.8"),
      "Payment to Aquatech Ltd for pump installation",
      "QmInvoiceHash1"
    );
    console.log("Withdrawal made");

    // Post impact report
    await charityDonation.connect(charity1).postImpactReport(
      1,
      "Week 2 Impact Report: Water Access Restored",
      "As of this week, 3 villages now have access to clean, filtered water. We have served over 450 families and collected water quality samples confirming safe drinking standards (WHO compliant). Next step: Villages D and E installation by end of month.",
      ["QmImpactPhoto1", "QmImpactPhoto2", "QmWaterTestResults"]
    );
    console.log("Impact report posted");
  }

  console.log("\nDeployment complete.");
  console.log("Contract address:", address);

  // Auto-update frontend .env when deploying to Sepolia
  if (network.name === "sepolia") {
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, "../../charityflow-frontend/.env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    const updates = {
      VITE_CONTRACT_ADDRESS: address,
      VITE_DEPLOYMENT_BLOCK: deploymentReceipt ? String(deploymentReceipt.blockNumber) : "0",
    };
    for (const [key, val] of Object.entries(updates)) {
      const re = new RegExp(`^${key}=.*$`, "m");
      if (re.test(envContent)) {
        envContent = envContent.replace(re, `${key}=${val}`);
      } else {
        envContent += (envContent.endsWith("\n") ? "" : "\n") + `${key}=${val}\n`;
      }
    }
    fs.writeFileSync(envPath, envContent);
    console.log("\n✓ Frontend .env updated automatically. Restart the dev server.");
  } else {
    console.log("\nUpdate frontend .env: VITE_CONTRACT_ADDRESS=" + address);
    if (deploymentReceipt) console.log("VITE_DEPLOYMENT_BLOCK=" + deploymentReceipt.blockNumber);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
