// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SecureContract_SWC106_Fixed - SWC-106 REMEDIATED
 * @dev Protected SELFDESTRUCT — only owner can destroy
 * @notice Group A - Lab 7 DApp Security - FIXED VERSION
 */
contract SecureContract_SWC106_Fixed is Ownable {
    uint256 public balance;

    event Deposit(address indexed sender, uint256 amount);
    event Destroyed(address indexed recipient, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        balance += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice FIXED: Only owner can destroy — proper access control
    /// @dev SWC-106 Remediation: onlyOwner modifier from OpenZeppelin
    /// @param _to Address to receive remaining ETH (typically owner or treasury)
    function destroy(address payable _to) external onlyOwner {
        require(_to != address(0), "Invalid recipient");
        emit Destroyed(_to, address(this).balance);
        selfdestruct(_to);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
