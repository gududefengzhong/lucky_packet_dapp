# Lucky Packet DApp 部署指南

本指南将帮助您将 Lucky Packet 合约部署到 BSC 测试网。

## 📋 前置要求

### 1. 安装 Foundry

如果您还没有安装 Foundry，请运行：

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

验证安装：
```bash
forge --version
```

### 2. 获取 BSC 测试网 BNB

访问 BSC 测试网水龙头获取测试币：
- 🔗 https://testnet.bnbchain.org/faucet-smart

### 3. 获取 BSCScan API Key

用于合约验证：
- 🔗 https://bscscan.com/myapikey

### 4. 获取 WalletConnect Project ID

用于前端钱包连接：
- 🔗 https://cloud.walletconnect.com

## 🚀 部署步骤

### 步骤 1: 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下信息：

```env
# 部署者私钥（不要包含 0x 前缀）
PRIVATE_KEY=your_private_key_here

# BSCScan API Key（用于合约验证）
BSCSCAN_API_KEY=your_bscscan_api_key_here

# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# 可选：平台手续费接收地址（默认使用部署者地址）
FEE_RECIPIENT=0x...
```

⚠️ **安全提示：**
- 永远不要将包含真实资金的私钥用于测试
- `.env` 文件已在 `.gitignore` 中，不会被提交到 Git
- 使用测试网专用钱包进行部署

### 步骤 2: 安装 Foundry 依赖

```bash
cd lucky_packet_dapp

# 安装 forge-std
forge install foundry-rs/forge-std --no-commit

# 安装 OpenZeppelin 合约
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 步骤 3: 编译合约

```bash
forge build
```

预期输出：
```
[⠊] Compiling...
[⠒] Compiling 1 files with 0.8.20
[⠢] Solc 0.8.20 finished in 3.21s
Compiler run successful!
```

如果遇到编译错误，请检查：
- Solidity 版本是否正确（0.8.20）
- OpenZeppelin 依赖是否已安装
- `foundry.toml` 配置是否正确

### 步骤 4: 运行测试（可选但推荐）

在部署前运行测试以确保合约正常工作：

```bash
forge test -vvv
```

预期输出应显示所有测试通过：
```
Running 25 tests for contracts/test/LuckyPacket.t.sol:LuckyPacketTest
[PASS] testClaimMultipleUsers() (gas: ...)
[PASS] testClaimPacketSuccess() (gas: ...)
[PASS] testCreatePacketSuccess() (gas: ...)
...
Test result: ok. 25 passed; 0 failed; finished in 2.34s
```

### 步骤 5: 部署到 BSC 测试网

#### 方法 1: 使用 NPM 脚本（推荐）

```bash
npm run deploy:testnet
```

#### 方法 2: 使用 Forge 命令

```bash
forge script contracts/script/Deploy.s.sol:DeployLuckyPacket \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY \
  -vvvv
```

#### 部署过程说明

1. **交易广播**: 合约部署交易将被发送到 BSC 测试网
2. **等待确认**: 通常需要 3-5 秒
3. **自动验证**: 如果配置了 `BSCSCAN_API_KEY`，合约会自动在 BSCScan 上验证

#### 预期输出

```
==============================================================
Deploying LuckyPacket Contract
==============================================================
Deployer: 0x1234...5678
Fee Recipient: 0x1234...5678
==============================================================
[Broadcasting transaction...]
==============================================================
Deployment Successful!
==============================================================
LuckyPacket Contract: 0xabcd...ef01
Owner: 0x1234...5678
Platform Fee Rate: 100 basis points
Platform Fee Recipient: 0x1234...5678
==============================================================
Deployment info saved to: deployment-info.md
```

### 步骤 6: 提取合约 ABI

部署成功后，提取 ABI 供前端使用：

```bash
npm run extract-abis
```

预期输出：
```
🔍 Extracting ABIs from compiled contracts...

✅ Extracted ABI for LuckyPacket
   → /Users/.../src/contracts/abis/LuckyPacket.json

✅ Created TypeScript exports
   → /Users/.../src/contracts/abis/index.ts

🎉 ABI extraction completed!
```

### 步骤 7: 更新前端配置

将部署的合约地址添加到 `.env` 文件：

```env
VITE_LUCKY_PACKET_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 步骤 8: 启动前端应用

```bash
npm run dev
```

访问 http://localhost:5173 查看您的 DApp！

