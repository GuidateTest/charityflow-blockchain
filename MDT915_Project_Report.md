# MDT915 — BLOCKCHAIN IMPLEMENTATION PROJECT

## CharityFlow: Transparent Charity Donation Platform

**Course:** MDT915 Blockchain Practitioner  
**Weight:** 30% of final grade  
**Type:** Group Project (2 students)  
**Due Date:** Session 6 — March 14, 2026, 1:00 PM  

---

## Team Members

| Name | Student ID | Role |
|------|------------|------|
| Seif Sid Ali Maloufi | [Your ID] | Developer (Smart Contracts, Frontend, Web3, IPFS) |
| Jyldyz Sulaimanova | [Your ID] | Report & Theory (Documentation, Research, Academic Writing) |

---

## 1. Executive Summary

CharityFlow is a decentralized application (DApp) that addresses the lack of transparency in charitable donations. Donors can track exactly how their contributions are used through an immutable blockchain ledger. Charities create campaigns, receive donations in cryptocurrency (ETH), and must declare withdrawals with proof before accessing funds. Every transaction—donations, withdrawals, proof submissions, and impact reports—is recorded on-chain and visible to all stakeholders.

The system is deployed on **Sepolia testnet** and supports both local Hardhat development and live testnet transactions. Key features include IPFS integration for document uploads, real-time on-chain activity logs, multi-network support (Hardhat + Sepolia), and a responsive React frontend.

---

## 2. Problem Statement

Traditional charity platforms suffer from:

- **Opacity:** Donors cannot verify how their money is spent.
- **Trust issues:** Charities may misuse funds without accountability.
- **Centralization:** Intermediaries control funds and charge high fees.
- **Lack of proof:** Impact claims are often unverifiable.

CharityFlow solves these by recording every donation, withdrawal, and proof of work on the Ethereum blockchain, making charity fully transparent and auditable.

---

## 3. Solution Design

### 3.1 Domain Choice

We selected **Option 2: Transparent Charity Donation Platform** from the assignment, implementing all required features:

- Donation campaigns creation by charities  
- Donor contributions in cryptocurrency (ETH)  
- Transparent fund tracking (donors see where money goes)  
- Impact reporting (charities upload proof of work via IPFS)

### 3.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CharityFlow DApp                                 │
├──────────────────────┬──────────────────────────────────────────────────┤
│  Frontend (React)    │  Landing, Campaigns, Donor Dashboard,            │
│  Vite + Ethers.js   │  Charity Portal, Campaign Detail                   │
├──────────────────────┼──────────────────────────────────────────────────┤
│  Web3 Layer         │  MetaMask → BrowserProvider → Signer → Contract    │
│  Ethers.js v6       │  Multi-network: Hardhat (31337) / Sepolia (11155111)│
├──────────────────────┼──────────────────────────────────────────────────┤
│  Smart Contract     │  CharityDonation.sol (Solidity 0.8.20)              │
│  CharityDonation    │  Campaigns, Donations, Proofs, Withdrawals, Reports │
├──────────────────────┼──────────────────────────────────────────────────┤
│  Storage            │  IPFS (Pinata) for images, receipts, proofs        │
├──────────────────────┼──────────────────────────────────────────────────┤
│  Blockchain         │  Hardhat Local / Sepolia Testnet                   │
│  Ethereum           │  Chain ID: 31337 (local) / 11155111 (Sepolia)     │
└──────────────────────┴──────────────────────────────────────────────────┘
```

### 3.3 Data Flow

```
Donor → MetaMask → donate(campaignId, message) → CharityDonation Contract
                                                          ↓
                                    Funds held in contract escrow
                                                          ↓
Charity → withdrawFunds(campaignId, amount, purpose, proofHash) → ETH sent
                                                          ↓
Charity → submitProof(campaignId, title, description, fileHash, amountSpent)
                                                          ↓
Charity → postImpactReport(campaignId, title, content, mediaHashes)
                                                          ↓
