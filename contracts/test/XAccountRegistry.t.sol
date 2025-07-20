// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/XAccountRegistry.sol";
import { AttNetworkRequest, AttNetworkResponseResolve, Attestor } from "../lib/zktls-contracts/src/IPrimusZKTLS.sol";

contract MockPrimusZKTLS {
    bool public shouldReturnTrue;
    
    constructor(bool _shouldReturnTrue) {
        shouldReturnTrue = _shouldReturnTrue;
    }
    
    function verifyAttestation(Attestation calldata) external view {
        require(shouldReturnTrue, "Mock verification failed");
    }
    
    function setShouldReturnTrue(bool _shouldReturnTrue) external {
        shouldReturnTrue = _shouldReturnTrue;
    }
}

contract TestableXAccountRegistry is XAccountRegistry {
    address public mockVerifier;
    
    constructor(address _mockVerifier) {
        mockVerifier = _mockVerifier;
    }
    
    function verifyAttestation(Attestation calldata attestation) internal view override returns (bool) {
        try MockPrimusZKTLS(mockVerifier).verifyAttestation(attestation) {
            return true;
        } catch {
            return false;
        }
    }
}

contract XAccountRegistryTest is Test {
    TestableXAccountRegistry public registry;
    MockPrimusZKTLS public mockPrimus;
    
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    
    Attestation validAttestation;
    
    function setUp() public {
        mockPrimus = new MockPrimusZKTLS(true);
        registry = new TestableXAccountRegistry(address(mockPrimus));
        
        // Setup a valid attestation with the new structure
        AttNetworkRequest memory request = AttNetworkRequest({
            url: "https://x.com/settings/profile",
            header: "{}",
            method: "GET",
            body: ""
        });
        
        AttNetworkResponseResolve[] memory resolves = new AttNetworkResponseResolve[](1);
        resolves[0] = AttNetworkResponseResolve({
            keyName: "screen_name",
            parseType: "JSON",
            parsePath: "$.screen_name"
        });
        
        Attestor[] memory attestors = new Attestor[](1);
        attestors[0] = Attestor({
            attestorAddr: address(0x1),
            url: "https://primus.xyz"
        });
        
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = "0x";
        
        validAttestation = Attestation({
            recipient: user1,
            request: request,
            reponseResolve: resolves,
            data: '{"screen_name": "testuser"}',
            attConditions: "{}",
            timestamp: uint64(block.timestamp),
            additionParams: "{}",
            attestors: attestors,
            signatures: signatures
        });
    }
    
    function testBindXAccount() public {
        vm.startPrank(user1);
        
        registry.bindXAccount(validAttestation, "testuser");
        
        assertEq(registry.getXAccountByWallet(user1), "testuser");
        assertEq(registry.getWalletByXAccount("testuser"), user1);
        assertTrue(registry.isWalletBound(user1));
        assertTrue(registry.isXAccountBound("testuser"));
        
        vm.stopPrank();
    }
    
    function testCannotBindEmptyXAccount() public {
        vm.startPrank(user1);
        
        vm.expectRevert(XAccountRegistry.EmptyXAccount.selector);
        registry.bindXAccount(validAttestation, "");
        
        vm.stopPrank();
    }
    
    function testCannotBindSameWalletTwice() public {
        vm.startPrank(user1);
        
        registry.bindXAccount(validAttestation, "testuser");
        
        vm.expectRevert(XAccountRegistry.WalletAlreadyBound.selector);
        registry.bindXAccount(validAttestation, "testuser2");
        
        vm.stopPrank();
    }
    
    function testCannotBindSameXAccountTwice() public {
        vm.startPrank(user1);
        registry.bindXAccount(validAttestation, "testuser");
        vm.stopPrank();
        
        vm.startPrank(user2);
        vm.expectRevert(XAccountRegistry.XAccountAlreadyBound.selector);
        registry.bindXAccount(validAttestation, "testuser");
        vm.stopPrank();
    }
    
    function testUnbindXAccount() public {
        vm.startPrank(user1);
        
        registry.bindXAccount(validAttestation, "testuser");
        registry.unbindXAccount();
        
        assertEq(registry.getXAccountByWallet(user1), "");
        assertEq(registry.getWalletByXAccount("testuser"), address(0));
        assertFalse(registry.isWalletBound(user1));
        assertFalse(registry.isXAccountBound("testuser"));
        
        vm.stopPrank();
    }
    
    function testCannotUnbindNonBoundWallet() public {
        vm.startPrank(user1);
        
        vm.expectRevert(XAccountRegistry.NotOwner.selector);
        registry.unbindXAccount();
        
        vm.stopPrank();
    }
}