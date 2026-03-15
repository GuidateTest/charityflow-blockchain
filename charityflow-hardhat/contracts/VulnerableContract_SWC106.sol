// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VulnerableContract - SWC-106 VULNERABLE EXAMPLE
 * @dev Unprotected SELFDESTRUCT — ANYONE can destroy the contract and steal ETH
 * @notice Group A - Lab 7 DApp Security
 */
contract VulnerableContract_SWC106 {
    address public owner;
    uint256 public balance;

    event Deposit(address indexed sender, uint256 amount);
    event Destroyed(address indexed recipient, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        balance += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice VULNERABILITY: No access control — anyone can call!
    /// @dev SWC-106: Unprotected SELFDESTRUCT Instruction
    /// @param _to Address to receive all contract ETH (attacker can use their own!)
    function destroy(address payable _to) external {
        // ⚠️ CRITICAL: No require(msg.sender == owner) or modifier
        // Attacker calls destroy(attackerAddress) → steals all ETH
        emit Destroyed(_to, address(this).balance);
        selfdestruct(_to);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
