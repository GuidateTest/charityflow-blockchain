// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Vault
 * @notice A simple Ether vault demonstrating deposit and withdrawal mechanics.
 *         Used in Workshop 4 - MDT915 Blockchain Technology.
 * @author Seif Sid Ali Maloufi
 */
contract Vault {
    address public owner;

    mapping(address => uint256) public balances;

    event Deposited(address indexed sender, uint256 amount, uint256 contractBalance);
    event Withdrawn(address indexed recipient, uint256 amount, uint256 contractBalance);

    modifier onlyOwner() {
        require(msg.sender == owner, "Vault: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Deposit Ether into the vault.
     */
    function deposit() external payable {
        require(msg.value > 0, "Vault: deposit amount must be greater than zero");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, address(this).balance);
    }

    /**
     * @notice Withdraw a specified amount of Ether from the vault.
     * @param amount The amount in wei to withdraw.
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Vault: amount must be greater than zero");
        require(address(this).balance >= amount, "Vault: insufficient contract balance");
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Vault: ETH transfer failed");
        emit Withdrawn(msg.sender, amount, address(this).balance);
    }

    /**
     * @notice Returns the total ETH balance held by this contract.
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
