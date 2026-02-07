#!/bin/bash

# Dev All - Ketchup SmartPay Monorepo
# Starts all services in development mode

echo "🚀 Starting Ketchup SmartPay Development..."
echo ""
echo "This will start:"
echo "  • Ketchup Portal (http://localhost:5173)"
echo "  • Government Portal (http://localhost:5174)"
echo "  • Backend API (http://localhost:3001)"
echo ""

# Run all dev servers with Turborepo
pnpm turbo run dev --parallel
