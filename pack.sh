#!/bin/bash

# XFormater 打包脚本 - Mac Intel (x64)
# 使用方法: ./pack.sh

echo "💻 开始打包 XFormater (Mac Intel)..."

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
rm -rf dist
mkdir -p dist

# 构建 x64 版本
echo "🔨 构建 Intel (x64) 版本..."
npm run dist:mac:x64

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Intel (x64) 版本构建成功！"
    echo "📁 构建文件位置:"
    ls -lh dist/*x64*.pkg 2>/dev/null || echo "未找到 .pkg 文件"
else
    echo "❌ Intel (x64) 版本构建失败"
    exit 1
fi

