/**
 * Console to Logger Replacement Script
 * 
 * Location: scripts/replace-console-with-logger.ts
 * Purpose: Replace console.log/error/warn/info/debug with logger utility
 * 
 * Usage:
 *   npx tsx scripts/replace-console-with-logger.ts [--dry-run] [--validate-only] [--file <path>]
 * 
 * Options:
 *   --dry-run: Show what would be changed without making changes
 *   --validate-only: Only validate existing logger usage
 *   --file <path>: Process only specific file
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const validateOnly = args.includes('--validate-only');
const fileArgIndex = args.indexOf('--file');
const specificFile = fileArgIndex !== -1 ? args[fileArgIndex + 1] : null;

// Directories to skip
const SKIP_DIRS = [
  'node_modules',
  '.git',
  '.expo',
  'dist',
  'build',
  '.next',
  '__tests__',
  'backups',
  '.claude',
];

// Files to skip (scripts can keep console for CLI output)
const SKIP_FILES = [
  'replace-console-with-logger.ts',
  'test-all-services-real.ts',
  'validate-and-test-all.ts',
];

// Console method mappings to logger methods
const CONSOLE_MAPPINGS = {
  'console.log': { method: 'logger.info', import: 'logger' },
  'console.error': { method: 'log.error', import: 'log' },
  'console.warn': { method: 'logger.warn', import: 'logger' },
  'console.info': { method: 'logger.info', import: 'logger' },
  'console.debug': { method: 'logger.debug', import: 'logger' },
};

interface Replacement {
  line: number;
  original: string;
  replacement: string;
  consoleMethod: string;
}

interface FileResult {
  file: string;
  replacements: Replacement[];
  importsAdded: string[];
  hasErrors: boolean;
  error?: string;
}

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath: string): boolean {
  // Skip if in skip directories
  for (const skipDir of SKIP_DIRS) {
    if (filePath.includes(`/${skipDir}/`) || filePath.includes(`\\${skipDir}\\`)) {
      return true;
    }
  }

  // Skip specific files
  const fileName = path.basename(filePath);
  if (SKIP_FILES.includes(fileName)) {
    return true;
  }

  // Skip markdown files
  if (filePath.endsWith('.md')) {
    return true;
  }

  // Skip JSON files
  if (filePath.endsWith('.json')) {
    return true;
  }

  return false;
}

/**
 * Check if line contains console statement (not in string or comment)
 */
