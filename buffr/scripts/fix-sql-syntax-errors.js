import logger, { log } from '@/utils/logger';
#!/usr/bin/env node
/**
 * Fix SQL Syntax Errors
 *
 * This script fixes SQL syntax errors where response helper code was accidentally
 * mixed into SQL INSERT statements during a merge.
 *
 * The problematic pattern:
 *   `INSERT INTO table (..., const status = typeof statusOrOptions === 'number' ? statusOrOptions : statusOrOptions.status; status, ...)`
 *
 * Should be:
 *   `INSERT INTO table (..., description, status, ...)`
 */

const fs = require('fs');
const path = require('path');

const problemPattern = /const status = typeof statusOrOptions === 'number' \? statusOrOptions : statusOrOptions\.status;\s*status,/g;

// List of files to fix (from grep results)
const filesToFix = [
  'app/api/payments/send.ts',
  'app/api/requests/[id].ts',
  'app/api/transactions/[id].ts',
  'app/api/wallets/[id]/add-money.ts',
  'app/api/wallets/[id]/autopay/execute.ts',
  'app/api/wallets/[id]/autopay/history.ts',
  'app/api/wallets/index.ts',
  'app/api/compliance/dormancy/route.ts',
  'app/api/compliance/incidents/route.ts',
  'app/api/compliance/processing/route.ts',
  'app/api/auth/refresh.ts',
  'app/api/auth/login.ts',
  'app/api/compliance/reports/monthly.ts',
  'app/api/notifications/index.ts',
  'app/api/notifications/[id].ts',
  'app/api/wallets/[id].ts',
  'app/api/users/me.ts',
  'app/api/users/toggle-2fa.ts',
  'app/api/utilities/buy-tickets.ts',
  'app/api/utilities/insurance/purchase.ts',
  'app/api/utilities/vouchers/[id]/redeem.ts',
  'app/api/utilities/vouchers/index.ts',
  'app/api/utilities/subscriptions.ts',
  'app/api/utilities/subscriptions/[id]/pause.ts',
  'app/api/utilities/subscriptions/[id].ts',
  'app/api/utilities/mobile-recharge.ts',
  'app/api/utilities/sponsored/index.ts',
  'app/api/requests/index.ts',
  'app/api/groups/[id]/members.ts',
  'app/api/groups/[id]/contribute.ts',
  'app/api/groups/index.ts',
  'app/api/groups/[id].ts',
  'app/api/contacts/index.ts',
  'app/api/payments/request.ts',
  'app/api/payments/3ds-complete.ts',
];

let fixedCount = 0;
let skippedCount = 0;

logger.info('Starting SQL syntax error fix...\n');

filesToFix.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    logger.info(`⚠️  Skipped (not found): ${file}`);
    skippedCount++;
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix the SQL syntax error
    content = content.replace(problemPattern, 'status,');

    // Also fix duplicate jsonResponse helper comments
    content = content.replace(
      /\/\/ Helper to create JSON responses\s*\/\/ Helper to create JSON responses/g,
      '// Helper to create JSON responses'
    );

    // Fix missing newline after jsonResponse function
    content = content.replace(
      /\}\;import \{/g,
      '};\n\nimport {'
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      logger.info(`✅ Fixed: ${file}`);
      fixedCount++;
    } else {
      logger.info(`ℹ️  No changes needed: ${file}`);
      skippedCount++;
    }
  } catch (error) {
    log.error(`❌ Error fixing ${file}:`, error.message);
    skippedCount++;
  }
});

logger.info('\n' + '='.repeat(60));
logger.info(`Summary:`);
logger.info(`  Fixed: ${fixedCount} files`);
logger.info(`  Skipped: ${skippedCount} files`);
logger.info('='.repeat(60));
logger.info('\n✨ SQL syntax error fix complete!');
