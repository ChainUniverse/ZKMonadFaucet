// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/console.sol";
import { IPrimusZKTLS, Attestation } from "../lib/zktls-contracts/src/IPrimusZKTLS.sol";

contract XAccountRegistry {
    IPrimusZKTLS public constant PRIMUS_VERIFIER = IPrimusZKTLS(0x1Ad7fD53206fDc3979C672C0466A1c48AF47B431);
    
    mapping(address => string) public walletToXAccount;
    mapping(string => address) public xAccountToWallet;
    
    event XAccountBound(address indexed wallet, string indexed xAccount, uint256 timestamp);
    event XAccountUnbound(address indexed wallet, string indexed xAccount, uint256 timestamp);
    
    error InvalidAttestation();
    error XAccountAlreadyBound();
    error WalletAlreadyBound();
    error NotOwner();
    error EmptyXAccount();
    
    modifier onlyValidAttestation(Attestation calldata attestation) {
        if (!verifyAttestation(attestation)) {
            revert InvalidAttestation();
        }
        _;
    }
    
    function verifyAttestation(Attestation calldata attestation) internal view virtual returns (bool) {
        try PRIMUS_VERIFIER.verifyAttestation(attestation) {
            return true;
        } catch {
            return false;
        }
    }
    
    function _verifyXAccountInAttestation(string memory attestationData, string memory xAccount) internal pure returns (bool) {
        bytes memory data = bytes(attestationData);
        bytes memory accountBytes = bytes(xAccount);
        
        if (data.length == 0 || accountBytes.length == 0) {
            return false;
        }
        
        // Look for the pattern: "screen_name":"xAccount"
        // We'll search for the exact pattern in the JSON
        string memory searchPattern = string(abi.encodePacked('"screen_name":"', xAccount, '"'));
        bytes memory pattern = bytes(searchPattern);
        
        // Simple string search - check if pattern exists in data
        if (data.length < pattern.length) {
            return false;
        }
        
        for (uint256 i = 0; i <= data.length - pattern.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }
        
        return false;
    }
    
    function bindXAccount(
        Attestation calldata attestation,
        string calldata xAccount
    ) external onlyValidAttestation(attestation) {
        if (bytes(xAccount).length == 0) {
            revert EmptyXAccount();
        }
        
        // Check if wallet is already bound to an X account
        if (bytes(walletToXAccount[msg.sender]).length > 0) {
            revert WalletAlreadyBound();
        }
        
        // Check if X account is already bound to a wallet
        if (xAccountToWallet[xAccount] != address(0)) {
            revert XAccountAlreadyBound();
        }
        
        // Additional validation: ensure the attestation data contains the X account
        // The data field should contain JSON like {"screen_name":"jobhu123"}
        // We need to verify that the xAccount parameter matches the screen_name in attestation data
        if (!_verifyXAccountInAttestation(attestation.data, xAccount)) {
            revert InvalidAttestation();
        }
        
        // Bind the X account to the wallet
        walletToXAccount[msg.sender] = xAccount;
        xAccountToWallet[xAccount] = msg.sender;
        
        emit XAccountBound(msg.sender, xAccount, block.timestamp);
    }
    
    function unbindXAccount() external {
        string memory xAccount = walletToXAccount[msg.sender];
        if (bytes(xAccount).length == 0) {
            revert NotOwner();
        }
        
        // Remove the binding
        delete walletToXAccount[msg.sender];
        delete xAccountToWallet[xAccount];
        
        emit XAccountUnbound(msg.sender, xAccount, block.timestamp);
    }
    
    function getXAccountByWallet(address wallet) external view returns (string memory) {
        return walletToXAccount[wallet];
    }
    
    function getWalletByXAccount(string calldata xAccount) external view returns (address) {
        return xAccountToWallet[xAccount];
    }
    
    function isWalletBound(address wallet) external view returns (bool) {
        return bytes(walletToXAccount[wallet]).length > 0;
    }
    
    function isXAccountBound(string calldata xAccount) external view returns (bool) {
        return xAccountToWallet[xAccount] != address(0);
    }
}