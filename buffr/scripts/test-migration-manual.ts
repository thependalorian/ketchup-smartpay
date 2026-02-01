/**
 * Manual Migration Test
 * 
 * Test executing migration SQL directly to see errors
 */

import { neon } from '@neondatabase/serverless';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function testMigration(filename: string) {
  console.log(`\n🧪 Testing: ${filename}\n`);
  
  try {
    const migrationPath = join(process.cwd(), 'sql', filename);
    const migrationContent = await readFile(migrationPath, 'utf-8');
    
    // Split by semicolons and execute each statement
    const statements = migrationContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`Found ${statements.length} statements\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip very short statements (likely empty after filtering)
      if (statement.length < 10) continue;
      
      // Skip migration history insert (we'll do that separately)
      if (statement.includes('INSERT INTO migration_history')) {
        console.log(`⏭️  Statement ${i + 1}: Migration history insert (skipping)`);
        continue;
      }
      
      try {
        console.log(`📝 Statement ${i + 1}: ${statement.substring(0, 80)}...`);
        await sql.unsafe(statement);
        successCount++;
        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        errorCount++;
        // Check if it's a "already exists" error (which is OK)
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          (error.message.includes('column') && error.message.includes('already'))
        ) {
          console.log(`   ⚠️  Already exists (OK): ${error.message.substring(0, 100)}\n`);
        } else {
          console.log(`   ❌ Error: ${error.message}\n`);
          // Show full error for first real error
          if (errorCount === 1) {
            console.log(`   Full error:`, error);
          }
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️/❌ Errors: ${errorCount}`);
    
  } catch (error: any) {
    console.error(`❌ Failed to read/execute migration:`, error.message);
  }
}

async function main() {
  // Test the first migration
  await testMigration('migration_nampost_branches.sql');
}

main();