Admin → verifyProof(proofId) / verifyCharity(address)
```

---

## 4. Implementation Details

### 4.1 Smart Contract (CharityDonation.sol)

**Core structures:**
- `Campaign`: id, charity, title, description, category, imageHash, goalAmount, raisedAmount, withdrawnAmount, deadline, status, verified, donorCount
- `Donation`: id, campaignId, donor, amount, timestamp, message, refunded
- `ProofOfWork`: id, campaignId, submittedBy, title, description, fileHash, amountSpent, timestamp, verified
- `WithdrawalRecord`: id, campaignId, recipient, amount, purpose, timestamp, proofHash
- `ImpactReport`: id, campaignId, submittedBy, title, content, mediaHashes, timestamp

**Key functions:**
- `createCampaign`, `donate`, `withdrawFunds`, `submitProof`, `postImpactReport`
- `cancelCampaign`, `claimRefund`
- Admin: `verifyCharity`, `verifyCampaign`, `verifyProof`, `withdrawPlatformFees`

**Platform fee:** 2% (200 basis points) on each donation; configurable by admin.

### 4.2 Frontend Features

- **Landing page:** Hero, feature highlights, call-to-action
- **Campaign list:** Search, filter by category/status, sort by newest/raised/progress
- **Campaign detail:** Full info, donation form, progress bar, tabs (Fund Flow, Proofs, Impact Reports, Transactions)
- **Donor dashboard:** My donations, total donated, active campaigns, verified impacts, **real on-chain activity log**
- **Charity portal:** Create campaigns, manage campaigns, withdraw, submit proofs, post impact reports, **real on-chain activity log**
- **IPFS upload:** Direct image/document upload via Pinata; hash auto-filled on forms
- **Multi-network:** Auto-detects Hardhat or Sepolia; uses correct contract per network

### 4.3 IPFS Integration

- Pinata API for file uploads
- Campaign cover images, proof documents, withdrawal receipts, impact report media
- Gateway: `https://gateway.pinata.cloud/ipfs/{cid}` for viewing content

---

## 5. Technologies Used

| Layer | Technology | Purpose |
|-------|------------|---------|
| Blockchain | Ethereum (Hardhat local / Sepolia) | Immutable ledger |
| Smart Contracts | Solidity 0.8.20 | Business logic |
| Development | Hardhat 2.22.x | Compile, test, deploy |
| Testing | Mocha + Chai + Hardhat Network Helpers | 41 unit tests |
| Frontend | React 19 + Vite 4 | UI |
| Web3 Library | Ethers.js v6 | Blockchain interaction |
| Wallet | MetaMask | User authentication |
| Storage | Pinata (IPFS) | Images, proofs, receipts |
| Routing | React Router v6 | SPA navigation |
| Icons | Lucide React | UI icons |

---

## 6. Prerequisites

- Node.js v18+ (v20 recommended for Hardhat)
- npm 9+
- MetaMask browser extension
- Pinata account (free) for IPFS uploads
- Sepolia test ETH (from faucet) for testnet deployment

---

## 7. Installation & Setup

### Local (Hardhat)

```bash
cd charityflow-hardhat
npm install
npx hardhat compile
npx hardhat test
npx hardhat node          # Terminal 1
npx hardhat run scripts/deploy.js --network localhost   # Terminal 2
```

### Sepolia Deployment

```bash
cd charityflow-hardhat
# Add to .env: PRIVATE_KEY, ALCHEMY_API_URL (eth-sepolia)
npm run deploy:sepolia
# Frontend .env is auto-updated with contract address
```

### Frontend

```bash
cd charityflow-frontend
npm install
# Add VITE_PINATA_JWT to .env for IPFS uploads
npm run dev
```

Open http://localhost:5173. Connect MetaMask on Sepolia (or Hardhat local).

---

## 8. Smart Contract API

