/**
 * Generate Encryption Key Script
 * 
 * Location: scripts/generate-encryption-key.ts
 * Purpose: Generate a secure random encryption key for ENCRYPTION_KEY environment variable
 * 
 * Usage:
 *   npx tsx scripts/generate-encryption-key.ts
 * 
 * This generates a cryptographically secure 32-byte (256-bit) key suitable for AES-256-GCM encryption.
 */

import crypto from 'crypto';

function generateEncryptionKey(): string {
  // Generate 32 random bytes (256 bits) for AES-256
  const key = crypto.randomBytes(32);
  
  // Convert to hex string (64 characters)
  return key.toString('hex');
}

function main() {
  console.log('\n🔐 Encryption Key Generator\n');
  console.log('=' .repeat(60));
  
  const key = generateEncryptionKey();
  
  console.log('\n✅ Generated secure encryption key (32 bytes / 256 bits):\n');
  console.log(key);
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Next Steps:');
  console.log('1. Add this key to your .env.local file:');
  console.log(`   ENCRYPTION_KEY=${key}`);
  console.log('\n2. Add this key to your Vercel environment variables:');
  console.log('   - Go to Vercel Dashboard → Project → Settings → Environment Variables');
  console.log('   - Add ENCRYPTION_KEY with the value above');
  console.log('\n3. ⚠️  IMPORTANT: Keep this key secure and never commit it to version control!');
  console.log('   - The .env.local file should already be in .gitignore');
  console.log('   - Store a backup in a secure password manager');
  console.log('\n4. After setting the key, run the database migration:');
  console.log('   npx tsx scripts/run-encryption-migration.ts');
  console.log('\n5. If you have existing plain text data, run the data migration:');
  console.log('   npx tsx scripts/migrate-existing-data-to-encrypted.ts');
  console.log('\n' + '='.repeat(60) + '\n');
}

main();