## 🔍 验证部署

### 1. 在 BSCScan 上查看合约

访问：https://testnet.bscscan.com/address/YOUR_CONTRACT_ADDRESS

您应该能看到：
- ✅ 合约代码已验证（绿色勾）
- ✅ 合约创建交易
- ✅ 合约 ABI
- ✅ 可以直接在浏览器中与合约交互

### 2. 手动验证合约（如果自动验证失败）

```bash
forge verify-contract YOUR_CONTRACT_ADDRESS \
  contracts/src/LuckyPacket.sol:LuckyPacket \
  --chain-id 97 \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "YOUR_FEE_RECIPIENT_ADDRESS")
```

### 3. 测试合约功能

在前端应用中测试以下功能：

1. **连接钱包**
   - 切换到 BSC 测试网
   - 连接 MetaMask 或其他钱包

2. **创建红包**
   - 设置金额、份数、过期时间
   - 确认交易
   - 等待交易确认

3. **领取红包**
   - 使用另一个账户连接
   - 查看可用红包
   - 领取红包

4. **查看记录**
   - 查看我创建的红包
   - 查看我领取的红包
   - 查看领取记录

## 🛠 故障排除

### 问题 1: 编译失败

**症状：** `Error: Failed to resolve imports`

**解决方案：**
```bash
# 重新安装依赖
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# 清理并重新编译
forge clean
forge build
```

### 问题 2: 部署失败 - Gas 不足

**症状：** `Error: insufficient funds for gas`

**解决方案：**
1. 访问水龙头获取更多测试 BNB
2. 检查钱包余额是否足够

### 问题 3: 验证失败

**症状：** `Contract verification failed`

**解决方案：**
```bash
# 等待几分钟后重试
forge verify-contract YOUR_CONTRACT_ADDRESS \
  contracts/src/LuckyPacket.sol:LuckyPacket \
  --chain-id 97 \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "YOUR_FEE_RECIPIENT")
```

### 问题 4: 前端无法连接合约

**症状：** `Contract call failed` 或 `Read contract failed`

**解决方案：**
1. 检查 `.env` 中的合约地址是否正确
2. 确保已运行 `npm run extract-abis`
3. 检查钱包是否连接到 BSC 测试网
4. 刷新页面并重新连接钱包

### 问题 5: RPC 连接问题

**症状：** `Error: Network connection failed`

**解决方案：**
尝试其他 BSC 测试网 RPC：
- https://data-seed-prebsc-2-s1.binance.org:8545
- https://data-seed-prebsc-1-s2.binance.org:8545
- https://data-seed-prebsc-2-s2.binance.org:8545

## 📊 网络信息

### BSC 测试网 (Testnet)
- **Chain ID:** 97
- **RPC URL:** https://data-seed-prebsc-1-s1.binance.org:8545
- **浏览器:** https://testnet.bscscan.com
- **水龙头:** https://testnet.bnbchain.org/faucet-smart
- **符号:** BNB

### BSC 主网 (Mainnet) - 仅供参考
- **Chain ID:** 56
- **RPC URL:** https://bsc-dataseed.binance.org
- **浏览器:** https://bscscan.com
- **符号:** BNB

## 🎯 下一步

部署成功后，您可以：

1. **🎨 自定义界面**
   - 修改 `src/pages/DAppHome.tsx`
   - 调整颜色、布局、文案

2. **⚙️ 调整合约参数**
   - 修改平台手续费率（通过 `setPlatformFeeRate`）
   - 更改手续费接收地址

3. **📱 分享您的 DApp**
   - 部署前端到 Vercel/Netlify
   - 分享给朋友测试

4. **🚀 部署到主网**
   - 充分测试后
   - 使用 `npm run deploy:mainnet`
   - ⚠️ 注意：主网部署需要真实的 BNB

## 📚 相关资源

- [Foundry Book](https://book.getfoundry.sh/)
- [BSC 开发文档](https://docs.bnbchain.org/)
- [OpenZeppelin 合约](https://docs.openzeppelin.com/contracts/)
- [Wagmi 文档](https://wagmi.sh/)
- [RainbowKit 文档](https://www.rainbowkit.com/)

## 🆘 获取帮助

如果遇到问题：
1. 查看 [GitHub Issues](https://github.com/your-repo/issues)
2. 加入 [Discord 社区](#)
3. 阅读 [FAQ 文档](#)

---

**祝您部署顺利！🎉**
