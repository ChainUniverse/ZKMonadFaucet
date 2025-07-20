// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MonadFaucet.sol";
import "../src/XAccountRegistry.sol";

contract DeployFaucet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Use the already deployed XAccountRegistry address
        address xAccountRegistry = 0x5DDf62210f86A0b10fc3036D7E426Fa784Ad2b7C;
        
        // Deploy the MonadFaucet contract
        MonadFaucet faucet = new MonadFaucet(xAccountRegistry);
        
        console.log("MonadFaucet deployed to:", address(faucet));
        console.log("XAccountRegistry address:", xAccountRegistry);
        console.log("Faucet owner:", faucet.owner());
        console.log("Claim amount:", faucet.CLAIM_AMOUNT());
        console.log("Claim cooldown:", faucet.CLAIM_COOLDOWN());
        
        // Try to fund the faucet with some initial MON tokens if we have balance
        uint256 availableBalance = address(this).balance;
        console.log("Available balance for funding:", availableBalance);
        
        if (availableBalance > 1 ether) {
            uint256 initialFunding = 1 ether; // 1 MON
            (bool success, ) = address(faucet).call{value: initialFunding}("");
            if (success) {
                console.log("Faucet funded with:", initialFunding);
                console.log("Faucet balance:", address(faucet).balance);
            } else {
                console.log("Failed to fund faucet, but contract deployed successfully");
            }
        } else {
            console.log("Insufficient balance to fund faucet initially");
            console.log("You can fund the faucet later by sending MON to:", address(faucet));
        }
        
        vm.stopBroadcast();
    }
}