// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/XAccountRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        XAccountRegistry registry = new XAccountRegistry();
        
        console.log("XAccountRegistry deployed at:", address(registry));
        console.log("Primus Verifier address:", address(registry.PRIMUS_VERIFIER()));
        
        vm.stopBroadcast();
    }
}