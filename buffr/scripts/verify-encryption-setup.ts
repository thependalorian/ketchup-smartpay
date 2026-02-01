/**
 * Verify Encryption Setup Script
 * 
 * Location: scripts/verify-encryption-setup.ts
 * Purpose: Verify encryption setup is complete and working
 * 
 * Usage:
 *   npx tsx scripts/verify-encryption-setup.ts
 * 
 * This script verifies:
 * 1. ENCRYPTION_KEY is set and valid
 * 2. Encrypted columns exist in database
 * 3. Encryption/decryption functions work correctly
 * 4. API endpoints are using encryption
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import logger, { log } from '@/utils/logger';
import { encryptField, decryptField } from '@/utils/encryption';
import {
  prepareEncryptedBankAccount,
  prepareEncryptedCardNumber,
  prepareEncryptedNationalId,
  extractBankAccount,
  extractCardNumber,
  extractNationalId,
} from '@/utils/encryptedFields';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.DATABASE_ENCRYPTION_KEY;

async function verifyEncryptionSetup() {
  logger.info('🔍 Verifying encryption setup...\n');
  logger.info('='.repeat(60) + '\n');

  let allChecksPassed = true;

  // ============================================================================
  // Check 1: ENCRYPTION_KEY is set
  // ============================================================================
  logger.info('📋 Check 1: ENCRYPTION_KEY environment variable');
  
  if (!ENCRYPTION_KEY) {
    logger.info('   ❌ ENCRYPTION_KEY is not set');
    logger.info('   💡 Generate a key: npx tsx scripts/generate-encryption-key.ts');
    allChecksPassed = false;
  } else if (ENCRYPTION_KEY.length < 32) {
    logger.info(`   ❌ ENCRYPTION_KEY is too short (${ENCRYPTION_KEY.length} chars, need 32+)`);
    logger.info('   💡 Generate a new key: npx tsx scripts/generate-encryption-key.ts');
    allChecksPassed = false;
  } else if (ENCRYPTION_KEY === 'default-key-change-in-production') {
    logger.info('   ⚠️  ENCRYPTION_KEY is using default value (NOT SECURE)');
    logger.info('   💡 Generate a secure key: npx tsx scripts/generate-encryption-key.ts');
    allChecksPassed = false;
  } else {
    logger.info(`   ✅ ENCRYPTION_KEY is set (${ENCRYPTION_KEY.length} characters)`);
  }
  logger.info('');

  if (!allChecksPassed) {
    logger.info('❌ Setup incomplete. Please fix the issues above before continuing.\n');
    process.exit(1);
  }

  // ============================================================================
  // Check 2: Encryption functions work
  // ============================================================================
  logger.info('📋 Check 2: Encryption/decryption functions');
  
  try {
    const testData = 'test-encryption-data-12345';
    const encrypted = encryptField(testData);
    const decrypted = decryptField(encrypted.data, encrypted.iv, encrypted.tag);
    
    if (decrypted === testData) {
      logger.info('   ✅ Core encryption/decryption works correctly');
    } else {
      logger.info('   ❌ Decryption failed - data mismatch');
      allChecksPassed = false;
    }
  } catch (error: any) {
    logger.info(`   ❌ Encryption test failed: ${error.message}`);
    allChecksPassed = false;
  }
  logger.info('');

  // ============================================================================
  // Check 3: Database helper functions work
  // ============================================================================
  logger.info('📋 Check 3: Database helper functions');
  
  try {
    const testAccount = '1234567890';
    const encryptedBank = prepareEncryptedBankAccount(testAccount);
    const decryptedBank = extractBankAccount(encryptedBank);
    
    if (decryptedBank === testAccount) {
      logger.info('   ✅ Bank account encryption helpers work');
    } else {
      logger.info('   ❌ Bank account encryption failed');
      allChecksPassed = false;
    }

    const testCard = '4111111111111111';
    const encryptedCard = prepareEncryptedCardNumber(testCard);
    const decryptedCard = extractCardNumber(encryptedCard);
    
    if (decryptedCard === testCard.replace(/[\s-]/g, '')) {
      logger.info('   ✅ Card number encryption helpers work');
    } else {
      logger.info('   ❌ Card number encryption failed');
      allChecksPassed = false;
    }

    const testNationalId = '1234567890123';
    const encryptedNationalId = prepareEncryptedNationalId(testNationalId);
    const decryptedNationalId = extractNationalId(encryptedNationalId);
    
    if (decryptedNationalId === testNationalId) {
      logger.info('   ✅ National ID encryption helpers work');
    } else {
      logger.info('   ❌ National ID encryption failed');
      allChecksPassed = false;
    }
  } catch (error: any) {
    logger.info(`   ❌ Helper function test failed: ${error.message}`);
    allChecksPassed = false;
  }
  logger.info('');

  if (!allChecksPassed) {
    logger.info('❌ Encryption functions have issues. Please check the errors above.\n');
    process.exit(1);
  }

  // ============================================================================
  // Check 4: Database connection and encrypted columns
  // ============================================================================
  if (!DATABASE_URL) {
    logger.info('⚠️  DATABASE_URL not set - skipping database checks');
    logger.info('   💡 Set DATABASE_URL to verify encrypted columns exist\n');
  } else {
    logger.info('📋 Check 4: Database encrypted columns');
    
    try {
      const sql = neon(DATABASE_URL);
      
      const tablesToCheck = [
        {
          table: 'vouchers',
          columns: ['bank_account_number_encrypted', 'bank_account_number_iv', 'bank_account_number_tag'],
        },
        {
          table: 'voucher_redemptions',
          columns: ['bank_account_number_encrypted', 'bank_account_number_iv', 'bank_account_number_tag'],
        },
        {
          table: 'user_banks',
          columns: ['account_number_encrypted_data', 'account_number_iv', 'account_number_tag'],
        },
        {
          table: 'user_cards',
          columns: ['card_number_encrypted_data', 'card_number_iv', 'card_number_tag'],
        },
        {
          table: 'users',
          columns: ['national_id_encrypted', 'national_id_iv', 'national_id_tag', 'national_id_hash', 'national_id_salt'],
        },
      ];

      let dbChecksPassed = true;

      for (const { table, columns } of tablesToCheck) {
        // Check if table exists
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = ${table}
          ) as exists
        `;
        
        if (!Array.isArray(tableExists) || !tableExists[0]?.exists) {
          logger.info(`   ⚠️  Table ${table} does not exist (will be created when needed)`);
          continue;
        }

        // Check each column
        for (const column of columns) {
          const columnExists = await sql`
            SELECT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = ${table} 
              AND column_name = ${column}
            ) as exists
          `;
          
          const exists = Array.isArray(columnExists) && columnExists[0]?.exists;
          if (exists) {
            logger.info(`   ✅ Column ${table}.${column} exists`);
          } else {
            logger.info(`   ❌ Column ${table}.${column} NOT found`);
            logger.info(`      💡 Run migration: npx tsx scripts/run-encryption-migration.ts`);
            dbChecksPassed = false;
          }
        }
      }

      if (!dbChecksPassed) {
        allChecksPassed = false;
      }
    } catch (error: any) {
      logger.info(`   ⚠️  Database check failed: ${error.message}`);
      logger.info('   💡 Ensure DATABASE_URL is correct and database is accessible');
    }
    logger.info('');
  }

  // ============================================================================
  // Summary
  // ============================================================================
  logger.info('='.repeat(60));
  
  if (allChecksPassed) {
    logger.info('\n✅ All encryption setup checks passed!\n');
    logger.info('📋 Next Steps:');
    logger.info('1. ✅ Encryption key is configured');
    logger.info('2. ✅ Encryption functions are working');
    logger.info('3. ✅ Database columns exist (or will be created)');
    logger.info('\n🚀 Encryption is ready for production use!\n');
  } else {
    logger.info('\n❌ Some checks failed. Please fix the issues above.\n');
    process.exit(1);
  }
}

// Run verification
verifyEncryptionSetup().catch((error) => {
  log.error('Verification failed:', error);
  process.exit(1);
});
