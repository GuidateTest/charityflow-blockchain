# SWC-106: Unprotected SELFDESTRUCT Instruction
## Group A — Lab 7 DApp Security

---

## 1. What is SWC-106?

**SWC-106** is a Smart Contract Weakness Classification that identifies **Unprotected SELFDESTRUCT Instruction** vulnerabilities.

| Attribute | Value |
|-----------|-------|
| **SWC ID** | SWC-106 |
| **Title** | Unprotected SELFDESTRUCT Instruction |
| **CWE** | CWE-284: Improper Access Control |
| **Severity** | High / Critical |

### Definition

> **Due to missing or insufficient access controls, malicious parties can self-destruct the contract.**

The `selfdestruct` (formerly `suicide`) opcode in Solidity permanently destroys a smart contract and sends all remaining ETH to a specified address. If this function is **not protected** by proper access control, **anyone** can call it and destroy the contract, causing:
- Permanent loss of contract functionality
- All ETH in the contract sent to the attacker's address
- Disruption of any DApp or system depending on the contract

---

## 2. How SELFDESTRUCT Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELFDESTRUCT(address payable recipient)       │
├─────────────────────────────────────────────────────────────────┤
│  1. Sends ALL remaining ETH in contract to recipient             │
│  2. Marks contract storage as "destroyed"                        │
│  3. Contract address becomes invalid — future calls revert       │
│  4. IRREVERSIBLE — cannot be undone                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Vulnerable Example

### 3.1 Simple Vulnerable Contract (Anyone Can Destroy)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VulnerableContract - SWC-106 VULNERABLE EXAMPLE
 * @dev NO access control on selfdestruct — ANYONE can destroy!
 */
contract VulnerableContract {
    address public owner;
    uint256 public balance;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balance += msg.value;
    }

    // ⚠️ VULNERABILITY: No modifier, no check — anyone can call!
    function destroy(address payable _to) external {
        selfdestruct(_to);  // Attacker sends ETH to themselves!
    }
}
```

**Attack scenario:** Attacker calls `destroy(attackerAddress)` → Contract destroyed, all ETH sent to attacker.

---

### 3.2 Multi-Transaction Feasible (Initialization Bypass)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SuicideMultiTxFeasible - SWC-106 VULNERABLE
 * @dev Weak "protection" — attacker calls init() first, then run()
 */
contract SuicideMultiTxFeasible {
    uint256 private initialized = 0;

    function init() public {
        initialized = 1;  // Anyone can call!
    }

    function run(uint256) public {
        if (initialized == 0) return;  // Weak check
        selfdestruct(payable(msg.sender));  // Destroy & steal ETH
    }
}
```

**Attack:** Step 1: Attacker calls `init()`. Step 2: Attacker calls `run(0)` → Contract destroyed.

---

## 4. Remediation (Fixed Examples)

### 4.1 Fix: Owner-Only Access (OpenZeppelin Ownable)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SecureContract - SWC-106 FIXED
 * @dev selfdestruct protected by onlyOwner modifier
 */
contract SecureContract is Ownable {
    uint256 public balance;

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        balance += msg.value;
    }

    // ✅ FIXED: Only owner can destroy
    function destroy(address payable _to) external onlyOwner {
        selfdestruct(_to);
    }
}
```

---

### 4.2 Fix: Multisig (Recommended for Production)

> **From SWC Registry:** *"Consider implementing a multisig scheme so that multiple parties must approve the self-destruct action."*

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SecureContractMultisig - SWC-106 FIXED (Best Practice)
 * @dev Requires ADMIN_ROLE — assign to Gnosis Safe multisig
 */
contract SecureContractMultisig is AccessControl {
    bytes32 public constant DESTROY_ROLE = keccak256("DESTROY_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DESTROY_ROLE, msg.sender);
    }

    function destroy(address payable _to) external onlyRole(DESTROY_ROLE) {
        selfdestruct(_to);
    }
}
```

---

## 5. Parity Wallet Incident (Real-World Example)

The **Parity "I accidentally killed it" bug** (2017) is a famous SWC-106-related incident:

1. A user called `initWallet()` on the Parity multi-sig library contract
2. This made them the "owner" of the library
3. They then called `kill()` which executed `selfdestruct`
4. **Result:** ~$300M in ETH frozen across hundreds of wallets

**Reference:** [Parity Postmortem](https://www.parity.io/a-postmortem-on-the-parity-multi-sig-library-self-destruct/)

---

## 6. Summary: Before vs After

| Aspect | Vulnerable (SWC-106) | Fixed |
|--------|----------------------|-------|
| Who can destroy? | Anyone | Owner / Admin / Multisig |
| Access control | None | `onlyOwner` or `onlyRole(DESTROY_ROLE)` |
| Production use | ❌ Never deploy | ✅ Safe if properly restricted |

---

## 7. Checklist for Developers

- [ ] Remove `selfdestruct` unless absolutely required
- [ ] If needed: add `onlyOwner` or role-based access
- [ ] For high-value contracts: use multisig (Gnosis Safe)
- [ ] Run Slither or Mythril to detect SWC-106
- [ ] Document the destroy function and recovery address policy
