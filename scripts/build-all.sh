#!/bin/bash

# Build All - SmartPay Connect Monorepo
# Builds all packages and applications

set -e

echo "🏗️  Building SmartPay Connect..."
echo ""

# Build shared packages first
echo "📦 Building shared packages..."
pnpm build --filter=@smartpay/ui
pnpm build --filter=@smartpay/types
pnpm build --filter=@smartpay/api-client
pnpm build --filter=@smartpay/utils
pnpm build --filter=@smartpay/config

echo ""
echo "🏪 Building Ketchup Portal..."
pnpm build --filter=ketchup-portal

echo ""
echo "🏛️  Building Government Portal..."
pnpm build --filter=government-portal

echo ""
echo "🔧 Building Backend..."
cd backend && npm run build && cd ..

echo ""
echo "✅ All builds complete!"
echo ""
echo "📊 Build Summary:"
echo "  • Shared Packages: 5"
echo "  • Ketchup Portal: ✅"
echo "  • Government Portal: ✅"
echo "  • Backend: ✅"
