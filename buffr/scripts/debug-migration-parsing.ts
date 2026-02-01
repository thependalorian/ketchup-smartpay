/**
 * Debug Migration Parsing
 * 
 * Check what statements are being parsed from migration files
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

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

async function main() {
  const filename = 'migration_recommendation_engine.sql';
  const migrationPath = join(process.cwd(), 'sql', filename);
  const content = await readFile(migrationPath, 'utf-8');
  
  const statements = parseSQLStatements(content);
  
  console.log(`Found ${statements.length} statements:\n`);
  
  statements.forEach((stmt, i) => {
    const preview = stmt.substring(0, 100).replace(/\s+/g, ' ');
    const type = stmt.match(/^(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|COMMENT)/i)?.[1] || 'OTHER';
    console.log(`${i + 1}. [${type}] ${preview}...`);
  });
  
  // Check for CREATE TABLE
  const createTables = statements.filter(s => s.toUpperCase().includes('CREATE TABLE'));
  console.log(`\n📊 CREATE TABLE statements: ${createTables.length}`);
  createTables.forEach((stmt, i) => {
    const tableMatch = stmt.match(/CREATE TABLE.*?(\w+)/i);
    const tableName = tableMatch ? tableMatch[1] : 'unknown';
    console.log(`   ${i + 1}. ${tableName}`);
  });
}

main().catch(console.error);
