const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CharityDonation", function () {
  let charityDonation;
  let admin, charity1, charity2, donor1, donor2, donor3;
  const PLATFORM_FEE = 200; // 2%
  const ONE_ETH = ethers.parseEther("1.0");
  const GOAL = ethers.parseEther("10.0");
  const DURATION_DAYS = 30;

  beforeEach(async function () {
    [admin, charity1, charity2, donor1, donor2, donor3] = await ethers.getSigners();

    const CharityDonation = await ethers.getContractFactory("CharityDonation");
    charityDonation = await CharityDonation.deploy(PLATFORM_FEE);
    await charityDonation.waitForDeployment();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Deployment
  // ─────────────────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the correct platform admin", async function () {
      expect(await charityDonation.platformAdmin()).to.equal(admin.address);
    });

    it("Should set the correct platform fee percent", async function () {
      expect(await charityDonation.platformFeePercent()).to.equal(PLATFORM_FEE);
    });

    it("Should reject fee above 10%", async function () {
      const CharityDonation = await ethers.getContractFactory("CharityDonation");
      await expect(CharityDonation.deploy(1001)).to.be.revertedWith(
        "Fee cannot exceed 10%"
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Campaign Creation
  // ─────────────────────────────────────────────────────────────────────────
  describe("Campaign Creation", function () {
    it("Should create a campaign and emit CampaignCreated event", async function () {
      const tx = await charityDonation.connect(charity1).createCampaign(
        "Clean Water Initiative",
        "Provide clean water to villages",
        "Health",
        "QmTestImageHash123",
        GOAL,
        DURATION_DAYS
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "CampaignCreated"
      );
      expect(event).to.not.be.undefined;

      const campaignId = event.args.campaignId;
      expect(campaignId).to.equal(1n);

      const campaign = await charityDonation.getCampaign(1);
      expect(campaign.title).to.equal("Clean Water Initiative");
      expect(campaign.charity).to.equal(charity1.address);
      expect(campaign.goalAmount).to.equal(GOAL);
      expect(campaign.status).to.equal(0); // Active
    });

    it("Should reject campaign with empty title", async function () {
      await expect(
        charityDonation.connect(charity1).createCampaign(
          "", "Description", "Health", "QmHash", GOAL, DURATION_DAYS
        )
      ).to.be.revertedWith("Title required");
    });

    it("Should reject campaign with zero goal", async function () {
      await expect(
        charityDonation.connect(charity1).createCampaign(
          "Title", "Description", "Health", "QmHash", 0, DURATION_DAYS
        )
      ).to.be.revertedWith("Goal must be positive");
    });

    it("Should reject campaign with invalid duration", async function () {
      await expect(
        charityDonation.connect(charity1).createCampaign(
          "Title", "Description", "Health", "QmHash", GOAL, 0
        )
      ).to.be.revertedWith("Duration must be 1-365 days");

      await expect(
        charityDonation.connect(charity1).createCampaign(
          "Title", "Description", "Health", "QmHash", GOAL, 366
        )
      ).to.be.revertedWith("Duration must be 1-365 days");
    });

    it("Should increment campaign counter for multiple campaigns", async function () {
      await charityDonation.connect(charity1).createCampaign(
        "Campaign 1", "Desc 1", "Health", "QmHash1", GOAL, DURATION_DAYS
      );
      await charityDonation.connect(charity2).createCampaign(
        "Campaign 2", "Desc 2", "Education", "QmHash2", GOAL, DURATION_DAYS
      );

      expect(await charityDonation.getTotalCampaigns()).to.equal(2n);
    });

    it("Should mark campaign as verified if charity is verified", async function () {
      await charityDonation.connect(admin).verifyCharity(charity1.address);
      await charityDonation.connect(charity1).createCampaign(
        "Verified Campaign", "Desc", "Health", "QmHash", GOAL, DURATION_DAYS
      );

      const campaign = await charityDonation.getCampaign(1);
      expect(campaign.verified).to.be.true;
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Donations
  // ─────────────────────────────────────────────────────────────────────────
  describe("Donations", function () {
    beforeEach(async function () {
      await charityDonation.connect(charity1).createCampaign(
        "Water Project", "Desc", "Health", "QmHash", GOAL, DURATION_DAYS
      );
    });

    it("Should accept a donation and emit DonationMade event", async function () {
      await expect(
        charityDonation.connect(donor1).donate(1, "Keep up the great work!", {
          value: ONE_ETH,
        })
      )
        .to.emit(charityDonation, "DonationMade")
        .withArgs(
          1n,
          1n,
          donor1.address,
          ethers.parseEther("0.98"), // 2% fee deducted
          await time.latest()
        );
    });

    it("Should correctly deduct platform fee from donation", async function () {
      await charityDonation.connect(donor1).donate(1, "Good cause", {
        value: ONE_ETH,
      });

      const campaign = await charityDonation.getCampaign(1);
      const expectedNet = (ONE_ETH * (10000n - BigInt(PLATFORM_FEE))) / 10000n;
      expect(campaign.raisedAmount).to.equal(expectedNet);

      const feeAmount = (ONE_ETH * BigInt(PLATFORM_FEE)) / 10000n;
      expect(await charityDonation.totalPlatformFees()).to.equal(feeAmount);
    });

    it("Should reject zero-value donation", async function () {
      await expect(
        charityDonation.connect(donor1).donate(1, "Test", { value: 0 })
      ).to.be.revertedWith("Donation must be positive");
    });

    it("Should reject donation to non-existent campaign", async function () {
      await expect(
        charityDonation.connect(donor1).donate(999, "Test", { value: ONE_ETH })
      ).to.be.revertedWith("Campaign does not exist");
    });

    it("Should track donor history correctly", async function () {
      await charityDonation.connect(donor1).donate(1, "First", { value: ONE_ETH });
      await charityDonation.connect(donor1).donate(1, "Second", { value: ONE_ETH });

      const donationIds = await charityDonation.getDonorDonations(donor1.address);
      expect(donationIds.length).to.equal(2);
    });

    it("Should count unique donors correctly", async function () {
      await charityDonation.connect(donor1).donate(1, "", { value: ONE_ETH });
      await charityDonation.connect(donor2).donate(1, "", { value: ONE_ETH });
      // donor1 donates again - should not increment donor count
      await charityDonation.connect(donor1).donate(1, "", { value: ONE_ETH });

      const campaign = await charityDonation.getCampaign(1);
      expect(campaign.donorCount).to.equal(2n);
    });

    it("Should auto-complete campaign when goal is reached", async function () {
      await charityDonation.connect(donor1).donate(1, "Big donation", {
        value: ethers.parseEther("11.0"), // exceeds 10 ETH goal (after fee still >10 ETH)
      });

      // Actually need to account for fee: 11 ETH * 0.98 = 10.78 ETH > 10 ETH goal
      const campaign = await charityDonation.getCampaign(1);
      expect(campaign.status).to.equal(1); // Completed
    });

    it("Should reject donation to cancelled campaign", async function () {
      await charityDonation.connect(charity1).cancelCampaign(1);
      await expect(
        charityDonation.connect(donor1).donate(1, "", { value: ONE_ETH })
      ).to.be.revertedWith("Campaign not active");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Proof of Work
  // ─────────────────────────────────────────────────────────────────────────
  describe("Proof of Work", function () {
    beforeEach(async function () {
      await charityDonation.connect(charity1).createCampaign(
        "Water Project", "Desc", "Health", "QmHash", GOAL, DURATION_DAYS
      );
      await charityDonation.connect(donor1).donate(1, "", { value: ONE_ETH });
    });

    it("Should allow charity to submit proof", async function () {
      await expect(
        charityDonation.connect(charity1).submitProof(
          1,
          "Water pump installed",
          "Installed pump at village A",
          "QmProofHash123",
          ethers.parseEther("0.5")
        )
      ).to.emit(charityDonation, "ProofSubmitted");

      const proofIds = await charityDonation.getCampaignProofs(1);
      expect(proofIds.length).to.equal(1);

      const proof = await charityDonation.getProof(1);
      expect(proof.fileHash).to.equal("QmProofHash123");
      expect(proof.verified).to.be.false;
    });

    it("Should reject proof from non-charity address", async function () {
      await expect(
        charityDonation.connect(donor1).submitProof(
          1, "Fake proof", "Fake desc", "QmFakeHash", ethers.parseEther("0.1")
        )
      ).to.be.revertedWith("Only campaign charity");
    });

    it("Should reject proof with empty file hash", async function () {
      await expect(
        charityDonation.connect(charity1).submitProof(
          1, "Title", "Desc", "", ethers.parseEther("0.1")
        )
      ).to.be.revertedWith("File hash required");
    });

    it("Should allow admin to verify proof", async function () {
      await charityDonation.connect(charity1).submitProof(
        1, "Title", "Desc", "QmHash", ethers.parseEther("0.1")
      );

      await expect(charityDonation.connect(admin).verifyProof(1))
        .to.emit(charityDonation, "ProofVerified")
        .withArgs(1n, admin.address);

      const proof = await charityDonation.getProof(1);
      expect(proof.verified).to.be.true;
    });

    it("Should reject proof verification by non-admin", async function () {
      await charityDonation.connect(charity1).submitProof(
        1, "Title", "Desc", "QmHash", ethers.parseEther("0.1")
      );

      await expect(
        charityDonation.connect(donor1).verifyProof(1)
      ).to.be.revertedWith("Only platform admin");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Withdrawals
  // ─────────────────────────────────────────────────────────────────────────
  describe("Withdrawals", function () {
    beforeEach(async function () {
      await charityDonation.connect(charity1).createCampaign(
        "Water Project", "Desc", "Health", "QmHash", GOAL, DURATION_DAYS
      );
      await charityDonation.connect(donor1).donate(1, "", {
        value: ethers.parseEther("5.0"),
      });
    });

    it("Should allow charity to withdraw with proof and emit event", async function () {
      const withdrawAmount = ethers.parseEther("1.0");
      const charityBalanceBefore = await ethers.provider.getBalance(
        charity1.address
      );

      const tx = await charityDonation.connect(charity1).withdrawFunds(
        1,
        withdrawAmount,
        "Purchase of water pumps",
        "QmReceiptHash"
      );
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const charityBalanceAfter = await ethers.provider.getBalance(
        charity1.address
      );

      // Balance should increase by withdrawAmount minus gas
      expect(charityBalanceAfter).to.be.closeTo(
        charityBalanceBefore + withdrawAmount - gasUsed,
        ethers.parseEther("0.001")
      );

      const withdrawalIds = await charityDonation.getCampaignWithdrawals(1);
      expect(withdrawalIds.length).to.equal(1);
    });

    it("Should reject withdrawal exceeding available balance", async function () {
      await expect(
        charityDonation.connect(charity1).withdrawFunds(
          1,
          ethers.parseEther("100.0"),
          "Too much",
          "QmHash"
        )
      ).to.be.revertedWith("Insufficient campaign balance");
    });

    it("Should reject withdrawal by non-charity address", async function () {
      await expect(
        charityDonation.connect(donor1).withdrawFunds(
          1,
          ethers.parseEther("0.1"),
          "Fraud attempt",
          "QmHash"
        )
      ).to.be.revertedWith("Only campaign charity");
    });

    it("Should reject withdrawal with empty purpose", async function () {
      await expect(
        charityDonation.connect(charity1).withdrawFunds(
          1,
          ethers.parseEther("0.1"),
          "",
          "QmHash"
        )
      ).to.be.revertedWith("Purpose required");
    });

    it("Should track multiple withdrawals correctly", async function () {
      await charityDonation.connect(charity1).withdrawFunds(
        1, ethers.parseEther("1.0"), "Pumps", "QmHash1"
      );
      await charityDonation.connect(charity1).withdrawFunds(
        1, ethers.parseEther("0.5"), "Pipes", "QmHash2"
      );

      const withdrawalIds = await charityDonation.getCampaignWithdrawals(1);
      expect(withdrawalIds.length).to.equal(2);

      const campaign = await charityDonation.getCampaign(1);
      expect(campaign.withdrawnAmount).to.equal(ethers.parseEther("1.5"));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: Refunds
  // ─────────────────────────────────────────────────────────────────────────
  describe("Refunds", function () {
    beforeEach(async function () {
      await charityDonation.connect(charity1).createCampaign(
        "Water Project", "Desc", "Health", "QmHash", GOAL, DURATION_DAYS
      );
      await charityDonation.connect(donor1).donate(1, "", { value: ONE_ETH });
    });

    it("Should allow donor to claim refund on cancelled campaign", async function () {
      await charityDonation.connect(charity1).cancelCampaign(1);

      const balanceBefore = await ethers.provider.getBalance(donor1.address);
      const tx = await charityDonation.connect(donor1).claimRefund(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(donor1.address);

      const netDonation = (ONE_ETH * 9800n) / 10000n; // after 2% fee
      expect(balanceAfter).to.be.closeTo(
        balanceBefore + netDonation - gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("Should reject refund on active campaign", async function () {
      await expect(
        charityDonation.connect(donor1).claimRefund(1)
      ).to.be.revertedWith("Campaign not cancelled");
    });

    it("Should reject double refund", async function () {
      await charityDonation.connect(charity1).cancelCampaign(1);
      await charityDonation.connect(donor1).claimRefund(1);

      await expect(
        charityDonation.connect(donor1).claimRefund(1)
      ).to.be.revertedWith("Already refunded");
    });

    it("Should reject refund claim by non-donor", async function () {
      await charityDonation.connect(charity1).cancelCampaign(1);

      await expect(
        charityDonation.connect(donor2).claimRefund(1)
      ).to.be.revertedWith("Not your donation");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: Impact Reports
  // ─────────────────────────────────────────────────────────────────────────
  describe("Impact Reports", function () {
    beforeEach(async function () {
      await charityDonation.connect(charity1).createCampaign(
        "Water Project", "Desc", "Health", "QmHash", GOAL, DURATION_DAYS
      );
    });

    it("Should allow charity to post impact report", async function () {
      await expect(
        charityDonation.connect(charity1).postImpactReport(
          1,
          "Month 1 Update",
          "We installed 3 pumps serving 500 families",
          ["QmMedia1", "QmMedia2"]
        )
      ).to.emit(charityDonation, "ImpactReportPosted");

      const reportIds = await charityDonation.getCampaignReports(1);
      expect(reportIds.length).to.equal(1);

      const report = await charityDonation.getImpactReport(1);
      expect(report.title).to.equal("Month 1 Update");
      expect(report.mediaHashes.length).to.equal(2);
    });

    it("Should reject impact report from non-charity", async function () {
      await expect(
        charityDonation.connect(donor1).postImpactReport(
          1, "Fake Report", "Content", []
        )
      ).to.be.revertedWith("Only campaign charity");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 8: Admin Functions
  // ─────────────────────────────────────────────────────────────────────────
  describe("Admin Functions", function () {
    it("Should allow admin to verify a charity", async function () {
      await expect(charityDonation.connect(admin).verifyCharity(charity1.address))
        .to.emit(charityDonation, "CharityVerified")
        .withArgs(charity1.address, admin.address);

      expect(await charityDonation.verifiedCharities(charity1.address)).to.be.true;
    });

    it("Should reject charity verification by non-admin", async function () {
      await expect(
        charityDonation.connect(charity1).verifyCharity(charity2.address)
      ).to.be.revertedWith("Only platform admin");
    });

    it("Should allow admin to update fee percent", async function () {
      await charityDonation.connect(admin).updateFeePercent(100); // 1%
      expect(await charityDonation.platformFeePercent()).to.equal(100n);
    });

    it("Should reject fee update above 10%", async function () {
      await expect(
        charityDonation.connect(admin).updateFeePercent(1001)
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should allow admin to collect platform fees", async function () {
      await charityDonation.connect(charity1).createCampaign(
        "Campaign", "Desc", "Health", "QmHash", GOAL, DURATION_DAYS
      );
      await charityDonation.connect(donor1).donate(1, "", { value: ONE_ETH });

      const expectedFee = (ONE_ETH * BigInt(PLATFORM_FEE)) / 10000n;
      const adminBalanceBefore = await ethers.provider.getBalance(admin.address);

      const tx = await charityDonation.connect(admin).withdrawPlatformFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const adminBalanceAfter = await ethers.provider.getBalance(admin.address);
      expect(adminBalanceAfter).to.be.closeTo(
        adminBalanceBefore + expectedFee - gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("Should allow admin transfer", async function () {
      await charityDonation.connect(admin).transferAdmin(charity1.address);
      expect(await charityDonation.platformAdmin()).to.equal(charity1.address);
    });

    it("Should reject admin transfer to zero address", async function () {
      await expect(
        charityDonation.connect(admin).transferAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 9: Deadline enforcement
  // ─────────────────────────────────────────────────────────────────────────
  describe("Deadline Enforcement", function () {
    it("Should reject donation after deadline", async function () {
      await charityDonation.connect(charity1).createCampaign(
        "Short Campaign", "Desc", "Health", "QmHash", GOAL, 1 // 1 day
      );

      // Fast-forward 2 days
      await time.increase(2 * 24 * 60 * 60);

      await expect(
        charityDonation.connect(donor1).donate(1, "", { value: ONE_ETH })
      ).to.be.revertedWith("Campaign deadline passed");
    });
  });
});
