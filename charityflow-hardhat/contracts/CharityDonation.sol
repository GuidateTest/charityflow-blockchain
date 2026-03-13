// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CharityDonation
 * @notice Transparent charity donation platform - donors can track every wei
 * @dev Implements campaign lifecycle, donation tracking, proof-of-work uploads, and transparent withdrawals
 */
contract CharityDonation {
    // ─────────────────────────────────────────────────────────────────────────
    // Data structures
    // ─────────────────────────────────────────────────────────────────────────

    enum CampaignStatus { Active, Completed, Cancelled }

    struct Campaign {
        uint256 id;
        address payable charity;
        string title;
        string description;
        string category;
        string imageHash;       // IPFS hash for cover image
        uint256 goalAmount;     // wei
        uint256 raisedAmount;
        uint256 withdrawnAmount;
        uint256 deadline;       // unix timestamp
        CampaignStatus status;
        bool verified;          // platform-verified charity
        uint256 donorCount;
        uint256 createdAt;
    }

    struct Donation {
        uint256 id;
        uint256 campaignId;
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
        bool refunded;
    }

    struct ProofOfWork {
        uint256 id;
        uint256 campaignId;
        address submittedBy;
        string title;
        string description;
        string fileHash;        // IPFS hash for proof document/image
        uint256 amountSpent;    // wei spent on this item
        uint256 timestamp;
        bool verified;          // platform admin verified
    }

    struct WithdrawalRecord {
        uint256 id;
        uint256 campaignId;
        address recipient;
        uint256 amount;
        string purpose;
        uint256 timestamp;
        string proofHash;       // IPFS hash linking to receipt/invoice
    }

    struct ImpactReport {
        uint256 id;
        uint256 campaignId;
        address submittedBy;
        string title;
        string content;
        string[] mediaHashes;   // IPFS hashes
        uint256 timestamp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State variables
    // ─────────────────────────────────────────────────────────────────────────

    address public platformAdmin;
    uint256 public platformFeePercent;  // basis points (e.g. 200 = 2%)
    uint256 public totalPlatformFees;

    uint256 private _campaignIdCounter;
    uint256 private _donationIdCounter;
    uint256 private _proofIdCounter;
    uint256 private _withdrawalIdCounter;
    uint256 private _reportIdCounter;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation) public donations;
    mapping(uint256 => ProofOfWork) public proofs;
    mapping(uint256 => WithdrawalRecord) public withdrawals;
    mapping(uint256 => ImpactReport) public impactReports;

    // donor address => list of donation IDs
    mapping(address => uint256[]) public donorDonations;
    // campaign => list of donation IDs
    mapping(uint256 => uint256[]) public campaignDonations;
    // campaign => list of proof IDs
    mapping(uint256 => uint256[]) public campaignProofs;
    // campaign => list of withdrawal IDs
    mapping(uint256 => uint256[]) public campaignWithdrawals;
    // campaign => list of impact report IDs
    mapping(uint256 => uint256[]) public campaignReports;
    // charity address => campaign IDs
    mapping(address => uint256[]) public charityCampaigns;
    // donor => campaign => donated amount
    mapping(address => mapping(uint256 => uint256)) public donorCampaignAmount;
    // verified charities
    mapping(address => bool) public verifiedCharities;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed charity,
        string title,
        uint256 goalAmount,
        uint256 deadline
    );
    event DonationMade(
        uint256 indexed donationId,
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 timestamp
    );
    event ProofSubmitted(
        uint256 indexed proofId,
        uint256 indexed campaignId,
        address indexed charity,
        string fileHash,
        uint256 amountSpent
    );
    event WithdrawalMade(
        uint256 indexed withdrawalId,
        uint256 indexed campaignId,
        address indexed recipient,
        uint256 amount,
        string purpose
    );
    event ImpactReportPosted(
        uint256 indexed reportId,
        uint256 indexed campaignId,
        address indexed charity
    );
    event CampaignVerified(uint256 indexed campaignId, address indexed admin);
    event CharityVerified(address indexed charity, address indexed admin);
    event CampaignCompleted(uint256 indexed campaignId);
    event CampaignCancelled(uint256 indexed campaignId);
    event RefundIssued(uint256 indexed donationId, address indexed donor, uint256 amount);
    event ProofVerified(uint256 indexed proofId, address indexed admin);

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == platformAdmin, "Only platform admin");
        _;
    }

    modifier onlyCampaignCharity(uint256 campaignId) {
        require(campaigns[campaignId].charity == msg.sender, "Only campaign charity");
        _;
    }

    modifier campaignExists(uint256 campaignId) {
        require(campaignId > 0 && campaignId <= _campaignIdCounter, "Campaign does not exist");
        _;
    }

    modifier campaignActive(uint256 campaignId) {
        require(campaigns[campaignId].status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp <= campaigns[campaignId].deadline, "Campaign deadline passed");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(uint256 _feePercent) {
        require(_feePercent <= 1000, "Fee cannot exceed 10%");
        platformAdmin = msg.sender;
        platformFeePercent = _feePercent;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Campaign Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new donation campaign
     * @param title Human-readable campaign title
     * @param description Detailed campaign description
     * @param category E.g. "Education", "Health", "Environment"
     * @param imageHash IPFS hash of the campaign cover image
     * @param goalAmount Funding goal in wei
     * @param durationDays Campaign duration in days
     */
    function createCampaign(
        string calldata title,
        string calldata description,
        string calldata category,
        string calldata imageHash,
        uint256 goalAmount,
        uint256 durationDays
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(goalAmount > 0, "Goal must be positive");
        require(durationDays >= 1 && durationDays <= 365, "Duration must be 1-365 days");

        _campaignIdCounter++;
        uint256 newId = _campaignIdCounter;

        campaigns[newId] = Campaign({
            id: newId,
            charity: payable(msg.sender),
            title: title,
            description: description,
            category: category,
            imageHash: imageHash,
            goalAmount: goalAmount,
            raisedAmount: 0,
            withdrawnAmount: 0,
            deadline: block.timestamp + (durationDays * 1 days),
            status: CampaignStatus.Active,
            verified: verifiedCharities[msg.sender],
            donorCount: 0,
            createdAt: block.timestamp
        });

        charityCampaigns[msg.sender].push(newId);

        emit CampaignCreated(newId, msg.sender, title, goalAmount, campaigns[newId].deadline);
        return newId;
    }

    /**
     * @notice Donate to a campaign
     * @param campaignId Target campaign
     * @param message Optional donor message
     */
    function donate(uint256 campaignId, string calldata message)
        external
        payable
        campaignExists(campaignId)
        campaignActive(campaignId)
    {
        require(msg.value > 0, "Donation must be positive");

        Campaign storage campaign = campaigns[campaignId];

        // Calculate and deduct platform fee
        uint256 fee = (msg.value * platformFeePercent) / 10000;
        uint256 netAmount = msg.value - fee;
        totalPlatformFees += fee;

        // Track if this is a new donor to this campaign
        if (donorCampaignAmount[msg.sender][campaignId] == 0) {
            campaign.donorCount++;
        }
        donorCampaignAmount[msg.sender][campaignId] += netAmount;
        campaign.raisedAmount += netAmount;

        _donationIdCounter++;
        uint256 donationId = _donationIdCounter;

        donations[donationId] = Donation({
            id: donationId,
            campaignId: campaignId,
            donor: msg.sender,
            amount: netAmount,
            timestamp: block.timestamp,
            message: message,
            refunded: false
        });

        donorDonations[msg.sender].push(donationId);
        campaignDonations[campaignId].push(donationId);

        // Auto-complete if goal reached
        if (campaign.raisedAmount >= campaign.goalAmount) {
            campaign.status = CampaignStatus.Completed;
            emit CampaignCompleted(campaignId);
        }

        emit DonationMade(donationId, campaignId, msg.sender, netAmount, block.timestamp);
    }

    /**
     * @notice Submit proof of work for a campaign (charity only)
     * @param campaignId Campaign this proof belongs to
     * @param title Short title for the proof item
     * @param description What was done / purchased
     * @param fileHash IPFS hash of the proof document/image
     * @param amountSpent Amount spent on this item in wei
     */
    function submitProof(
        uint256 campaignId,
        string calldata title,
        string calldata description,
        string calldata fileHash,
        uint256 amountSpent
    ) external campaignExists(campaignId) onlyCampaignCharity(campaignId) {
        require(bytes(fileHash).length > 0, "File hash required");

        _proofIdCounter++;
        uint256 proofId = _proofIdCounter;

        proofs[proofId] = ProofOfWork({
            id: proofId,
            campaignId: campaignId,
            submittedBy: msg.sender,
            title: title,
            description: description,
            fileHash: fileHash,
            amountSpent: amountSpent,
            timestamp: block.timestamp,
            verified: false
        });

        campaignProofs[campaignId].push(proofId);

        emit ProofSubmitted(proofId, campaignId, msg.sender, fileHash, amountSpent);
    }

    /**
     * @notice Withdraw funds from campaign (charity only - transparent on-chain record)
     * @param campaignId Campaign to withdraw from
     * @param amount Amount in wei
     * @param purpose Human-readable purpose for withdrawal
     * @param proofHash IPFS hash of invoice/receipt
     */
    function withdrawFunds(
        uint256 campaignId,
        uint256 amount,
        string calldata purpose,
        string calldata proofHash
    ) external campaignExists(campaignId) onlyCampaignCharity(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        require(
            campaign.status == CampaignStatus.Active ||
            campaign.status == CampaignStatus.Completed,
            "Campaign must be active or completed"
        );
        uint256 available = campaign.raisedAmount - campaign.withdrawnAmount;
        require(amount <= available, "Insufficient campaign balance");
        require(bytes(purpose).length > 0, "Purpose required");

        campaign.withdrawnAmount += amount;

        _withdrawalIdCounter++;
        uint256 withdrawalId = _withdrawalIdCounter;

        withdrawals[withdrawalId] = WithdrawalRecord({
            id: withdrawalId,
            campaignId: campaignId,
            recipient: msg.sender,
            amount: amount,
            purpose: purpose,
            timestamp: block.timestamp,
            proofHash: proofHash
        });

        campaignWithdrawals[campaignId].push(withdrawalId);

        campaign.charity.transfer(amount);

        emit WithdrawalMade(withdrawalId, campaignId, msg.sender, amount, purpose);
    }

    /**
     * @notice Post an impact report update for a campaign
     */
    function postImpactReport(
        uint256 campaignId,
        string calldata title,
        string calldata content,
        string[] calldata mediaHashes
    ) external campaignExists(campaignId) onlyCampaignCharity(campaignId) {
        _reportIdCounter++;
        uint256 reportId = _reportIdCounter;

        impactReports[reportId] = ImpactReport({
            id: reportId,
            campaignId: campaignId,
            submittedBy: msg.sender,
            title: title,
            content: content,
            mediaHashes: mediaHashes,
            timestamp: block.timestamp
        });

        campaignReports[campaignId].push(reportId);

        emit ImpactReportPosted(reportId, campaignId, msg.sender);
    }

    /**
     * @notice Cancel campaign and enable refunds (charity or admin)
     */
    function cancelCampaign(uint256 campaignId)
        external
        campaignExists(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];
        require(
            msg.sender == campaign.charity || msg.sender == platformAdmin,
            "Only charity or admin"
        );
        require(campaign.status == CampaignStatus.Active, "Campaign not active");

        campaign.status = CampaignStatus.Cancelled;
        emit CampaignCancelled(campaignId);
    }

    /**
     * @notice Claim refund for a cancelled campaign
     */
    function claimRefund(uint256 donationId) external {
        Donation storage donation = donations[donationId];
        require(donation.donor == msg.sender, "Not your donation");
        require(!donation.refunded, "Already refunded");
        require(
            campaigns[donation.campaignId].status == CampaignStatus.Cancelled,
            "Campaign not cancelled"
        );

        donation.refunded = true;
        donorCampaignAmount[msg.sender][donation.campaignId] -= donation.amount;

        campaigns[donation.campaignId].raisedAmount -= donation.amount;

        payable(msg.sender).transfer(donation.amount);

        emit RefundIssued(donationId, msg.sender, donation.amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────────────────────────────────

    function verifyCharity(address charity) external onlyAdmin {
        verifiedCharities[charity] = true;
        emit CharityVerified(charity, msg.sender);
    }

    function verifyCampaign(uint256 campaignId)
        external
        onlyAdmin
        campaignExists(campaignId)
    {
        campaigns[campaignId].verified = true;
        emit CampaignVerified(campaignId, msg.sender);
    }

    function verifyProof(uint256 proofId) external onlyAdmin {
        require(proofId > 0 && proofId <= _proofIdCounter, "Proof does not exist");
        proofs[proofId].verified = true;
        emit ProofVerified(proofId, msg.sender);
    }

    function withdrawPlatformFees() external onlyAdmin {
        uint256 amount = totalPlatformFees;
        totalPlatformFees = 0;
        payable(platformAdmin).transfer(amount);
    }

    function updateFeePercent(uint256 newFee) external onlyAdmin {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = newFee;
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        platformAdmin = newAdmin;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View / Query Functions
    // ─────────────────────────────────────────────────────────────────────────

    function getCampaign(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (Campaign memory)
    {
        return campaigns[campaignId];
    }

    function getTotalCampaigns() external view returns (uint256) {
        return _campaignIdCounter;
    }

    function getDonorDonations(address donor)
        external
        view
        returns (uint256[] memory)
    {
        return donorDonations[donor];
    }

    function getCampaignDonations(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (uint256[] memory)
    {
        return campaignDonations[campaignId];
    }

    function getCampaignProofs(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (uint256[] memory)
    {
        return campaignProofs[campaignId];
    }

    function getCampaignWithdrawals(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (uint256[] memory)
    {
        return campaignWithdrawals[campaignId];
    }

    function getCampaignReports(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (uint256[] memory)
    {
        return campaignReports[campaignId];
    }

    function getCharityCampaigns(address charity)
        external
        view
        returns (uint256[] memory)
    {
        return charityCampaigns[charity];
    }

    function getCampaignBalance(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (uint256)
    {
        Campaign storage c = campaigns[campaignId];
        return c.raisedAmount - c.withdrawnAmount;
    }

    function getDonation(uint256 donationId)
        external
        view
        returns (Donation memory)
    {
        require(donationId > 0 && donationId <= _donationIdCounter, "Donation does not exist");
        return donations[donationId];
    }

    function getProof(uint256 proofId)
        external
        view
        returns (ProofOfWork memory)
    {
        require(proofId > 0 && proofId <= _proofIdCounter, "Proof does not exist");
        return proofs[proofId];
    }

    function getWithdrawal(uint256 withdrawalId)
        external
        view
        returns (WithdrawalRecord memory)
    {
        require(withdrawalId > 0 && withdrawalId <= _withdrawalIdCounter, "Withdrawal does not exist");
        return withdrawals[withdrawalId];
    }

    function getImpactReport(uint256 reportId)
        external
        view
        returns (ImpactReport memory)
    {
        require(reportId > 0 && reportId <= _reportIdCounter, "Report does not exist");
        return impactReports[reportId];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive ETH
    // ─────────────────────────────────────────────────────────────────────────

    receive() external payable {
        totalPlatformFees += msg.value;
    }
}
