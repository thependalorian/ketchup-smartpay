#!/bin/bash
# Batch replace console statements with logger
# This script helps automate the replacement process

echo "📝 Console Statement Replacement Progress"
echo "=========================================="
echo ""
echo "✅ Completed:"
echo "   - utils/logger.ts (created)"
echo "   - utils/db.ts (6 statements)"
echo "   - app/api/payments/send.ts (2 statements)"
echo "   - app/api/auth/login.ts (2 statements)"
echo "   - app/api/auth/refresh.ts (1 statement)"
echo "   - app/api/wallets/[id]/add-money.ts (2 statements)"
echo ""
echo "📊 Remaining: ~180 statements across 75 files"
echo ""
echo "💡 Next batch priorities:"
echo "   1. Compliance routes (dormancy, incidents, processing)"
echo "   2. Admin routes (users, transactions, audit)"
echo "   3. Utility routes (vouchers, insurance, tickets)"
echo "   4. Utility functions (auth, pushNotifications, etc.)"
echo ""
echo "Run: npx tsx scripts/replace-console-logs.ts to see all remaining statements"

