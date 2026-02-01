/**
 * Update Response Helpers Script
 * 
 * Purpose: Automatically update endpoints to use standardized response helpers
 * Location: scripts/update-response-helpers.ts
 * 
 * This script identifies patterns and provides replacement guidance
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import logger from '@/utils/logger';

interface Replacement {
  file: string;
  pattern: string;
  replacement: string;
  context: string;
}

const replacements: Replacement[] = [];

async function findReplacements() {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  const files = await glob('**/*.ts', { cwd: apiDir, absolute: true });
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Skip if already using apiResponse
    if (content.includes('from \'@/utils/apiResponse\'')) {
      continue;
    }
    
    // Check if uses custom jsonResponse
    if (content.includes('const jsonResponse')) {
      const relativePath = path.relative(apiDir, file);
      replacements.push({
        file: relativePath,
        pattern: 'jsonResponse',
        replacement: 'standardized helpers',
        context: 'Needs manual update',
      });
    }
  }
  
  return replacements;
}

async function main() {
  logger.info('🔍 Finding endpoints needing response helper updates...\n');
  
  const replacements = await findReplacements();
  
  logger.info(`Found ${replacements.length} files needing updates:\n`);
  replacements.forEach(r => {
    logger.info(`  - ${r.file}`);
  });
  
  logger.info('\n📝 Manual updates required:');
  logger.info('  1. Replace custom jsonResponse with standardized helpers');
  logger.info('  2. Update imports to include apiResponse helpers');
  logger.info('  3. Replace all jsonResponse calls with:');
  logger.info('     - successResponse(data) for 200 OK');
  logger.info('     - createdResponse(data, location) for 201 Created');
  logger.info('     - errorResponse(message, status) for errors');
  logger.info('     - noContentResponse() for 204 No Content');
}

main().catch(console.error);
