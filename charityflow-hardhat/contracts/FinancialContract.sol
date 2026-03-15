// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FinancialContract
 * @dev Simple DApp contract for MDT915 Workshop 5 - deposit, withdraw, getBalance
 */
contract FinancialContract {
    address public owner;
    mapping(address => uint256) public balances;

    event Deposit(address indexed depositor, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can withdraw");
        _;
    }

    modifier hasBalance(uint256 amount) {
        require(address(this).balance >= amount, "Insufficient contract balance");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Payable function - user sends ETH to the contract
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Owner-only - transfers ETH from contract to owner
    function withdraw(uint256 amount) external onlyOwner hasBalance(amount) {
        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawal(owner, amount);
    }

    /// @notice View function - reads contract balance (no transaction)
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get user's deposited balance
    function getUserBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}
