# CharityFlow — Transparent Charity Donation Platform

**MDT915 Blockchain Implementation Project**

CharityFlow is a decentralized application (DApp) built on Ethereum that enables donors to track exactly how their charitable donations are used. Every donation, withdrawal, and proof of work is recorded immutably on the blockchain — making charity fully transparent for the first time.

> **Full academic report:** See [MDT915_Project_Report.md](./MDT915_Project_Report.md) or open [MDT915_Project_Report.html](./MDT915_Project_Report.html) in a browser and **Print → Save as PDF** for a submission-ready PDF with UOWD logo.

---

## Team Members

| Name | Student ID | Role |
|------|------------|------|
| Seif Sid Ali Maloufi | [Your ID] | Developer (Smart Contracts, Frontend, Web3, IPFS) |
| Jyldyz Sulaimanova | [Your ID] | Report & Theory (Documentation, Research, Academic Writing) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CharityFlow DApp                        │
├─────────────────┬───────────────────────────────────────────┤
│  Frontend Layer │  React + Vite + Ethers.js                  │
│                 │  Pages: Landing, Campaigns, Detail,         │
│                 │         Donor Dashboard, Charity Portal     │
├─────────────────┼───────────────────────────────────────────┤
│  Web3 Layer     │  Ethers.js v6 + MetaMask                   │
│                 │  BrowserProvider → Signer → Contract        │
├─────────────────┼───────────────────────────────────────────┤
│  Smart Contract │  CharityDonation.sol (Solidity 0.8.20)     │
│                 │  Hardhat local / Sepolia testnet            │
├─────────────────┼───────────────────────────────────────────┤
│  Storage        │  IPFS (Pinata) — images, proofs, receipts  │
├─────────────────┼───────────────────────────────────────────┤
│  Blockchain     │  Hardhat (31337) / Sepolia (11155111)      │
└─────────────────┴───────────────────────────────────────────┘
```

### Data Flow

```
Donor → MetaMask → CharityDonation Contract → Campaign Wallet
                                            ↓
                              Charity withdraws (with proof)
                                            ↓
                              Platform admin verifies proof
                                            ↓
                              Impact report posted on-chain
```

---

## Technologies Used

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Blockchain | Ethereum (Hardhat local/Sepolia) | Immutable ledger |
| Smart Contracts | Solidity 0.8.20 | Business logic |
| Development | Hardhat 2.22.x | Compile, test, deploy |
| Testing | Mocha + Chai + Hardhat Network Helpers | 41 unit tests |
| Frontend | React 18 + Vite 4 | UI |
| Web3 Library | Ethers.js v6 | Blockchain interaction |
| Wallet | MetaMask | User authentication |
| Storage | Pinata (IPFS) | Images, proofs, receipts |
| Routing | React Router v6 | SPA navigation |
| Icons | Lucide React | UI icons |
| Fonts | Inter + JetBrains Mono | Typography |

---

## Prerequisites

- **Node.js** v18+ (v20 recommended for Hardhat)
- **npm** 9.x or later
- **MetaMask** browser extension installed
- **Pinata account** (free) for IPFS uploads
- **Sepolia test ETH** (from faucet) for testnet deployment

---

## Installation & Setup

### Step 1 — Clone / Navigate to the project

```bash
cd "c:\Users\Anigma PC\Desktop\project-blockchain"
```

### Step 2 — Set up the Hardhat (backend) project

```bash
cd charityflow-hardhat
npm install
```

### Step 3 — Compile the smart contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully (evm target: paris).
```

### Step 4 — Run the smart contract tests

```bash
npx hardhat test
```

Expected output: **41 passing**

### Step 5 — Start the local Hardhat blockchain node

Open a **new terminal** and run:

```bash
cd charityflow-hardhat
npx hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded test accounts.

Keep this terminal running.

### Step 6 — Deploy the contract

In another terminal:

```bash
cd charityflow-hardhat
npx hardhat run scripts/deploy.js --network localhost
```

This will:
1. Deploy the `CharityDonation` contract
2. Seed 4 demo campaigns with donations, proofs, and impact reports
3. Print the **contract address**

Copy the contract address printed in the output.

### Step 7 — Configure the frontend

```bash
cd ../charityflow-frontend
```

Edit `.env` and paste your contract address:

```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

