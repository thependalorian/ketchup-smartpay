import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = neon(process.env.DATABASE_URL!);

async function runFix() {
  const migration = readFileSync(join(__dirname, 'src/database/migrations/007_fix_psd_compliance_schema.sql'), 'utf-8');
  const statements = migration.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--') && s.length > 10);
  
  for (const stmt of statements) {
    try {
      await sql([stmt] as any);
      console.log('✅', stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
    } catch (e: any) {
      if (e.message.includes('does not exist') || e.message.includes('already exists')) {
        console.log('⏭️ ', stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
      } else {
        console.error('❌', e.message);
      }
    }
  }
  console.log('\n✅ Migration 007 complete');
}

runFix();
