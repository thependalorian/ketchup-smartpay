/**
 * Script to replace console.log/error/warn with proper logger
 * 
 * Usage: npx tsx scripts/replace-console-logs.ts
 * 
 * This script helps identify and replace console statements with proper logging.
 * Run this to see what needs to be replaced, then manually update files.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { log } from '@/utils/logger';

const API_DIR = join(process.cwd(), 'app', 'api');
const UTILS_DIR = join(process.cwd(), 'utils');

interface ConsoleMatch {
  file: string;
  line: number;
  statement: string;
  type: 'log' | 'error' | 'warn' | 'info';
}

function findConsoleStatements(dir: string, matches: ConsoleMatch[] = []): ConsoleMatch[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      findConsoleStatements(filePath, matches);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const logMatch = line.match(/console\.(log|error|warn|info)\s*\(/);
          if (logMatch) {
            matches.push({
              file: filePath,
              line: index + 1,
              statement: line.trim(),
              type: logMatch[1] as 'log' | 'error' | 'warn' | 'info',
            });
          }
        });
      } catch (error) {
        log.error(`Error reading ${filePath}:`, error);
      }
    }
  }

  return matches;
}

function main() {
  logger.info('🔍 Searching for console statements...\n');

  const apiMatches = findConsoleStatements(API_DIR);
  const utilsMatches = findConsoleStatements(UTILS_DIR);

  const allMatches = [...apiMatches, ...utilsMatches];

  logger.info(`Found ${allMatches.length} console statements:\n`);

  // Group by file
  const byFile = allMatches.reduce((acc, match) => {
    if (!acc[match.file]) {
      acc[match.file] = [];
    }
    acc[match.file].push(match);
    return acc;
  }, {} as Record<string, ConsoleMatch[]>);

  // Print summary
  Object.entries(byFile).forEach(([file, matches]) => {
    logger.info(`📄 ${file.replace(process.cwd() + '/', '')}`);
    matches.forEach((match) => {
      logger.info(`   Line ${match.line}: console.${match.type}()`);
    });
    logger.info('');
  });

  // Print statistics
  const stats = allMatches.reduce(
    (acc, match) => {
      acc[match.type] = (acc[match.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  logger.info('\n📊 Statistics:');
  logger.info(`   Total: ${allMatches.length}`);
  Object.entries(stats).forEach(([type, count]) => {
    logger.info(`   console.${type}: ${count}`);
  });

  logger.info('\n💡 Next steps:');
  console.log('   1. Import logger: import logger from "@/utils/logger";');
  logger.info('   2. Replace console.log() with logger.info()');
  logger.info('   3. Replace console.error() with logger.error()');
  logger.info('   4. Replace console.warn() with logger.warn()');
  logger.info('   5. Add context objects for structured logging');
}

main();