(The default address works if this is your first deployment on a fresh Hardhat node.)

### Step 8 — Install and start the frontend

```bash
npm install
npm run dev
```

Open your browser at: **http://localhost:5173**

### Step 9 — Connect MetaMask to Hardhat

1. Open MetaMask
2. Add a custom network:
   - Network name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency symbol: `ETH`
3. Import a test account using one of the private keys printed by `npx hardhat node`

### Sepolia Deployment (Testnet)

1. Add to `charityflow-hardhat/.env`:
   ```env
   PRIVATE_KEY=your_metamask_private_key
   ALCHEMY_API_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   ```
2. Get Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com)
3. Deploy:
   ```bash
   cd charityflow-hardhat
   npm run deploy:sepolia
   ```
4. The deploy script auto-updates `charityflow-frontend/.env` with the contract address.
5. Add `VITE_PINATA_JWT` to frontend `.env` for IPFS uploads.
6. Connect MetaMask to Sepolia and use the app.

**Live Sepolia contract:** `0xE9635eEE0b6EFeB423e9B7aE789C62DB41805F1d`  
**Explorer:** [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xE9635eEE0b6EFeB423e9B7aE789C62DB41805F1d)

---

## Smart Contract Functions

### `CharityDonation.sol`

#### Campaign Management

| Function | Access | Description |
|----------|--------|-------------|
| `createCampaign(title, description, category, imageHash, goalAmount, durationDays)` | Public | Create a new donation campaign |
| `cancelCampaign(campaignId)` | Charity or Admin | Cancel campaign and enable refunds |

#### Donations

| Function | Access | Description |
|----------|--------|-------------|
| `donate(campaignId, message)` | Public (payable) | Donate ETH to a campaign (2% fee deducted) |
| `claimRefund(donationId)` | Donor | Claim refund on cancelled campaign |

#### Transparency Functions

| Function | Access | Description |
|----------|--------|-------------|
| `withdrawFunds(campaignId, amount, purpose, proofHash)` | Charity | Withdraw with mandatory purpose declaration |
| `submitProof(campaignId, title, description, fileHash, amountSpent)` | Charity | Upload proof of work (IPFS hash) |
| `postImpactReport(campaignId, title, content, mediaHashes)` | Charity | Post impact update |

#### Admin Functions

| Function | Access | Description |
|----------|--------|-------------|
| `verifyCharity(address)` | Admin | Mark a charity as verified |
| `verifyCampaign(campaignId)` | Admin | Mark campaign as verified |
| `verifyProof(proofId)` | Admin | Verify a submitted proof |
| `withdrawPlatformFees()` | Admin | Collect accumulated platform fees |
| `updateFeePercent(newFee)` | Admin | Update platform fee (max 10%) |
| `transferAdmin(newAdmin)` | Admin | Transfer admin role |

#### Query Functions

| Function | Description |
|----------|-------------|
| `getCampaign(id)` | Get full campaign details |
| `getTotalCampaigns()` | Get total number of campaigns |
| `getDonorDonations(address)` | Get all donation IDs for a donor |
| `getCampaignDonations(id)` | Get all donation IDs for a campaign |
| `getCampaignProofs(id)` | Get all proof IDs for a campaign |
| `getCampaignWithdrawals(id)` | Get all withdrawal IDs for a campaign |
| `getCampaignReports(id)` | Get all impact report IDs for a campaign |
| `getCharityCampaigns(address)` | Get all campaign IDs for a charity |
| `getCampaignBalance(id)` | Get available (unspent) balance |

---

## User Guide

### Donor

1. Connect MetaMask (Hardhat local or Sepolia)
2. Browse campaigns at `/campaigns`
3. Click a campaign to view details
4. Enter ETH amount and click "Donate"
5. Confirm in MetaMask
6. Go to "My Donations" to track fund usage via the Fund Flow timeline

### Charity

1. Connect MetaMask
2. Navigate to "Charity Portal" (`/charity`)
3. Click "Create Campaign" — fill in title, description, category, goal, duration
4. After receiving donations, click your campaign and:
   - **Withdraw Funds**: Declare purpose + IPFS receipt hash
   - **Submit Proof**: Upload evidence (photo/invoice/receipt IPFS hash)
   - **Impact Report**: Post updates on outcomes

### Platform Admin

