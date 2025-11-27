# 链上幸运红包 (Lucky Packet DApp) 项目结构

## 📁 项目目录结构

```
lucky_packet_dapp/
├── contracts/              # Foundry 智能合约项目
│   ├── src/               # 合约源代码
│   ├── test/              # 合约测试
│   ├── script/            # 部署脚本
│   ├── lib/               # 依赖库 (forge-std, OpenZeppelin)
│   └── out/               # 编译输出 (自动生成)
│
├── src/                   # React 前端项目
│   ├── components/        # UI 组件
│   ├── pages/            # 页面组件
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 工具函数
│   ├── contracts/        # 合约相关
│   │   └── abis/         # 合约 ABI (自动提取)
│   ├── wagmi.ts          # Wagmi 配置
│   └── main.tsx          # 应用入口
│
├── scripts/              # 工具脚本
│   └── extract-abis.js   # ABI 提取脚本
│
├── public/               # 静态资源
│
├── foundry.toml          # Foundry 配置
├── package.json          # NPM 依赖和脚本
├── vite.config.ts        # Vite 配置
├── tailwind.config.ts    # Tailwind CSS 配置
├── .env.example          # 环境变量模板
└── .gitignore           # Git 忽略文件
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装 Foundry (如果尚未安装)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 安装合约依赖
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

### 3. 开发流程

#### 合约开发

```bash
# 编译合约
npm run compile

# 运行测试
npm run test

# 提取 ABI 到前端
npm run extract-abis
```

#### 前端开发

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 4. 部署合约

```bash
# 部署到 BSC 测试网
npm run deploy:testnet

# 部署到 BSC 主网
npm run deploy:mainnet
```

## 🛠 技术栈

### 智能合约
- **Foundry**: 以太坊开发工具链
- **Solidity 0.8.20**: 智能合约语言
- **OpenZeppelin**: 安全的合约库

### 前端
- **React 18**: UI 框架
- **Vite**: 构建工具
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **shadcn/ui**: UI 组件库

### Web3 集成
- **Wagmi**: React Hooks for Ethereum
- **RainbowKit**: 钱包连接 UI
- **Viem**: TypeScript 以太坊接口

## 📝 NPM 脚本说明

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run compile` | 编译智能合约 |
| `npm run test` | 运行合约测试 |
| `npm run extract-abis` | 提取合约 ABI 到前端 |
| `npm run deploy:testnet` | 部署到 BSC 测试网 |
| `npm run deploy:mainnet` | 部署到 BSC 主网 |

## 🔗 BSC 网络信息

### BSC 测试网 (Testnet)
- **Chain ID**: 97
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545
- **浏览器**: https://testnet.bscscan.com
- **水龙头**: https://testnet.bnbchain.org/faucet-smart

### BSC 主网 (Mainnet)
- **Chain ID**: 56
- **RPC URL**: https://bsc-dataseed.binance.org
- **浏览器**: https://bscscan.com

## 📚 下一步

1. ✅ 项目结构已创建
2. ⏳ 实现红包智能合约
3. ⏳ 编写合约测试
4. ⏳ 构建前端界面
5. ⏳ 集成钱包和合约交互
6. ⏳ 部署到 BSC 测试网

## 🤝 开发建议

- 始终先在测试网测试
- 提交代码前运行 `npm run test`
- 使用 `.env` 管理敏感信息
- 不要提交私钥到 Git
- 部署后更新 `.env` 中的合约地址
