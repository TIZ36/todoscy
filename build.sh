#!/bin/bash

# XFormater 打包脚本
# 使用方法: ./build.sh

echo "🚀 开始打包 XFormater..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录下运行此脚本"
    exit 1
fi

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
sudo rm -rf dist
mkdir -p dist

# 安装依赖（如果需要）
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 构建 x64 版本
echo "🔨 构建 x64 版本..."
npm run dist:mac:x64

if [ $? -eq 0 ]; then
    echo "✅ x64 版本构建成功"
else
    echo "❌ x64 版本构建失败"
    exit 1
fi

# 构建 arm64 版本
echo "🔨 构建 arm64 版本..."
npm run dist:mac:arm64

if [ $? -eq 0 ]; then
    echo "✅ arm64 版本构建成功"
else
    echo "❌ arm64 版本构建失败"
    exit 1
fi

# 显示构建结果
echo ""
echo "🎉 打包完成！"
echo "📁 构建文件位置:"
ls -lh dist/*.pkg 2>/dev/null || echo "未找到 .pkg 文件"

echo ""
echo "📊 构建统计:"
echo "x64 版本: $(ls -lh dist/*x64*.pkg 2>/dev/null | awk '{print $5}' || echo '未找到')"
echo "arm64 版本: $(ls -lh dist/*arm64*.pkg 2>/dev/null | awk '{print $5}' || echo '未找到')"

echo ""
echo "✨ 构建完成，可以安装测试了！"