function findConsoleStatements(content: string, lineNumber: number): Array<{
  match: string;
  startIndex: number;
  endIndex: number;
  method: string;
}> {
  const results: Array<{
    match: string;
    startIndex: number;
    endIndex: number;
    method: string;
  }> = [];

  // Find all console.method() patterns
  for (const [consoleMethod, mapping] of Object.entries(CONSOLE_MAPPINGS)) {
    const regex = new RegExp(
      `(${consoleMethod.replace('.', '\\.')})\\s*\\(`,
      'g'
    );
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Check if it's in a string or comment
      const beforeMatch = content.substring(0, match.index);
      
      // Count quotes and check if we're in a string
      const singleQuotes = (beforeMatch.match(/'/g) || []).length;
      const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
      const backticks = (beforeMatch.match(/`/g) || []).length;
      const isInString = (singleQuotes % 2 !== 0) || (doubleQuotes % 2 !== 0) || (backticks % 2 !== 0);
      
      // Check if it's in a comment
      const lastLineComment = beforeMatch.lastIndexOf('//');
      const lastBlockComment = beforeMatch.lastIndexOf('/*');
      const lastBlockCommentEnd = beforeMatch.lastIndexOf('*/');
      const isInComment = 
        (lastLineComment > lastBlockCommentEnd && lastLineComment > lastBlockComment) ||
        (lastBlockComment > lastBlockCommentEnd);

      if (!isInString && !isInComment) {
        // Find the end of the function call (matching parentheses)
        let parenCount = 0;
        let endIndex = match.index + match[0].length;
        let foundEnd = false;

        for (let i = endIndex; i < content.length; i++) {
          if (content[i] === '(') parenCount++;
          if (content[i] === ')') {
            if (parenCount === 0) {
              endIndex = i + 1;
              foundEnd = true;
              break;
            }
            parenCount--;
          }
        }

        if (foundEnd) {
          results.push({
            match: content.substring(match.index, endIndex),
            startIndex: match.index,
            endIndex: endIndex,
            method: consoleMethod,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Convert console statement to logger statement
 */
function convertConsoleToLogger(
  consoleStatement: string,
  method: string
): string {
  const mapping = CONSOLE_MAPPINGS[method as keyof typeof CONSOLE_MAPPINGS];
  if (!mapping) return consoleStatement;

  // Extract the arguments
  const argsMatch = consoleStatement.match(/\(([\s\S]*)\)/);
  if (!argsMatch) return consoleStatement;

  const args = argsMatch[1].trim();

  // Handle different console patterns
  if (method === 'console.error') {
    // console.error can have error object as second arg
    // Try to detect if second arg is an Error
    const argsList = parseArguments(args);
    
    if (argsList.length === 2) {
      // Check if second arg looks like an error
      const secondArg = argsList[1].trim();
      if (secondArg.match(/^(err|error|e)\s*[,:]?\s*$/i) || 
          secondArg.includes('Error') ||
          secondArg.includes('Exception')) {
        // log.error(message, error, context?)
        return `log.error(${argsList[0]}, ${secondArg}${argsList.length > 2 ? ', ' + argsList.slice(2).join(', ') : ''})`;
      }
    }
    
    // Default: log.error(message, context?)
    if (argsList.length > 1) {
      // Multiple args - treat as message and context object
      return `log.error(${argsList[0]}, { ${argsList.slice(1).join(', ')} })`;
    }
    
    // Single arg - just message
    return `log.error(${args})`;
  }

  // For other methods, convert to logger.method(message, context?)
  const argsList = parseArguments(args);
  
  if (argsList.length > 1) {
    // Multiple args - try to create context object
    // If first arg is a string, treat it as message
    const firstArg = argsList[0].trim();
    if (firstArg.startsWith('"') || firstArg.startsWith("'") || firstArg.startsWith('`')) {
      // First is string message
      return `${mapping.method}(${firstArg}, { ${argsList.slice(1).join(', ')} })`;
    } else {
      // All args as context
      return `${mapping.method}({ ${argsList.join(', ')} }, '')`;
    }
  }

  // Single arg
  return `${mapping.method}(${args})`;
}

/**
 * Parse function arguments (simple parser)
 */
function parseArguments(args: string): string[] {
  if (!args) return [];
  
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < args.length; i++) {
    const char = args[i];
    const prevChar = i > 0 ? args[i - 1] : '';

    // Handle string escaping
    if (prevChar === '\\' && inString) {
      current += char;
      continue;
    }

    // Toggle string state
    if ((char === '"' || char === "'" || char === '`') && !inString) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (char === stringChar && inString) {
      inString = false;
      stringChar = '';
      current += char;
    } else if (!inString) {
      // Track parentheses depth
      if (char === '(' || char === '[' || char === '{') {
        depth++;
        current += char;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        // Comma at top level - split argument
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Check if file already imports logger
 */
function hasLoggerImport(content: string): { hasLogger: boolean; hasLog: boolean; importLine: number } {
  const lines = content.split('\n');
  let hasLogger = false;
  let hasLog = false;
  let importLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for default import: import logger from '@/utils/logger'
    if (line.match(/import\s+logger\s+from\s+['"]@\/utils\/logger['"]/)) {
      hasLogger = true;
      importLine = i;
    }
    
    // Check for named import: import { log } from '@/utils/logger'
    if (line.match(/import\s+.*\{[^}]*log[^}]*\}\s+from\s+['"]@\/utils\/logger['"]/)) {
      hasLog = true;
      if (importLine === -1) importLine = i;
    }
    
    // Check for combined import
    if (line.match(/import\s+logger\s*,\s*\{[^}]*log[^}]*\}\s+from\s+['"]@\/utils\/logger['"]/)) {
      hasLogger = true;
      hasLog = true;
      importLine = i;
    }
  }

  return { hasLogger, hasLog, importLine };
}

/**
 * Add logger import to file
 */
function addLoggerImport(content: string, needsLogger: boolean, needsLog: boolean): string {
  const lines = content.split('\n');
  const { hasLogger, hasLog, importLine } = hasLoggerImport(content);

  // Determine what imports we need
  const needLogger = needsLogger && !hasLogger;
  const needLog = needsLog && !hasLog;

  if (!needLogger && !needLog) {
    return content; // Already has what we need
  }

  // Build import statement
  let importStatement = '';
  if (needLogger && needLog) {
    importStatement = "import logger, { log } from '@/utils/logger';";
  } else if (needLogger) {
    importStatement = "import logger from '@/utils/logger';";
  } else if (needLog) {
    importStatement = "import { log } from '@/utils/logger';";
  }

  // Find best place to insert import (after other imports)
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      insertIndex = i + 1;
    } else if (insertIndex > 0 && lines[i].trim() === '') {
      // Found end of imports
      break;
    }
  }

  // If we need to update existing import
  if (importLine !== -1) {
    const existingLine = lines[importLine];
    if (needLogger && needLog) {
      lines[importLine] = "import logger, { log } from '@/utils/logger';";
    } else if (needLogger && !hasLogger) {
      // Add logger to existing import
      lines[importLine] = existingLine.replace(
        /import\s+\{([^}]*)\}\s+from/,
        `import logger, { $1 } from`
      );
    } else if (needLog && !hasLog) {
      // Add log to existing import
      if (existingLine.includes('import logger')) {
        lines[importLine] = existingLine.replace(
          /import\s+logger\s+from/,
          `import logger, { log } from`
        );
      } else {
        lines[importLine] = existingLine.replace(
          /\{([^}]*)\}/,
          `{ log, $1 }`
        );
      }
    }
    return lines.join('\n');
  }

  // Insert new import
  lines.splice(insertIndex, 0, importStatement);
  return lines.join('\n');
}

/**
 * Process a single file
 */
function processFile(filePath: string): FileResult {
  const result: FileResult = {
    file: filePath,
    replacements: [],
    importsAdded: [],
    hasErrors: false,
  };

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Find all console statements
    const consoleStatements = findConsoleStatements(content, 0);
    
    if (consoleStatements.length === 0) {
      return result; // No console statements found
    }

    // Determine what imports we need
    let needsLogger = false;
    let needsLog = false;

    for (const stmt of consoleStatements) {
      const mapping = CONSOLE_MAPPINGS[stmt.method as keyof typeof CONSOLE_MAPPINGS];
      if (mapping) {
        if (mapping.import === 'logger') needsLogger = true;
        if (mapping.import === 'log') needsLog = true;
      }
    }

    // Replace console statements (in reverse order to maintain indices)
    const sortedStatements = [...consoleStatements].sort((a, b) => b.startIndex - a.startIndex);
    
    for (const stmt of sortedStatements) {
      const replacement = convertConsoleToLogger(stmt.match, stmt.method);
      const lineNumber = content.substring(0, stmt.startIndex).split('\n').length;
      
      result.replacements.push({
        line: lineNumber,
        original: stmt.match,
        replacement: replacement,
        consoleMethod: stmt.method,
      });

      if (!isDryRun && !validateOnly) {
        content = content.substring(0, stmt.startIndex) + 
                  replacement + 
                  content.substring(stmt.endIndex);
      }
    }

    // Add imports if needed
    if ((needsLogger || needsLog) && !validateOnly) {
      const beforeImport = content;
      content = addLoggerImport(content, needsLogger, needsLog);
      
      if (content !== beforeImport) {
        if (needsLogger) result.importsAdded.push('logger');
        if (needsLog) result.importsAdded.push('log');
      }
    }

    // Write file if not dry run
    if (!isDryRun && !validateOnly && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
    }

  } catch (error: any) {
    result.hasErrors = true;
    result.error = error.message;
  }

  return result;
}

/**
 * Find all TypeScript/JavaScript files
 */
function findFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldSkipFile(filePath)) {
        findFiles(filePath, fileList);
      }
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) &&
      !shouldSkipFile(filePath)
    ) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Validate logger usage in files
 */
