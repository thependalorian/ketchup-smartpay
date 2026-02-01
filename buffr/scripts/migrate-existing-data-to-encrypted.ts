/**
 * Migrate Existing Data to Encrypted Format
 * 
 * Location: scripts/migrate-existing-data-to-encrypted.ts
 * Purpose: Encrypt existing plain text sensitive data in the database
 * 
 * Usage:
 *   npx tsx scripts/migrate-existing-data-to-encrypted.ts
 * 
 * This script:
 * 1. Finds all records with plain text sensitive data
 * 2. Encrypts the data using the encryption utilities
 * 3. Updates the database with encrypted values
 * 4. Leaves plain text columns intact (for verification/rollback)
 * 
 * ⚠️  IMPORTANT: Run this AFTER:
 * - Database migration has been executed (run-encryption-migration.ts)
 * - ENCRYPTION_KEY is set in environment variables
 * - You have a database backup
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import logger, { log } from '@/utils/logger';
import {
  prepareEncryptedBankAccount,
  prepareEncryptedCardNumber,
  prepareEncryptedNationalId,
} from '@/utils/encryptedFields';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.DATABASE_ENCRYPTION_KEY;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL or NEON_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  log.error('❌ ENCRYPTION_KEY environment variable is required and must be at least 32 characters');
  log.error('   Generate a key using: npx tsx scripts/generate-encryption-key.ts');
  process.exit(1);
}

async function migrateExistingData() {
  logger.info('🔄 Starting data migration to encrypted format...\n');

  const sql = neon(DATABASE_URL);

  try {
    let totalMigrated = 0;

    // ============================================================================
    // 1. Migrate user_banks table (account_number -> encrypted columns)
    // ============================================================================
    logger.info('📋 Checking user_banks table...');
    
    // Check if table exists
    const userBanksTableExists = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'user_banks'
      ) as exists
    `;
    
    if (!Array.isArray(userBanksTableExists) || !userBanksTableExists[0]?.exists) {
      logger.info('   ⚠️  user_banks table does not exist (will be created when needed)');
    } else {
      const userBanks = await sql`
        SELECT id, account_number
        FROM user_banks
        WHERE account_number IS NOT NULL
          AND account_number != ''
          AND (account_number_encrypted_data IS NULL OR account_number_encrypted_data = '')
      `;

      if (Array.isArray(userBanks) && userBanks.length > 0) {
        logger.info(`   Found ${userBanks.length} bank accounts to encrypt`);
        
        for (const bank of userBanks) {
          try {
            const encrypted = prepareEncryptedBankAccount(bank.account_number);
            
            await sql`
              UPDATE user_banks
              SET 
                account_number_encrypted_data = ${encrypted.account_number_encrypted_data},
                account_number_iv = ${encrypted.account_number_iv},
                account_number_tag = ${encrypted.account_number_tag}
              WHERE id = ${bank.id}
            `;
            
            totalMigrated++;
            logger.info(`   ✅ Encrypted bank account ${bank.id}`);
          } catch (error: any) {
            log.error(`   ❌ Failed to encrypt bank account ${bank.id}: ${error.message}`);
          }
        }
      } else {
        logger.info('   ✅ No bank accounts to migrate (all already encrypted or empty)');
      }
    }

    // ============================================================================
    // 2. Migrate user_cards table (card_number -> encrypted columns)
    // ============================================================================
    logger.info('\n📋 Checking user_cards table...');
    
    // Check if table exists
    const userCardsTableExists = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'user_cards'
      ) as exists
    `;
    
    if (!Array.isArray(userCardsTableExists) || !userCardsTableExists[0]?.exists) {
      logger.info('   ⚠️  user_cards table does not exist (will be created when needed)');
    } else {
      const userCards = await sql`
        SELECT id, card_number
        FROM user_cards
        WHERE card_number IS NOT NULL
          AND card_number != ''
          AND (card_number_encrypted_data IS NULL OR card_number_encrypted_data = '')
      `;

      if (Array.isArray(userCards) && userCards.length > 0) {
        logger.info(`   Found ${userCards.length} card numbers to encrypt`);
        
        for (const card of userCards) {
          try {
            const encrypted = prepareEncryptedCardNumber(card.card_number);
            
            await sql`
              UPDATE user_cards
              SET 
                card_number_encrypted_data = ${encrypted.card_number_encrypted_data},
                card_number_iv = ${encrypted.card_number_iv},
                card_number_tag = ${encrypted.card_number_tag}
              WHERE id = ${card.id}
            `;
            
            totalMigrated++;
            logger.info(`   ✅ Encrypted card ${card.id}`);
          } catch (error: any) {
            log.error(`   ❌ Failed to encrypt card ${card.id}: ${error.message}`);
          }
        }
      } else {
        logger.info('   ✅ No card numbers to migrate (all already encrypted or empty)');
      }
    }

    // ============================================================================
    // 3. Migrate vouchers table (bank_account_number -> encrypted columns)
    // ============================================================================
    logger.info('\n📋 Checking vouchers table...');
    const vouchers = await sql`
      SELECT id, bank_account_number
      FROM vouchers
      WHERE bank_account_number IS NOT NULL
        AND bank_account_number != ''
        AND (bank_account_number_encrypted IS NULL OR bank_account_number_encrypted = '')
    `;

    if (Array.isArray(vouchers) && vouchers.length > 0) {
      logger.info(`   Found ${vouchers.length} voucher bank accounts to encrypt`);
      
      for (const voucher of vouchers) {
        try {
          const encrypted = prepareEncryptedBankAccount(voucher.bank_account_number);
          
          await sql`
            UPDATE vouchers
            SET 
              bank_account_number_encrypted = ${encrypted.account_number_encrypted_data},
              bank_account_number_iv = ${encrypted.account_number_iv},
              bank_account_number_tag = ${encrypted.account_number_tag}
            WHERE id = ${voucher.id}
          `;
          
          totalMigrated++;
          logger.info(`   ✅ Encrypted voucher ${voucher.id}`);
        } catch (error: any) {
          log.error(`   ❌ Failed to encrypt voucher ${voucher.id}: ${error.message}`);
        }
      }
    } else {
      logger.info('   ✅ No voucher bank accounts to migrate (all already encrypted or empty)');
    }

    // ============================================================================
    // 4. Migrate voucher_redemptions table (bank_account_number -> encrypted columns)
    // ============================================================================
    logger.info('\n📋 Checking voucher_redemptions table...');
    const redemptions = await sql`
      SELECT id, bank_account_number
      FROM voucher_redemptions
      WHERE bank_account_number IS NOT NULL
        AND bank_account_number != ''
        AND (bank_account_number_encrypted IS NULL OR bank_account_number_encrypted = '')
    `;

    if (Array.isArray(redemptions) && redemptions.length > 0) {
      logger.info(`   Found ${redemptions.length} redemption bank accounts to encrypt`);
      
      for (const redemption of redemptions) {
        try {
          const encrypted = prepareEncryptedBankAccount(redemption.bank_account_number);
          
          await sql`
            UPDATE voucher_redemptions
            SET 
              bank_account_number_encrypted = ${encrypted.account_number_encrypted_data},
              bank_account_number_iv = ${encrypted.account_number_iv},
              bank_account_number_tag = ${encrypted.account_number_tag}
            WHERE id = ${redemption.id}
          `;
          
          totalMigrated++;
          logger.info(`   ✅ Encrypted redemption ${redemption.id}`);
        } catch (error: any) {
          log.error(`   ❌ Failed to encrypt redemption ${redemption.id}: ${error.message}`);
        }
      }
    } else {
      logger.info('   ✅ No redemption bank accounts to migrate (all already encrypted or empty)');
    }

    // ============================================================================
    // 5. Migrate users table (national_id -> encrypted columns)
    // ============================================================================
    logger.info('\n📋 Checking users table...');
    
    // Check if national_id column exists
    const nationalIdColumnExists = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'national_id'
      ) as exists
    `;
    
    if (!Array.isArray(nationalIdColumnExists) || !nationalIdColumnExists[0]?.exists) {
      logger.info('   ⚠️  national_id column does not exist (no plain text data to migrate)');
    } else {
      const users = await sql`
        SELECT id, national_id
        FROM users
        WHERE national_id IS NOT NULL
          AND national_id != ''
          AND (national_id_encrypted IS NULL OR national_id_encrypted = '')
      `;

      if (Array.isArray(users) && users.length > 0) {
        logger.info(`   Found ${users.length} national IDs to encrypt`);
        
        for (const user of users) {
          try {
            const encrypted = prepareEncryptedNationalId(user.national_id);
            
            await sql`
              UPDATE users
              SET 
                national_id_encrypted = ${encrypted.national_id_encrypted},
                national_id_iv = ${encrypted.national_id_iv},
                national_id_tag = ${encrypted.national_id_tag},
                national_id_hash = ${encrypted.national_id_hash},
                national_id_salt = ${encrypted.national_id_salt}
            WHERE id = ${user.id}
          `;
          
          totalMigrated++;
          logger.info(`   ✅ Encrypted national ID for user ${user.id}`);
        } catch (error: any) {
          log.error(`   ❌ Failed to encrypt national ID for user ${user.id}: ${error.message}`);
        }
      }
    } else {
      logger.info('   ✅ No national IDs to migrate (all already encrypted or empty)');
    }
    }

    // ============================================================================
    // Summary
    // ============================================================================
    logger.info('\n' + '='.repeat(60));
    logger.info(`✅ Data migration completed!`);
    logger.info(`   Total records migrated: ${totalMigrated}`);
    logger.info('\n📋 Next Steps:');
    logger.info('1. Verify encrypted data is correct (test decryption)');
    logger.info('2. After verification, you can optionally remove plain text columns:');
    logger.info('   - user_banks.account_number');
    logger.info('   - user_cards.card_number');
    logger.info('   - vouchers.bank_account_number');
    logger.info('   - voucher_redemptions.bank_account_number');
    logger.info('   - users.national_id');
    logger.info('3. ⚠️  IMPORTANT: Keep a backup before removing plain text columns!');
    logger.info('='.repeat(60) + '\n');

  } catch (error) {
    log.error('\n❌ Data migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateExistingData();
