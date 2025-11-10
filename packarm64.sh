#!/bin/bash

# XFormater 打包脚本 - Mac ARM64 (Apple Silicon)
# 使用方法: ./packarm64.sh

echo "🍎 开始打包 XFormater (Mac ARM64)..."

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

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf dist-arm64
mkdir -p dist-arm64

# 构建 arm64 版本
echo "🔨 构建 ARM64 版本..."
npm run dist:mac:arm64

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ARM64 版本构建成功！"
    echo "📁 构建文件位置:"
    ls -lh dist/*arm64*.pkg 2>/dev/null || echo "未找到 .pkg 文件"
else
    echo "❌ ARM64 版本构建失败"
    exit 1
fi

