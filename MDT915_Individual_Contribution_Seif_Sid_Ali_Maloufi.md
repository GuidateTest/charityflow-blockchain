# MDT915 — Individual Contribution Report

**Student Name:** Seif Sid Ali Maloufi  
**Student ID:** [Your ID]  
**Project:** CharityFlow — Transparent Charity Donation Platform  
**Course:** MDT915 Blockchain Practitioner  

---

## 1. My Specific Contributions

### Smart Contract Development
- Designed and implemented the `CharityDonation.sol` smart contract in Solidity 0.8.20.
- Defined core data structures: `Campaign`, `Donation`, `ProofOfWork`, `WithdrawalRecord`, `ImpactReport`.
- Implemented campaign lifecycle: creation, donation, withdrawal with proof, proof submission, impact reporting.
- Added platform fee mechanism (2%) and admin functions for charity/campaign/proof verification.
- Implemented refund logic for cancelled campaigns and deadline enforcement.

### Testing & Quality Assurance
- Wrote 41 unit tests using Mocha, Chai, and Hardhat Network Helpers.
- Covered deployment, campaign creation, donations, proofs, withdrawals, refunds, impact reports, admin functions.
- Ensured edge cases (deadlines, fee limits, access control) are tested.

### Blockchain Architecture
- Configured Hardhat for local development and Sepolia deployment.
- Set up multi-network support (chain IDs 31337 and 11155111).
- Deployed contract to Sepolia testnet and documented deployment address and block.

### Documentation
- Contributed to technical documentation and architecture diagrams.
- Documented smart contract API and data flow.

---

## 2. Time Investment

| Activity | Estimated Hours |
|----------|-----------------|
| Smart contract design & implementation | [X] |
| Unit testing | [X] |
| Hardhat configuration & deployment | [X] |
| Documentation | [X] |
| Team coordination & code review | [X] |
| **Total** | **[X]** |

---

## 3. Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| [Example: Ensuring withdrawal only after proof] | [Example: Implemented proofHash in withdrawFunds and verification flow] |
| [Your challenge] | [Your solution] |
| [Your challenge] | [Your solution] |

---

## 4. Learning Outcomes

- Gained hands-on experience with Solidity smart contract development.
- Understood gas optimization and event emission for frontend integration.
- Learned Hardhat workflow: compile, test, deploy to local and testnet.
- Applied blockchain concepts: escrow, verification, immutable ledger.

---

## 5. Team Collaboration

- [Describe how you collaborated with Jyldyz: meetings, task division, code reviews, etc.]
- [Example: Shared contract ABI and events for frontend integration; reviewed React components for correct contract calls.]

---

*Signature: _________________________  Date: _________________________*