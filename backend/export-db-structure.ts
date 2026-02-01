import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL!);

async function exportDatabaseStructure() {
  let output = '# 📊 SMARTPAY CONNECT - COMPLETE DATABASE STRUCTURE\n\n';
  output += '**Generated:** ' + new Date().toISOString() + '\n\n';
  output += '---\n\n';
  
  // Get all tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  
  output += `## 📋 Overview\n\n`;
  output += `**Total Tables:** ${tables.length}\n\n`;
  output += `**Database:** Neon PostgreSQL (Serverless)\n\n`;
  output += `**Connection:** \`${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0]}\`\n\n`;
  output += `---\n\n`;
  
  // Table of contents
  output += `## 📑 Table of Contents\n\n`;
  for (const table of tables) {
    output += `- [${table.table_name}](#${table.table_name.replace(/_/g, '-')})\n`;
  }
  output += `\n---\n\n`;
  
  // Detailed structure for each table
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
      ORDER BY indexname
    `;
    
    // Get foreign keys
    const foreignKeys = await sql`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ${tableName}
    `;
    
    // Get table comment
    const comment = await sql`
      SELECT obj_description(oid) as comment
      FROM pg_class
      WHERE relname = ${tableName}
        AND relkind = 'r'
    `;
    
    output += `## ${tableName}\n\n`;
    
    if (comment[0]?.comment) {
      output += `**Description:** ${comment[0].comment}\n\n`;
    }
    
    output += `**Columns:** ${columns.length}  \n`;
    output += `**Indexes:** ${indexes.length}  \n`;
    output += `**Foreign Keys:** ${foreignKeys.length}\n\n`;
    
    // Columns table
    output += `### Columns\n\n`;
    output += `| Column | Type | Nullable | Default |\n`;
    output += `|--------|------|----------|----------|\n`;
    
    for (const col of columns) {
      const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
      const type = col.character_maximum_length 
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      const defaultVal = col.column_default || '-';
      output += `| \`${col.column_name}\` | ${type} | ${nullable} | ${defaultVal} |\n`;
    }
    
    // Indexes
    if (indexes.length > 0) {
      output += `\n### Indexes\n\n`;
      for (const idx of indexes) {
        output += `- **${idx.indexname}**\n`;
        output += `  \`\`\`sql\n  ${idx.indexdef}\n  \`\`\`\n\n`;
      }
    }
    
    // Foreign Keys
    if (foreignKeys.length > 0) {
      output += `### Foreign Keys\n\n`;
      output += `| Column | References |\n`;
      output += `|--------|------------|\n`;
      for (const fk of foreignKeys) {
        output += `| \`${fk.column_name}\` | \`${fk.foreign_table_name}.${fk.foreign_column_name}\` |\n`;
      }
      output += `\n`;
    }
    
    output += `---\n\n`;
  }
  
  // Write to file
  writeFileSync('../DATABASE_STRUCTURE.md', output);
  console.log('✅ Database structure exported to DATABASE_STRUCTURE.md');
  console.log(`📊 Total tables documented: ${tables.length}`);
}

exportDatabaseStructure().catch(console.error);
