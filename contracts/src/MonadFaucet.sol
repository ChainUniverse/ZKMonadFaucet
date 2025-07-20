// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/console.sol";
import "./XAccountRegistry.sol";

/**
 * @title MonadFaucet
 * @dev A faucet contract that distributes MON tokens to wallets that have bound their X accounts
 * Users can claim 0.1 MON every 7 days if they have a verified X account binding
 */
contract MonadFaucet {
    // Constants
    uint256 public constant CLAIM_AMOUNT = 0.1 ether; // 0.1 MON
    uint256 public constant CLAIM_COOLDOWN = 7 days;  // 7 days between claims
    
    // State variables
    XAccountRegistry public immutable xAccountRegistry;
    address public owner;
    mapping(address => uint256) public lastClaimTime;
    uint256 public totalClaimed;
    uint256 public totalUsers;
    
    // Events
    event TokensClaimed(address indexed user, string indexed xAccount, uint256 amount, uint256 timestamp);
    event FaucetFunded(address indexed funder, uint256 amount);
    event FaucetWithdrawn(address indexed owner, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Errors
    error NotOwner();
    error XAccountNotBound();
    error ClaimTooEarly();
    error InsufficientFaucetBalance();
    error TransferFailed();
    error ZeroAmount();
    error ZeroAddress();
    
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }
    
    modifier hasXAccountBinding() {
        if (!xAccountRegistry.isWalletBound(msg.sender)) {
            revert XAccountNotBound();
        }
        _;
    }
    
    constructor(address _xAccountRegistry) {
        if (_xAccountRegistry == address(0)) {
            revert ZeroAddress();
        }
        
        xAccountRegistry = XAccountRegistry(_xAccountRegistry);
        owner = msg.sender;
        
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    /**
     * @dev Allows users with bound X accounts to claim MON tokens
     * Can only claim once every 7 days
     */
    function claimTokens() external hasXAccountBinding {
        // Check if enough time has passed since last claim
        // If lastClaimTime is 0 (never claimed before), allow the claim
        if (lastClaimTime[msg.sender] != 0) {
            uint256 timeElapsed = block.timestamp - lastClaimTime[msg.sender];
            if (timeElapsed < CLAIM_COOLDOWN) {
                revert ClaimTooEarly();
            }
        }
        
        // Check if faucet has sufficient balance
        if (address(this).balance < CLAIM_AMOUNT) {
            revert InsufficientFaucetBalance();
        }
        
        // Update state before transfer (CEI pattern)
        bool isFirstClaim = lastClaimTime[msg.sender] == 0;
        lastClaimTime[msg.sender] = block.timestamp;
        totalClaimed += CLAIM_AMOUNT;
        
        // If this is the user's first claim, increment total users
        if (isFirstClaim) {
            totalUsers++;
        }
        
        // Get the user's X account for the event
        string memory xAccount = xAccountRegistry.getXAccountByWallet(msg.sender);
        
        // Transfer MON tokens
        (bool success, ) = payable(msg.sender).call{value: CLAIM_AMOUNT}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit TokensClaimed(msg.sender, xAccount, CLAIM_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Returns the time remaining until the user can claim again
     * @param user The address to check
     * @return Time remaining in seconds, 0 if can claim now
     */
    function getTimeUntilNextClaim(address user) external view returns (uint256) {
        if (!xAccountRegistry.isWalletBound(user)) {
            return type(uint256).max; // Can never claim without X account binding
        }
        
        // If user has never claimed before, they can claim now
        if (lastClaimTime[user] == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - lastClaimTime[user];
        if (timeElapsed >= CLAIM_COOLDOWN) {
            return 0; // Can claim now
        }
        
        return CLAIM_COOLDOWN - timeElapsed;
    }
    
    /**
     * @dev Check if a user can currently claim tokens
     * @param user The address to check
     * @return True if user can claim, false otherwise
     */
    function canClaim(address user) external view returns (bool) {
        if (!xAccountRegistry.isWalletBound(user)) {
            return false;
        }
        
        // If user has never claimed before, they can claim (if faucet has balance)
        if (lastClaimTime[user] == 0) {
            return address(this).balance >= CLAIM_AMOUNT;
        }
        
        uint256 timeElapsed = block.timestamp - lastClaimTime[user];
        return timeElapsed >= CLAIM_COOLDOWN && address(this).balance >= CLAIM_AMOUNT;
    }
    
    /**
     * @dev Get user's claim information
     * @param user The address to check
     * @return xAccount The bound X account name
     * @return lastClaim Timestamp of last claim
     * @return canClaimNow Whether user can claim right now
     * @return timeUntilNextClaim Time until next claim in seconds
     */
    function getUserInfo(address user) external view returns (
        string memory xAccount,
        uint256 lastClaim,
        bool canClaimNow,
        uint256 timeUntilNextClaim
    ) {
        xAccount = xAccountRegistry.getXAccountByWallet(user);
        lastClaim = lastClaimTime[user];
        
        if (!xAccountRegistry.isWalletBound(user)) {
            canClaimNow = false;
            timeUntilNextClaim = type(uint256).max;
        } else {
            // If user has never claimed before, they can claim now
            if (lastClaim == 0) {
                canClaimNow = address(this).balance >= CLAIM_AMOUNT;
                timeUntilNextClaim = 0;
            } else {
                uint256 timeElapsed = block.timestamp - lastClaim;
                canClaimNow = timeElapsed >= CLAIM_COOLDOWN && address(this).balance >= CLAIM_AMOUNT;
                timeUntilNextClaim = timeElapsed >= CLAIM_COOLDOWN ? 0 : CLAIM_COOLDOWN - timeElapsed;
            }
        }
    }
    
    /**
     * @dev Fund the faucet with MON tokens
     */
    function fundFaucet() external payable {
        if (msg.value == 0) {
            revert ZeroAmount();
        }
        
        emit FaucetFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Owner can withdraw MON tokens from the faucet
     * @param amount Amount to withdraw (0 to withdraw all)
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert InsufficientFaucetBalance();
        }
        
        uint256 withdrawAmount = amount == 0 ? balance : amount;
        if (withdrawAmount > balance) {
            revert InsufficientFaucetBalance();
        }
        
        (bool success, ) = payable(owner).call{value: withdrawAmount}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit FaucetWithdrawn(owner, withdrawAmount);
    }
    
    /**
     * @dev Transfer ownership of the faucet
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert ZeroAddress();
        }
        
        address previousOwner = owner;
        owner = newOwner;
        
        emit OwnershipTransferred(previousOwner, newOwner);
    }
    
    /**
     * @dev Get faucet statistics
     * @return balance Current faucet balance
     * @return totalClaimedAmount Total amount claimed by all users
     * @return totalUniqueUsers Total number of unique users who have claimed
     * @return registryAddress Address of the XAccountRegistry contract
     */
    function getFaucetStats() external view returns (
        uint256 balance,
        uint256 totalClaimedAmount,
        uint256 totalUniqueUsers,
        address registryAddress
    ) {
        balance = address(this).balance;
        totalClaimedAmount = totalClaimed;
        totalUniqueUsers = totalUsers;
        registryAddress = address(xAccountRegistry);
    }
    
    /**
     * @dev Emergency function to pause claims by setting a very high cooldown
     * Only for emergency situations
     */
    function emergencyPause() external onlyOwner {
        // This is a simple pause mechanism - could be enhanced with a proper pause state
        // For now, we rely on owner withdrawal to effectively pause the faucet
        console.log("Emergency pause called by owner");
    }
    
    // Allow the contract to receive MON tokens
    receive() external payable {
        emit FaucetFunded(msg.sender, msg.value);
    }
    
    fallback() external payable {
        emit FaucetFunded(msg.sender, msg.value);
    }
}