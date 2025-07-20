# XMonad Faucet

基于 zkTLS 技术的身份验证系统，使用 Primus SDK 实现隐私保护的数据验证，将用户的 X 账号与钱包地址安全绑定。

## 项目概述

XMonad Faucet 是一个创新的身份验证系统，它利用 zkTLS（零知识传输层安全）技术，让用户能够在不泄露敏感信息的情况下验证其 X（Twitter）账号的所有权，并将其与区块链钱包地址绑定。

## 主要特性

- 🔒 **隐私保护**：使用 zkTLS 技术，用户数据永不暴露
- 🔗 **身份绑定**：将 X 账号与钱包地址安全绑定
- 📝 **链上记录**：所有绑定关系存储在区块链上
- 🚀 **高性能**：使用 Primus SDK 的 QuickSilver 协议
- 🎯 **用户友好**：简洁的 Web 界面，支持一键操作

## 技术栈

### 前端
- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Shadcn UI** - 组件库
- **Rainbow Kit + Wagmi** - 钱包连接
- **Primus SDK** - zkTLS 验证

### 智能合约
- **Solidity 0.8.20** - 合约语言
- **Foundry** - 开发框架
- **Monad Testnet** - 部署网络

## 项目结构

```
XMonadFaucet/
├── app/                    # Next.js 前端应用
│   ├── src/
│   │   ├── app/           # App Router 页面
│   │   ├── components/    # React 组件
│   │   ├── lib/          # 工具函数和配置
│   │   └── hooks/        # 自定义 Hooks
│   ├── package.json
│   └── next.config.js
├── contracts/             # 智能合约
│   ├── src/              # 合约源码
│   ├── test/             # 测试文件
│   ├── script/           # 部署脚本
│   └── foundry.toml      # Foundry 配置
├── docs/                 # 文档
├── package.json          # 根级别包配置
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+
- Bun 包管理器
- Foundry 工具链

### 安装依赖

```bash
# 安装前端依赖
cd app
bun install

# 安装智能合约依赖
cd ../contracts
forge install
```

### 配置环境变量

1. 复制环境变量模板：
```bash
cp app/.env.example app/.env.local
cp contracts/.env.example contracts/.env
```

2. 填写必要的配置：
   - **Primus SDK 配置**：在 [Primus Developer Hub](https://developer.primus.com) 创建应用
   - **私钥**：用于合约部署的私钥
   - **RPC URL**：Monad 测试网 RPC 地址

### 部署智能合约

```bash
cd contracts
forge build
forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

### 运行前端应用

```bash
cd app
bun run dev
```

访问 `http://localhost:3000` 查看应用。

## 使用流程

1. **连接钱包**
   - 点击"连接钱包"按钮
   - 选择钱包并连接到 Monad 测试网

2. **验证 X 账号**
   - 点击"连接X账号"
   - 通过 Primus SDK 完成 zkTLS 验证
   - 系统会自动验证您的 X 账号所有权

3. **查看绑定**
   - 验证成功后，页面会显示您的 X 账号和钱包地址的绑定关系
   - 所有数据都存储在区块链上

## 智能合约

### XAccountRegistry.sol

主要功能：
- `bindXAccount()` - 绑定 X 账号到钱包地址
- `unbindXAccount()` - 解绑 X 账号
- `getXAccountByWallet()` - 根据钱包地址查询 X 账号
- `getWalletByXAccount()` - 根据 X 账号查询钱包地址

### 合约地址

- **Monad Testnet**: `待部署后填写`
- **Primus Verifier**: `0x1Ad7fD53206fDc3979C672C0466A1c48AF47B431`

## 网络配置

### Monad Testnet
- **Chain ID**: 10143
- **货币符号**: MON
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **区块浏览器**: `https://testnet.monadexplorer.com`

## 开发指南

### 测试

```bash
# 智能合约测试
cd contracts
forge test

# 前端测试
cd app
bun test
```

### 代码规范

```bash
# 智能合约格式化
forge fmt

# 前端代码检查
cd app
bun run lint
```

## 安全考虑

- 使用 zkTLS 技术保护用户隐私
- 智能合约经过全面测试
- 前端使用安全的钱包连接库
- 所有敏感操作都需要用户确认

## 故障排除

### 常见问题

1. **钱包连接失败**
   - 确保您的钱包支持 Monad 测试网
   - 检查网络配置是否正确

2. **Primus 验证失败**
   - 确保 Primus SDK 配置正确
   - 检查 API 密钥是否有效

3. **合约交互失败**
   - 确保合约地址配置正确
   - 检查钱包余额是否足够支付 Gas

### 获取帮助

如果遇到问题，请：
1. 查看浏览器控制台错误信息
2. 检查环境变量配置
3. 确认网络连接正常
4. 联系开发团队

## 贡献指南

欢迎提交 Issues 和 Pull Requests！

1. Fork 本项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系我们

- 项目主页：[GitHub Repository](https://github.com/your-username/XMonadFaucet)
- 文档：[Documentation](./docs/)
- 支持：[Issues](https://github.com/your-username/XMonadFaucet/issues)

---

**注意**：本项目目前部署在测试网络上，仅用于演示和测试目的。
