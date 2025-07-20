#!/bin/bash

# XMonad Faucet 部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署 XMonad Faucet 项目..."

# 检查环境
check_environment() {
    echo "📋 检查部署环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装"
        exit 1
    fi
    
    # 检查 Bun
    if ! command -v bun &> /dev/null; then
        echo "❌ Bun 未安装"
        exit 1
    fi
    
    # 检查 Foundry
    if ! command -v forge &> /dev/null; then
        echo "❌ Foundry 未安装"
        exit 1
    fi
    
    echo "✅ 环境检查通过"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装项目依赖..."
    
    # 安装前端依赖
    cd app
    echo "安装前端依赖..."
    bun install
    cd ..
    
    # 安装智能合约依赖
    cd contracts
    echo "安装智能合约依赖..."
    forge install
    cd ..
    
    echo "✅ 依赖安装完成"
}

# 检查环境变量
check_env_vars() {
    echo "🔧 检查环境变量..."
    
    # 检查智能合约环境变量
    if [ ! -f "contracts/.env" ]; then
        echo "❌ contracts/.env 文件不存在"
        echo "请复制 contracts/.env.example 到 contracts/.env 并填写配置"
        exit 1
    fi
    
    # 检查前端环境变量
    if [ ! -f "app/.env.local" ]; then
        echo "❌ app/.env.local 文件不存在"
        echo "请复制 app/.env.example 到 app/.env.local 并填写配置"
        exit 1
    fi
    
    echo "✅ 环境变量检查通过"
}

# 构建和测试智能合约
build_contracts() {
    echo "🔨 构建智能合约..."
    
    cd contracts
    
    # 构建合约
    echo "构建合约..."
    forge build
    
    # 运行测试
    echo "运行合约测试..."
    forge test
    
    cd ..
    
    echo "✅ 智能合约构建完成"
}

# 部署智能合约
deploy_contracts() {
    echo "🚀 部署智能合约到 Monad 测试网..."
    
    cd contracts
    
    # 加载环境变量
    source .env
    
    # 检查必要的环境变量
    if [ -z "$PRIVATE_KEY" ] || [ -z "$RPC_URL" ]; then
        echo "❌ 缺少必要的环境变量 PRIVATE_KEY 或 RPC_URL"
        exit 1
    fi
    
    # 部署合约
    echo "部署合约..."
    forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
    
    cd ..
    
    echo "✅ 智能合约部署完成"
}

# 构建前端
build_frontend() {
    echo "🎨 构建前端应用..."
    
    cd app
    
    # 构建前端
    echo "构建前端..."
    bun run build
    
    cd ..
    
    echo "✅ 前端构建完成"
}

# 主函数
main() {
    echo "🎯 XMonad Faucet 自动部署脚本"
    echo "=================================="
    
    check_environment
    install_dependencies
    check_env_vars
    build_contracts
    deploy_contracts
    build_frontend
    
    echo ""
    echo "🎉 部署完成！"
    echo "=================================="
    echo "📝 接下来的步骤："
    echo "1. 更新 app/.env.local 中的 NEXT_PUBLIC_CONTRACT_ADDRESS"
    echo "2. 运行 'cd app && bun run dev' 启动开发服务器"
    echo "3. 访问 http://localhost:3000 查看应用"
    echo ""
    echo "📋 重要提醒："
    echo "- 确保您的钱包中有足够的 MON 代币用于合约交互"
    echo "- 合约部署在 Monad 测试网，Chain ID: 10143"
    echo "- 请妥善保管您的私钥，不要泄露给他人"
}

# 运行主函数
main "$@"