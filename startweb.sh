#!/bin/bash

# XFormater 网页版启动脚本
# 使用方法: ./startweb.sh

echo "🌐 启动 XFormater 网页版..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录下运行此脚本"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发模式
echo "🚀 启动 Electron 应用..."
npm run dev

