// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MonadFaucet.sol";
import "../src/XAccountRegistry.sol";
import { AttNetworkRequest, AttNetworkResponseResolve, Attestor, Attestation } from "../lib/zktls-contracts/src/IPrimusZKTLS.sol";

contract MockXAccountRegistry {
    mapping(address => bool) public walletBound;
    mapping(address => string) public walletToXAccount;
    
    function setWalletBound(address wallet, bool bound, string memory xAccount) external {
        walletBound[wallet] = bound;
        if (bound) {
            walletToXAccount[wallet] = xAccount;
        } else {
            delete walletToXAccount[wallet];
        }
    }
    
    function isWalletBound(address wallet) external view returns (bool) {
        return walletBound[wallet];
    }
    
    function getXAccountByWallet(address wallet) external view returns (string memory) {
        return walletToXAccount[wallet];
    }
}

contract MonadFaucetTest is Test {
    MonadFaucet public faucet;
    MockXAccountRegistry public mockRegistry;
    
    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public unboundUser = makeAddr("unboundUser");
    
    uint256 constant CLAIM_AMOUNT = 0.1 ether;
    uint256 constant CLAIM_COOLDOWN = 7 days;
    uint256 constant INITIAL_FUNDING = 10 ether;
    
    event TokensClaimed(address indexed user, string indexed xAccount, uint256 amount, uint256 timestamp);
    event FaucetFunded(address indexed funder, uint256 amount);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock registry
        mockRegistry = new MockXAccountRegistry();
        
        // Deploy faucet
        faucet = new MonadFaucet(address(mockRegistry));
        
        // Fund the faucet
        vm.deal(owner, INITIAL_FUNDING);
        (bool success, ) = address(faucet).call{value: INITIAL_FUNDING}("");
        require(success, "Failed to fund faucet");
        
        vm.stopPrank();
        
        // Set up bound users
        mockRegistry.setWalletBound(user1, true, "testuser1");
        mockRegistry.setWalletBound(user2, true, "testuser2");
        // unboundUser is not bound to any X account
    }
    
    function testInitialState() public {
        assertEq(faucet.owner(), owner);
        assertEq(address(faucet.xAccountRegistry()), address(mockRegistry));
        assertEq(faucet.CLAIM_AMOUNT(), CLAIM_AMOUNT);
        assertEq(faucet.CLAIM_COOLDOWN(), CLAIM_COOLDOWN);
        assertEq(address(faucet).balance, INITIAL_FUNDING);
        assertEq(faucet.totalClaimed(), 0);
        assertEq(faucet.totalUsers(), 0);
    }
    
    function testClaimTokens() public {
        uint256 initialBalance = user1.balance;
        
        vm.expectEmit(true, true, false, true);
        emit TokensClaimed(user1, "testuser1", CLAIM_AMOUNT, block.timestamp);
        
        vm.startPrank(user1);
        faucet.claimTokens();
        vm.stopPrank();
        
        assertEq(user1.balance, initialBalance + CLAIM_AMOUNT);
        assertEq(faucet.lastClaimTime(user1), block.timestamp);
        assertEq(faucet.totalClaimed(), CLAIM_AMOUNT);
        assertEq(faucet.totalUsers(), 1);
    }
    
    function testCannotClaimWithoutXAccount() public {
        vm.startPrank(unboundUser);
        vm.expectRevert(MonadFaucet.XAccountNotBound.selector);
        faucet.claimTokens();
        vm.stopPrank();
    }
    
    function testCannotClaimTooEarly() public {
        // First claim
        vm.startPrank(user1);
        faucet.claimTokens();
        
        // Try to claim again immediately
        vm.expectRevert(MonadFaucet.ClaimTooEarly.selector);
        faucet.claimTokens();
        vm.stopPrank();
        
        // Fast forward 6 days (not enough)
        vm.warp(block.timestamp + 6 days);
        
        vm.startPrank(user1);
        vm.expectRevert(MonadFaucet.ClaimTooEarly.selector);
        faucet.claimTokens();
        vm.stopPrank();
        
        // Fast forward to exactly 7 days
        vm.warp(block.timestamp + 1 days);
        
        vm.startPrank(user1);
        faucet.claimTokens(); // Should succeed
        vm.stopPrank();
    }
    
    function testInsufficientFaucetBalance() public {
        // Drain the faucet
        vm.startPrank(owner);
        faucet.withdrawFunds(0); // Withdraw all
        vm.stopPrank();
        
        // Try to claim with empty faucet
        vm.startPrank(user1);
        vm.expectRevert(MonadFaucet.InsufficientFaucetBalance.selector);
        faucet.claimTokens();
        vm.stopPrank();
    }
    
    function testGetTimeUntilNextClaim() public {
        // Before any claim
        assertEq(faucet.getTimeUntilNextClaim(user1), 0);
        
        // After claiming
        vm.startPrank(user1);
        faucet.claimTokens();
        vm.stopPrank();
        
        assertEq(faucet.getTimeUntilNextClaim(user1), CLAIM_COOLDOWN);
        
        // After some time
        vm.warp(block.timestamp + 3 days);
        assertEq(faucet.getTimeUntilNextClaim(user1), CLAIM_COOLDOWN - 3 days);
        
        // After cooldown period
        vm.warp(block.timestamp + 4 days);
        assertEq(faucet.getTimeUntilNextClaim(user1), 0);
        
        // Unbound user
        assertEq(faucet.getTimeUntilNextClaim(unboundUser), type(uint256).max);
    }
    
    function testCanClaim() public {
        // Bound user can claim initially
        assertTrue(faucet.canClaim(user1));
        
        // After claiming, cannot claim immediately
        vm.startPrank(user1);
        faucet.claimTokens();
        vm.stopPrank();
        
        assertFalse(faucet.canClaim(user1));
        
        // After cooldown, can claim again
        vm.warp(block.timestamp + CLAIM_COOLDOWN);
        assertTrue(faucet.canClaim(user1));
        
        // Unbound user cannot claim
        assertFalse(faucet.canClaim(unboundUser));
    }
    
    function testGetUserInfo() public {
        (string memory xAccount, uint256 lastClaim, bool canClaimNow, uint256 timeUntilNext) = 
            faucet.getUserInfo(user1);
        
        assertEq(xAccount, "testuser1");
        assertEq(lastClaim, 0);
        assertTrue(canClaimNow);
        assertEq(timeUntilNext, 0);
        
        // After claiming
        vm.startPrank(user1);
        faucet.claimTokens();
        vm.stopPrank();
        
        (xAccount, lastClaim, canClaimNow, timeUntilNext) = faucet.getUserInfo(user1);
        assertEq(xAccount, "testuser1");
        assertEq(lastClaim, block.timestamp);
        assertFalse(canClaimNow);
        assertEq(timeUntilNext, CLAIM_COOLDOWN);
    }
    
    function testFundFaucet() public {
        uint256 fundAmount = 5 ether;
        uint256 initialBalance = address(faucet).balance;
        
        vm.expectEmit(true, false, false, true);
        emit FaucetFunded(user1, fundAmount);
        
        vm.deal(user1, fundAmount);
        vm.startPrank(user1);
        faucet.fundFaucet{value: fundAmount}();
        vm.stopPrank();
        
        assertEq(address(faucet).balance, initialBalance + fundAmount);
    }
    
    function testWithdrawFunds() public {
        uint256 initialOwnerBalance = owner.balance;
        uint256 withdrawAmount = 2 ether;
        
        vm.startPrank(owner);
        faucet.withdrawFunds(withdrawAmount);
        vm.stopPrank();
        
        assertEq(owner.balance, initialOwnerBalance + withdrawAmount);
        assertEq(address(faucet).balance, INITIAL_FUNDING - withdrawAmount);
    }
    
    function testWithdrawAllFunds() public {
        uint256 initialOwnerBalance = owner.balance;
        
        vm.startPrank(owner);
        faucet.withdrawFunds(0); // Withdraw all
        vm.stopPrank();
        
        assertEq(owner.balance, initialOwnerBalance + INITIAL_FUNDING);
        assertEq(address(faucet).balance, 0);
    }
    
    function testOnlyOwnerFunctions() public {
        vm.startPrank(user1);
        
        vm.expectRevert(MonadFaucet.NotOwner.selector);
        faucet.withdrawFunds(1 ether);
        
        vm.expectRevert(MonadFaucet.NotOwner.selector);
        faucet.transferOwnership(user1);
        
        vm.expectRevert(MonadFaucet.NotOwner.selector);
        faucet.emergencyPause();
        
        vm.stopPrank();
    }
    
    function testTransferOwnership() public {
        vm.startPrank(owner);
        faucet.transferOwnership(user1);
        vm.stopPrank();
        
        assertEq(faucet.owner(), user1);
        
        // New owner can withdraw
        vm.startPrank(user1);
        faucet.withdrawFunds(1 ether);
        vm.stopPrank();
    }
    
    function testGetFaucetStats() public {
        (uint256 balance, uint256 totalClaimedAmount, uint256 totalUniqueUsers, address registryAddress) = 
            faucet.getFaucetStats();
        
        assertEq(balance, INITIAL_FUNDING);
        assertEq(totalClaimedAmount, 0);
        assertEq(totalUniqueUsers, 0);
        assertEq(registryAddress, address(mockRegistry));
        
        // After some claims
        vm.startPrank(user1);
        faucet.claimTokens();
        vm.stopPrank();
        
        vm.startPrank(user2);
        faucet.claimTokens();
        vm.stopPrank();
        
        (balance, totalClaimedAmount, totalUniqueUsers, registryAddress) = 
            faucet.getFaucetStats();
        
        assertEq(balance, INITIAL_FUNDING - (CLAIM_AMOUNT * 2));
        assertEq(totalClaimedAmount, CLAIM_AMOUNT * 2);
        assertEq(totalUniqueUsers, 2);
    }
    
    function testReceiveFunction() public {
        uint256 sendAmount = 1 ether;
        uint256 initialBalance = address(faucet).balance;
        
        vm.expectEmit(true, false, false, true);
        emit FaucetFunded(user1, sendAmount);
        
        vm.deal(user1, sendAmount);
        vm.startPrank(user1);
        (bool success, ) = address(faucet).call{value: sendAmount}("");
        require(success, "Send failed");
        vm.stopPrank();
        
        assertEq(address(faucet).balance, initialBalance + sendAmount);
    }
}