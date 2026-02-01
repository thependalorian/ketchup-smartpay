/**
 * Force Create Ecosystem Tables
 * 
 * Creates all ecosystem tables directly, ignoring migration history
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

const MIGRATION_FILES = [
  'migration_nampost_branches.sql',
  'migration_recommendation_engine.sql',
  'migration_leadership_boards.sql',
  'migration_merchant_agent_onboarding.sql',
  'migration_geoclustering.sql',
];

function parseSQLStatements(content: string): string[] {
  // Remove migration history insert
  content = content.replace(
    /INSERT INTO migration_history[\s\S]*?ON CONFLICT.*?DO NOTHING;/g,
    ''
  );
  
  // Split by semicolons
  const statements: string[] = [];
  let currentStatement = '';
  let inComment = false;
  let commentType: 'line' | 'block' | null = null;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    // Handle line comments
    if (!inComment && char === '-' && nextChar === '-') {
      inComment = true;
      commentType = 'line';
      i++;
      continue;
    }
    
    // Handle block comments
    if (!inComment && char === '/' && nextChar === '*') {
      inComment = true;
      commentType = 'block';
      i++;
      continue;
    }
    
    // End line comment
    if (inComment && commentType === 'line' && char === '\n') {
      inComment = false;
      commentType = null;
      continue;
    }
    
    // End block comment
    if (inComment && commentType === 'block' && char === '*' && nextChar === '/') {
      inComment = false;
      commentType = null;
      i++;
      continue;
    }
    
    if (inComment) continue;
    
    currentStatement += char;
    
    if (char === ';') {
      const trimmed = currentStatement.trim();
      if (trimmed.length > 10 && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      currentStatement = '';
    }
  }
  
  if (currentStatement.trim().length > 10) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(s => s.length > 0);
}

async function executeMigrationFile(filename: string) {
  console.log(`\n📄 Processing: ${filename}...`);
  
  try {
    const migrationPath = join(process.cwd(), 'sql', filename);
    const migrationContent = await readFile(migrationPath, 'utf-8');
    const statements = parseSQLStatements(migrationContent);
    
    console.log(`   Found ${statements.length} statements`);
    
    let executed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await sql.unsafe(statement);
        executed++;
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          (error.message.includes('column') && error.message.includes('already')) ||
          (error.message.includes('relation') && error.message.includes('already')) ||
          (error.message.includes('index') && error.message.includes('already'))
        ) {
          skipped++;
        } else {
          errors++;
          console.error(`   ⚠️  Statement ${i + 1} error: ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log(`   ✅ Executed: ${executed}, ⏭️  Skipped: ${skipped}, ❌ Errors: ${errors}`);
    return { success: errors === 0, executed, skipped, errors };
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, executed: 0, skipped: 0, errors: 1 };
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying tables...\n');
  
  const expectedTables = [
    'nampost_branches',
    'nampost_staff',
    'nampost_branch_load',
    'recommendations',
    'recommendation_effectiveness',
    'concentration_alerts',
    'liquidity_recommendations',
    'leaderboard_rankings',
    'leaderboard_incentives',
    'bottleneck_metrics',
    'merchant_onboarding',
    'agent_onboarding',
    'onboarding_documents',
    'beneficiary_clusters',
    'agent_clusters',
    'demand_hotspots',
    'coverage_gaps',
  ];
  
  const results: { table: string; exists: boolean }[] = [];
  
  for (const tableName of expectedTables) {
    try {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;
      const exists = result[0]?.exists || false;
      results.push({ table: tableName, exists });
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
    } catch (error: any) {
      results.push({ table: tableName, exists: false });
      console.log(`   ❌ ${tableName} - Error: ${error.message.substring(0, 50)}`);
    }
  }
  
  const existingCount = results.filter(r => r.exists).length;
  const missingCount = results.filter(r => !r.exists).length;
  
  console.log(`\n📊 Verification Summary:`);
  console.log(`   ✅ Existing: ${existingCount}/${expectedTables.length}`);
  console.log(`   ❌ Missing: ${missingCount}/${expectedTables.length}`);
  
  return missingCount === 0;
}

async function main() {
  console.log('🚀 Force Creating Ecosystem Tables\n');
  console.log('='.repeat(60));

  try {
    let totalExecuted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const migration of MIGRATION_FILES) {
      const result = await executeMigrationFile(migration);
      totalExecuted += result.executed;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Execution Summary:');
    console.log(`   ✅ Executed: ${totalExecuted}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   ❌ Errors: ${totalErrors}`);

    // Verify tables
    const allTablesExist = await verifyTables();

    if (allTablesExist && totalErrors === 0) {
      console.log('\n🎉 All ecosystem tables created successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tables may be missing or errors occurred.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
