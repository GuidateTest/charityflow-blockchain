# LAB 7 — SWC-106 Group A Solution

## Deliverables

| File | Description |
|------|-------------|
| `SWC-106_GroupA_Report.html` | Full report with diagrams (open in browser) |
| `SWC-106_GroupA_Solution.md` | Markdown explanation and code samples |
| `contracts/VulnerableContract_SWC106.sol` | Vulnerable contract (no access control) |
| `contracts/SecureContract_SWC106_Fixed.sol` | Fixed contract (onlyOwner) |
| `diagrams/SWC-106_flow_diagram.svg` | Visual flow diagram |
| `diagrams/SWC-106_mermaid.md` | Mermaid diagrams for docs |

## Quick Start — Test the Contracts

### Option 1: Use charityflow-hardhat (recommended)

Contracts and deploy script are already in `charityflow-hardhat`:

```bash
cd charityflow-hardhat
npx hardhat compile
npx hardhat run scripts/deploy-swc106.js --network ganache
```

### Option 2: Standalone Hardhat project

```bash
cd LAB_7
npm init -y
npm install hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
npx hardhat init
# Copy contracts to contracts/ and configure hardhat.config.js for Ganache
```

## Add Your Diagram

To display your draw.io diagram in the report:
1. In draw.io: **File → Export as → PNG**
2. Save the file as `SWC-106_Attack_vs_Fix_Diagram.png` in the `LAB_7` folder
3. Open the report — the diagram will appear in Section 2

## View the Report

Open `SWC-106_GroupA_Report.html` in Chrome/Firefox for the full report with:
- SWC-106 definition
- Attack flow diagram
- Secure flow diagram
- Code comparison
- Remediation checklist

## Summary

- **SWC-106**: Unprotected SELFDESTRUCT — anyone can destroy the contract
- **Fix**: Add `onlyOwner` modifier (OpenZeppelin Ownable) or multisig
- **Reference**: [SWC Registry SWC-106](https://swcregistry.io/docs/SWC-106/)