| Function | Access | Description |
|----------|--------|-------------|
| `createCampaign(...)` | Public | Create campaign |
| `donate(campaignId, message)` | Public (payable) | Donate ETH |
| `withdrawFunds(campaignId, amount, purpose, proofHash)` | Charity | Withdraw with proof |
| `submitProof(campaignId, title, description, fileHash, amountSpent)` | Charity | Upload proof |
| `postImpactReport(campaignId, title, content, mediaHashes)` | Charity | Post impact update |
| `cancelCampaign(campaignId)` | Charity/Admin | Cancel campaign |
| `claimRefund(donationId)` | Donor | Refund on cancelled campaign |
| `verifyCharity(address)` | Admin | Verify charity |
| `verifyCampaign(campaignId)` | Admin | Verify campaign |
| `verifyProof(proofId)` | Admin | Verify proof |
| `getCampaign(id)`, `getDonation(id)`, etc. | View | Query data |

---

## 9. User Guide

### Donor

1. Connect MetaMask (Sepolia or Hardhat).
2. Browse campaigns at `/campaigns`.
3. Click a campaign → enter amount → Donate.
4. Go to "My Donations" to see history and on-chain activity log.
5. Track fund usage via Fund Flow timeline and proof links.

### Charity

1. Connect MetaMask.
2. Go to "Charity Portal" (`/charity`).
3. Create Campaign: upload cover image (IPFS), fill details.
4. After donations: Withdraw (upload receipt to IPFS), Submit Proof, Post Impact Report.
5. View "Real On-Chain Activity" for all actions.

### Platform Admin

- Deployer address is admin. Use Hardhat console or Remix for `verifyCharity`, `verifyProof`, `withdrawPlatformFees`.

---

## 10. Testing

```bash
cd charityflow-hardhat
npx hardhat test
```

**41 unit tests** across: Deployment, Campaign Creation, Donations, Proof of Work, Withdrawals, Refunds, Impact Reports, Admin Functions, Deadline Enforcement.

---

## 11. Deployment (Sepolia)

**Contract address:** `0xE9635eEE0b6EFeB423e9B7aE789C62DB41805F1d`  
**Block:** 10439368  
**Explorer:** https://sepolia.etherscan.io/address/0xE9635eEE0b6EFeB423e9B7aE789C62DB41805F1d

---

## 12. Known Issues & Limitations

1. **MetaMask only** — No WalletConnect; mobile requires MetaMask app.
2. **No pagination** — Campaign list loads all campaigns; may be slow with many.
3. **Admin UI** — Verification actions not in UI; use console/Remix.
4. **Node version** — Some packages prefer Node 20+; app runs on Node 16–18 with warnings.

---

## 13. Future Improvements

1. The Graph subgraph for efficient event indexing
2. Multi-token donations (USDC, DAI)
3. WalletConnect for mobile
4. DAO governance for charity verification
5. Email notifications for proof verification
6. Mainnet deployment

---

## 14. Learning Outcomes Addressed

- **LO2:** Analyzed blockchain use case (charity transparency).
- **LO3:** Applied Ethereum architecture (Hardhat, Solidity, Ethers.js).
- **LO4:** Implemented smart contracts, transaction validation, events, and on-chain ledger.

---

## 15. References

- [CryptoZombies](https://cryptozombies.io)
- [Hardhat Tutorial](https://hardhat.org/tutorial)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [MetaMask Developer Docs](https://docs.metamask.io)
- [Pinata IPFS](https://pinata.cloud)
- [Sepolia Faucet](https://sepoliafaucet.com)

---

## 16. Appendix: Project Structure

```
project-blockchain/
├── charityflow-hardhat/
│   ├── contracts/CharityDonation.sol
│   ├── scripts/deploy.js
│   ├── test/CharityDonation.test.js
│   ├── hardhat.config.js
│   └── package.json
├── charityflow-frontend/
│   ├── src/
│   │   ├── components/ (Logo, Navbar, IPFSUpload, FundFlowTimeline, CampaignCard)
│   │   ├── pages/ (Landing, CampaignList, CampaignDetail, DonorDashboard, CharityDashboard)
│   │   ├── context/ (Web3Context, ThemeContext)
│   │   └── utils/ (contract.js, ipfs.js, CharityDonationABI.json)
│   ├── .env
│   └── package.json
├── README.md
├── MDT915_Project_Report.md
└── MDT915_Project_Report_Individual_Seif.md / _Jyldyz.md
```

---

*CharityFlow — Every donation, fully traceable. MDT915 Blockchain Practitioner Course.*