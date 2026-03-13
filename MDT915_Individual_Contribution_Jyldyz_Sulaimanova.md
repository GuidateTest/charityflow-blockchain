# MDT915 — Individual Contribution Report

**Student Name:** Jyldyz Sulaimanova  
**Student ID:** [Your ID]  
**Project:** CharityFlow — Transparent Charity Donation Platform  
**Course:** MDT915 Blockchain Practitioner  

---

## 1. My Specific Contributions

### Frontend Development
- Built the React application using Vite, React Router, and Ethers.js v6.
- Implemented pages: Landing, Campaign List, Campaign Detail, Donor Dashboard, Charity Portal.
- Created reusable components: Navbar, CampaignCard, FundFlowTimeline, IPFSUpload.
- Integrated Web3Context for MetaMask connection and contract interaction.

### Web3 Integration
- Connected frontend to `CharityDonation` smart contract via Ethers.js.
- Implemented multi-network support (Hardhat local + Sepolia) with correct contract addresses per chain.
- Added real on-chain activity feeds in Donor and Charity dashboards using contract events.
- Implemented network switch UI when user is on wrong network.

### IPFS Integration
- Integrated Pinata API for direct file uploads (images, proofs, receipts).
- Created `IPFSUpload` component for single and multiple file uploads.
- Wired IPFS uploads into campaign creation, proof submission, withdrawal receipts, and impact reports.
- Displayed IPFS content via gateway URLs in campaign cards and detail views.

### UI/UX
- Designed responsive layout with dark/light theme support.
- Implemented search, filter, and sort for campaigns.
- Added progress bars, donation forms, and fund flow timelines.
- Ensured consistent styling and accessibility.

### Documentation
- Contributed to README and user guide.
- Documented environment setup (frontend .env, Pinata, Sepolia).

---

## 2. Time Investment

| Activity | Estimated Hours |
|----------|-----------------|
| Frontend structure & pages | [X] |
| Web3/Ethers.js integration | [X] |
| IPFS/Pinata integration | [X] |
| UI/UX design & styling | [X] |
| Testing & debugging | [X] |
| Documentation | [X] |
| **Total** | **[X]** |

---

## 3. Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| [Example: Contract address per network] | [Example: Created CONTRACT_BY_CHAIN map and passed chainId to getContract] |
| [Your challenge] | [Your solution] |
| [Your challenge] | [Your solution] |

---

## 4. Learning Outcomes

- Learned Ethers.js v6 for connecting React to Ethereum.
- Understood MetaMask provider, signer, and transaction flow.
- Gained experience with IPFS and Pinata for decentralized storage.
- Applied React patterns: context, hooks, async state management.

---

## 5. Team Collaboration

- [Describe how you collaborated with Seif: meetings, task division, integration points, etc.]
- [Example: Used contract ABI and events provided by Seif; coordinated on campaign data structure for UI display.]

---

*Signature: _________________________  Date: _________________________*