- Admin wallet is the deployer address (first Hardhat account by default)
- Use Remix IDE or Hardhat console to call admin functions
- Verify charities: `verifyCharity(charityAddress)`
- Verify proofs: `verifyProof(proofId)`

---

## Testing Instructions

```bash
cd charityflow-hardhat

# Run all tests
npx hardhat test

# Run with gas report
npx hardhat test --reporter gas

# Run specific test suite
npx hardhat test --grep "Donations"
```

### Test Coverage

| Test Suite | Tests | Description |
|-----------|-------|-------------|
| Deployment | 3 | Contract initialization, admin, fee |
| Campaign Creation | 5 | Creation, validation, edge cases |
| Donations | 7 | Donations, fees, auto-complete, access control |
| Proof of Work | 5 | Submission, verification, access control |
| Withdrawals | 5 | Withdrawals, balance checks, transparency |
| Refunds | 4 | Refund flow, double-refund protection |
| Impact Reports | 2 | Report creation, access control |
| Admin Functions | 7 | All admin operations |
| Deadline Enforcement | 1 | Expired campaign rejection |
| **Total** | **41** | All passing |

---

## Project Structure

```
project-blockchain/
├── charityflow-hardhat/          # Blockchain backend
│   ├── contracts/
│   │   └── CharityDonation.sol   # Main smart contract
│   ├── scripts/
│   │   └── deploy.js             # Deployment + seed script
│   ├── test/
│   │   └── CharityDonation.test.js  # 41 unit tests
│   ├── hardhat.config.js         # Hardhat configuration
│   └── package.json
│
├── charityflow-frontend/         # React frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Logo.jsx          # SVG logo (icon + wordmark)
│   │   │   ├── Navbar.jsx        # Navigation + wallet connect
│   │   │   └── FundFlowTimeline.jsx  # Transparency flow UI
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Home / hero page
│   │   │   ├── CampaignList.jsx  # Browse + filter campaigns
│   │   │   ├── CampaignDetail.jsx  # Campaign + donation module
│   │   │   ├── DonorDashboard.jsx  # Donor history + tracking
│   │   │   └── CharityDashboard.jsx  # Charity management portal
│   │   ├── context/
│   │   │   ├── Web3Context.jsx   # Wallet + contract state
│   │   │   └── ThemeContext.jsx  # Light/dark mode
│   │   └── utils/
│   │       ├── contract.js       # Contract helpers, multi-network
│   │       ├── ipfs.js           # Pinata upload + gateway URLs
│   │       └── CharityDonationABI.json  # ABI from compilation
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── logo.png                      # Project logo
└── README.md                     # This file
```

---

## Known Issues / Limitations

1. **MetaMask only** — No WalletConnect; mobile requires MetaMask app.
2. **No pagination** — Campaign list loads all campaigns. For large-scale use, implement on-chain pagination or subgraph indexing with The Graph.
3. **Admin functions UI** — Admin verification actions are not exposed in the UI (must use Hardhat console or Remix IDE directly).
4. **Node version** — Some packages prefer Node 20+; app runs on Node 16–18 with warnings.

---

## Future Improvements

1. **The Graph indexing** — Use a subgraph for efficient event-based querying instead of looping through all campaigns
3. **Multi-token donations** — Accept ERC-20 tokens (USDC, DAI) in addition to ETH
4. **DAO governance** — Allow token holders to vote on which charities get verified
5. **Automated verification oracle** — Use Chainlink oracles to automate proof verification
6. **Mobile app** — React Native version with WalletConnect for mobile donors
7. **Mainnet deployment** — Production deployment with public block explorer links
8. **Email notifications** — Off-chain notification service when proofs are verified or impact reports posted

---

## Technical Resources Used

- Ethereum/Solidity: [CryptoZombies](https://cryptozombies.io)
- Hardhat: [Official Hardhat Tutorial](https://hardhat.org/tutorial)
- Ethers.js: [Ethers.js Documentation](https://docs.ethers.org/v6/)
- OpenZeppelin patterns referenced for modifier and access control design
- React: [React Documentation](https://react.dev)
- MetaMask: [MetaMask Developer Docs](https://docs.metamask.io)

---

## License

MIT License — Open source for educational purposes.

---

*CharityFlow — Every donation, fully traceable. Built for MDT915 Blockchain Practitioner Course.*
