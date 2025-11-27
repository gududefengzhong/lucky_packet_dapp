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
        // 从环境变量获取部署者私钥
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
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
        
        // 保存部署信息到文件
        string memory deploymentInfo = string(
            abi.encodePacked(
                "# LuckyPacket Deployment Info\n\n",
                "**Contract Address:** `", vm.toString(address(luckyPacket)), "`\n\n",
                "**Owner:** `", vm.toString(luckyPacket.owner()), "`\n\n",
                "**Fee Recipient:** `", vm.toString(luckyPacket.platformFeeRecipient()), "`\n\n",
                "**Platform Fee Rate:** ", vm.toString(luckyPacket.platformFeeRate()), " basis points (", 
                vm.toString(luckyPacket.platformFeeRate() / 100), "%)\n\n",
                "**Deployed At:** Block ", vm.toString(block.number), "\n\n",
                "---\n\n",
                "**Next Steps:**\n",
                "1. Update `.env` file:\n",
                "   ```\n",
                "   VITE_LUCKY_PACKET_CONTRACT_ADDRESS=", vm.toString(address(luckyPacket)), "\n",
                "   ```\n\n",
                "2. Extract contract ABI:\n",
                "   ```bash\n",
                "   npm run extract-abis\n",
                "   ```\n\n",
                "3. Verify contract on BSCScan (if not auto-verified):\n",
                "   ```bash\n",
                "   forge verify-contract ", vm.toString(address(luckyPacket)), " LuckyPacket --chain <CHAIN_ID> --etherscan-api-key <API_KEY>\n",
                "   ```\n"
            )
        );
        
        vm.writeFile("deployment-info.md", deploymentInfo);
        console.log("Deployment info saved to: deployment-info.md");
    }
}
