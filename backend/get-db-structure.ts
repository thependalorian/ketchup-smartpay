import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function getDatabaseStructure() {
  console.log('📊 FETCHING COMPLETE DATABASE STRUCTURE...\n');
  
  // Get all tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  
  console.log(`Found ${tables.length} tables\n`);
  
  for (const table of tables) {
    const tableName = table.table_name;
    
    // Get columns
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    
    // Get indexes
    const indexes = await sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' 
        AND tablename = ${tableName}
    `;
    
    // Get table comment
    const comment = await sql`
      SELECT obj_description(oid) as comment
      FROM pg_class
      WHERE relname = ${tableName}
        AND relkind = 'r'
    `;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TABLE: ${tableName}`);
    console.log('='.repeat(80));
    
    if (comment[0]?.comment) {
      console.log(`Description: ${comment[0].comment}`);
    }
    
    console.log('\nCOLUMNS:');
    for (const col of columns) {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const type = col.character_maximum_length 
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  - ${col.column_name}: ${type} ${nullable}${defaultVal}`);
    }
    
    if (indexes.length > 0) {
      console.log('\nINDEXES:');
      for (const idx of indexes) {
        console.log(`  - ${idx.indexname}`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ DATABASE STRUCTURE FETCH COMPLETE');
  console.log('='.repeat(80));
}

getDatabaseStructure().catch(console.error);
