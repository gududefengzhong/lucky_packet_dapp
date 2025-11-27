# 🧧 Lucky Packet DApp - 链上红包

**BNB Hackathon 项目** - 使用 AI (Nora) 构建的链上红包应用

[![BSC Testnet](https://img.shields.io/badge/Network-BSC%20Testnet-yellow)](https://testnet.bscscan.com/address/0x62B8d5497CCf812A6d82Ef047F9bDae39e24bb03)

## ✨ 功能特性

- 🎁 **创建红包** - 设置金额、份数、过期时间和祝福语
- 🎲 **两种模式** - 拼手气（随机金额）或 固定金额
- 🔗 **一键分享** - 生成链接分享到 X (Twitter)
- 💰 **链上领取** - 朋友打开链接即可领取 BNB
- 📊 **透明记录** - 所有红包和领取记录全链上可查
- ⏰ **过期退款** - 未领完的红包可由创建者退回

## 🛠 技术栈

**智能合约:**
- Solidity 0.8.20
- Foundry (开发、测试、部署)
- OpenZeppelin (ReentrancyGuard, Ownable)

**前端:**
- React 18 + TypeScript + Vite
- Wagmi v2 + Viem (Web3 交互)
- RainbowKit (钱包连接)
- shadcn/ui + Tailwind CSS (UI)

**网络:**
- BSC Testnet (Chain ID: 97)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <YOUR_GIT_URL>
cd lucky_packet_dapp
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_LUCKY_PACKET_CONTRACT_ADDRESS=0x62B8d5497CCf812A6d82Ef047F9bDae39e24bb03
```

> 获取 WalletConnect Project ID: [WalletConnect Cloud](https://cloud.walletconnect.com)

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 📁 项目结构

```
├── contracts/              # Solidity 智能合约
│   ├── src/
│   │   └── LuckyPacket.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── test/
│       └── LuckyPacket.t.sol
├── src/
│   ├── components/         # React 组件
│   │   ├── CreatePacketForm.tsx
│   │   ├── ClaimPacketCard.tsx
│   │   └── MyPackets.tsx
│   ├── contracts/abis/     # 合约 ABI
│   ├── pages/
│   └── wagmi.ts           # Web3 配置
└── README.md
```

## 📜 合约信息

| 网络 | 合约地址 |
|------|----------|
| BSC Testnet | [`0x62B8d5497CCf812A6d82Ef047F9bDae39e24bb03`](https://testnet.bscscan.com/address/0x62B8d5497CCf812A6d82Ef047F9bDae39e24bb03) |

**合约功能:**
- `createPacket()` - 创建红包
- `claimPacket()` - 领取红包
- `refundPacket()` - 退回过期红包
- `getPacketInfo()` - 查询红包信息
- 平台手续费: 1%

## 🔧 合约开发

```bash
cd contracts

# 编译
forge build

# 测试
forge test -vvv

# 部署 (需配置私钥)
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
```

## 📄 License

MIT