function validateLoggerUsage(filePath: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for console statements
    const consoleMatches = content.match(/console\.(log|error|warn|info|debug)\(/g);
    if (consoleMatches && consoleMatches.length > 0) {
      issues.push(`Found ${consoleMatches.length} console statement(s) that should use logger`);
    }

    // Check if logger is imported but not used
    const hasLoggerImport = content.includes("from '@/utils/logger'");
    const usesLogger = content.match(/\blogger\.(info|error|warn|debug|fatal)\(/) || 
                      content.match(/\blog\.(info|error|warn|debug|fatal)\(/);
    
    if (hasLoggerImport && !usesLogger) {
      issues.push('Logger imported but not used');
    }

    // Check if logger is used but not imported
    if (usesLogger && !hasLoggerImport) {
      issues.push('Logger used but not imported');
    }

  } catch (error: any) {
    issues.push(`Error reading file: ${error.message}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Main execution
 */
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  console.log(`🔍 Console to Logger Replacement Script`);
  console.log(`Project root: ${projectRoot}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : validateOnly ? 'VALIDATE ONLY' : 'REPLACE'}`);
  console.log('');

  let files: string[] = [];

  if (specificFile) {
    const fullPath = path.isAbsolute(specificFile) 
      ? specificFile 
      : path.join(projectRoot, specificFile);
    
    if (fs.existsSync(fullPath)) {
      files = [fullPath];
    } else {
      console.error(`❌ File not found: ${fullPath}`);
      process.exit(1);
    }
  } else {
    // Find all files
    files = findFiles(projectRoot);
  }

  console.log(`Found ${files.length} files to process\n`);

  const results: FileResult[] = [];
  let totalReplacements = 0;
  let totalFilesModified = 0;
  let totalErrors = 0;

  // Process files
  for (const file of files) {
    if (validateOnly) {
      const validation = validateLoggerUsage(file);
      if (!validation.isValid) {
        console.log(`⚠️  ${file}`);
        validation.issues.forEach(issue => console.log(`   - ${issue}`));
        totalErrors++;
      }
    } else {
      const result = processFile(file);
      results.push(result);

      if (result.replacements.length > 0 || result.importsAdded.length > 0) {
        totalFilesModified++;
        totalReplacements += result.replacements.length;

        const relativePath = path.relative(projectRoot, file);
        console.log(`📝 ${relativePath}`);
        
        if (result.replacements.length > 0) {
          console.log(`   ${result.replacements.length} replacement(s):`);
          result.replacements.forEach(rep => {
            console.log(`   Line ${rep.line}: ${rep.consoleMethod}`);
            if (isDryRun) {
              console.log(`     → ${rep.replacement}`);
            }
          });
        }

        if (result.importsAdded.length > 0) {
          console.log(`   Added imports: ${result.importsAdded.join(', ')}`);
        }

        if (result.hasErrors) {
          console.log(`   ❌ Error: ${result.error}`);
          totalErrors++;
        }
        console.log('');
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  if (validateOnly) {
    console.log(`Files with issues: ${totalErrors}`);
    console.log(`Files validated: ${files.length}`);
  } else {
    console.log(`Files processed: ${files.length}`);
    console.log(`Files modified: ${totalFilesModified}`);
    console.log(`Total replacements: ${totalReplacements}`);
    console.log(`Errors: ${totalErrors}`);
    
    if (isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No files were modified');
      console.log('Run without --dry-run to apply changes');
    } else if (totalReplacements > 0) {
      console.log('\n✅ Replacement complete!');
      console.log('Please review changes and test your application.');
    }
  }

  if (totalErrors > 0) {
    process.exit(1);
  }
}

// Run script
main();
