// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MonadFaucet.sol";

contract ManageFaucet is Script {
    address constant FAUCET_ADDRESS = 0x31141eF10051eB895dAeb5402fD34fB9d61585Cc;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MonadFaucet faucet = MonadFaucet(payable(FAUCET_ADDRESS));
        
        console.log("=== Faucet Management ===");
        console.log("Faucet address:", FAUCET_ADDRESS);
        console.log("Owner:", faucet.owner());
        console.log("Current balance:", address(faucet).balance);
        console.log("Claim amount:", faucet.CLAIM_AMOUNT());
        console.log("Claim cooldown:", faucet.CLAIM_COOLDOWN());
        
        // Get faucet stats
        (uint256 balance, uint256 totalClaimed, uint256 totalUsers, address registryAddress) = 
            faucet.getFaucetStats();
        
        console.log("\n=== Faucet Statistics ===");
        console.log("Balance:", balance);
        console.log("Total claimed:", totalClaimed);
        console.log("Total users:", totalUsers);
        console.log("Registry address:", registryAddress);
        
        vm.stopBroadcast();
    }
    
    function fundFaucet() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 fundAmount = 5 ether; // Fund with 5 MON
        
        vm.startBroadcast(deployerPrivateKey);
        
        MonadFaucet faucet = MonadFaucet(payable(FAUCET_ADDRESS));
        
        console.log("Funding faucet with:", fundAmount);
        console.log("Current balance before:", address(faucet).balance);
        
        faucet.fundFaucet{value: fundAmount}();
        
        console.log("Current balance after:", address(faucet).balance);
        
        vm.stopBroadcast();
    }
    
    function withdrawFunds(uint256 amount) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MonadFaucet faucet = MonadFaucet(payable(FAUCET_ADDRESS));
        
        console.log("Withdrawing from faucet:", amount == 0 ? "all" : "specified amount");
        console.log("Current balance before:", address(faucet).balance);
        
        faucet.withdrawFunds(amount);
        
        console.log("Current balance after:", address(faucet).balance);
        
        vm.stopBroadcast();
    }
}