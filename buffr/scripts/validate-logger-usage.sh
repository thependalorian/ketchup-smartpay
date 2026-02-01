#!/bin/bash

# Validate Logger Usage Script
# 
# Location: scripts/validate-logger-usage.sh
# Purpose: Quick validation of logger usage across codebase
# 
# Usage:
#   ./scripts/validate-logger-usage.sh
#   chmod +x scripts/validate-logger-usage.sh  # First time only

echo "🔍 Validating Logger Usage"
echo "=========================="
echo ""

# Count console statements
CONSOLE_COUNT=$(grep -r "console\.\(log\|error\|warn\|info\|debug\)" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.expo \
  --exclude-dir=__tests__ \
  --exclude-dir=backups \
  --exclude-dir=.claude \
  app/ services/ utils/ contexts/ components/ hooks/ 2>/dev/null | wc -l | tr -d ' ')

# Count logger imports
LOGGER_IMPORT_COUNT=$(grep -r "from '@/utils/logger'" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.expo \
  --exclude-dir=__tests__ \
  --exclude-dir=backups \
  --exclude-dir=.claude \
  app/ services/ utils/ contexts/ components/ hooks/ 2>/dev/null | wc -l | tr -d ' ')

# Count logger usage
LOGGER_USAGE_COUNT=$(grep -r "logger\.\(info\|error\|warn\|debug\|fatal\)\|log\.\(info\|error\|warn\|debug\|fatal\)" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.expo \
  --exclude-dir=__tests__ \
  --exclude-dir=backups \
  --exclude-dir=.claude \
  app/ services/ utils/ contexts/ components/ hooks/ 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Statistics:"
echo "  Console statements: $CONSOLE_COUNT"
echo "  Logger imports: $LOGGER_IMPORT_COUNT"
echo "  Logger usage: $LOGGER_USAGE_COUNT"
echo ""

if [ "$CONSOLE_COUNT" -gt 0 ]; then
  echo "⚠️  Found $CONSOLE_COUNT console statement(s) that should use logger"
  echo ""
  echo "Files with console statements:"
  grep -r "console\.\(log\|error\|warn\|info\|debug\)" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=.expo \
    --exclude-dir=__tests__ \
    --exclude-dir=backups \
    --exclude-dir=.claude \
    app/ services/ utils/ contexts/ components/ hooks/ 2>/dev/null | \
    cut -d: -f1 | sort -u | head -20
  echo ""
  echo "Run: node scripts/replace-console-with-logger.js --dry-run"
  echo "     to see what would be replaced"
  exit 1
else
  echo "✅ No console statements found (excluding test files and scripts)"
  exit 0
fi
