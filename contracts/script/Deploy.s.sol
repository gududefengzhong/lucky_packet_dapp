// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LuckyPacket.sol";

/**
 * @title DeployLuckyPacket
 * @dev Foundry 部署脚本 - 部署 LuckyPacket 合约到 BSC
 * @notice 运行方式：
 *   forge script contracts/script/Deploy.s.sol:DeployLuckyPacket --rpc-url <RPC_URL> --broadcast --verify
 */
contract DeployLuckyPacket is Script {
    function run() external {
        // 从环境变量获取部署者私钥（支持带或不带 0x 前缀）
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey;
        
        // 检查是否有 0x 前缀
        if (bytes(privateKeyStr).length > 2 && 
            bytes(privateKeyStr)[0] == '0' && 
            bytes(privateKeyStr)[1] == 'x') {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        } else {
            // 如果没有 0x 前缀，手动添加
            deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", privateKeyStr)));
        }
        
        // 获取平台手续费接收地址（默认使用部署者地址）
        address feeRecipient = vm.envOr("FEE_RECIPIENT", vm.addr(deployerPrivateKey));
        
        console.log("==============================================");
        console.log("Deploying LuckyPacket Contract");
        console.log("==============================================");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Fee Recipient:", feeRecipient);
        console.log("==============================================");
        
        // 开始广播交易
        vm.startBroadcast(deployerPrivateKey);
        
        // 部署合约
        LuckyPacket luckyPacket = new LuckyPacket(feeRecipient);
        
        vm.stopBroadcast();
        
        // 输出部署信息
        console.log("==============================================");
        console.log("Deployment Successful!");
        console.log("==============================================");
        console.log("LuckyPacket Contract:", address(luckyPacket));
        console.log("Owner:", luckyPacket.owner());
        console.log("Platform Fee Rate:", luckyPacket.platformFeeRate(), "basis points");
        console.log("Platform Fee Recipient:", luckyPacket.platformFeeRecipient());
        console.log("==============================================");
    }
}
