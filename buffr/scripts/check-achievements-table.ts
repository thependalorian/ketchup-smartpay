import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { join } from 'path';
import logger from '@/utils/logger';

config({ path: join(process.cwd(), '.env.local') });
config({ path: join(process.cwd(), '.env') });

const sql = neon(process.env.DATABASE_URL!);

async function checkTable() {
  const result = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'achievements' 
    ORDER BY ordinal_position
  `;
  
  logger.info('Achievements table columns:');
  result.forEach((r: any) => logger.info(`  ${r.column_name}: ${r.data_type}`));
}

checkTable().catch(console.error);

