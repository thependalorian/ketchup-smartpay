/**
 * Console to Logger Replacement Script
 * 
 * Location: scripts/replace-console-with-logger.js
 * Purpose: Replace console.log/error/warn/info/debug with logger utility
 * 
 * Usage:
 *   node scripts/replace-console-with-logger.js [--dry-run] [--validate-only] [--file <path>]
 * 
 * Options:
 *   --dry-run: Show what would be changed without making changes
 *   --validate-only: Only validate existing logger usage
 *   --file <path>: Process only specific file
 */

const fs = require('fs');
const path = require('path');

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
  'replace-console-with-logger.js',
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

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath) {
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
 * Find all console statements in content
 */
function findConsoleStatements(content) {
  const results = [];
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    
    // Match console.method( patterns
    for (const [consoleMethod, mapping] of Object.entries(CONSOLE_MAPPINGS)) {
      const regex = new RegExp(consoleMethod.replace('.', '\\.') + '\\s*\\(', 'g');
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        // Check if it's in a string or comment
        const beforeMatch = line.substring(0, match.index);
        
        // Check for comments
        if (beforeMatch.includes('//')) {
          continue;
        }
        
        // Check for strings (simple check)
        const singleQuotes = (beforeMatch.match(/'/g) || []).length;
        const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
        const backticks = (beforeMatch.match(/`/g) || []).length;
        const isInString = (singleQuotes % 2 !== 0) || (doubleQuotes % 2 !== 0) || (backticks % 2 !== 0);
        
        if (!isInString) {
          // Find the full statement (until semicolon or end of line)
          let fullStatement = line.substring(match.index);
          const semicolonIndex = fullStatement.indexOf(';');
          if (semicolonIndex !== -1) {
            fullStatement = fullStatement.substring(0, semicolonIndex + 1);
          }
          
          results.push({
            line: lineNum + 1,
            match: fullStatement.trim(),
            method: consoleMethod,
            startIndex: match.index,
            fullLine: line,
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
function convertConsoleToLogger(consoleStatement, method) {
  const mapping = CONSOLE_MAPPINGS[method];
  if (!mapping) return consoleStatement;

  // Remove semicolon if present
  const hasSemicolon = consoleStatement.endsWith(';');
  const statement = hasSemicolon ? consoleStatement.slice(0, -1) : consoleStatement;

  // Extract arguments
  const argsMatch = statement.match(/\(([\s\S]*)\)/);
  if (!argsMatch) return consoleStatement;

  const args = argsMatch[1].trim();

  // Handle console.error specially
  if (method === 'console.error') {
    // Try to parse arguments
    const argsList = parseArguments(args);
    
    // If we have 2+ args and first is a string message
    if (argsList.length >= 2) {
      const firstArg = argsList[0].trim();
      const secondArg = argsList[1].trim();
      
      // Check if first arg is a string (message)
      if (firstArg.startsWith('"') || firstArg.startsWith("'") || firstArg.startsWith('`')) {
        // Check if second arg looks like an error variable (err, error, e, or contains Error)
        if (secondArg === 'err' || 
            secondArg === 'error' || 
            secondArg === 'e' ||
            secondArg.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) && (
              secondArg.toLowerCase().includes('err') ||
              secondArg.includes('Error') ||
              secondArg.includes('Exception')
            )) {
          // log.error(message, error)
          const result = `log.error(${firstArg}, ${secondArg}${argsList.length > 2 ? ', ' + argsList.slice(2).join(', ') : ''})`;
          return hasSemicolon ? result + ';' : result;
        }
        
        // Multiple args but second isn't clearly an error - create context
        if (argsList.length > 2) {
          const context = argsList.slice(1).join(', ');
          const result = `log.error(${firstArg}, { ${context} })`;
          return hasSemicolon ? result + ';' : result;
        }
        
        // Two args: message and something else (treat as error if variable name)
        if (argsList.length === 2 && secondArg.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
          // Likely an error variable
          const result = `log.error(${firstArg}, ${secondArg})`;
          return hasSemicolon ? result + ';' : result;
        }
      }
    }
    
    // Single arg or default
    const result = `log.error(${args})`;
    return hasSemicolon ? result + ';' : result;
  }

  // For other methods
  const argsList = parseArguments(args);
  
  if (argsList.length > 1) {
    // Check if first is string message
    const firstArg = argsList[0].trim();
    if (firstArg.startsWith('"') || firstArg.startsWith("'") || firstArg.startsWith('`')) {
      // First is message, rest is context
      const context = argsList.slice(1).join(', ');
      const result = `${mapping.method}(${firstArg}, { ${context} })`;
      return hasSemicolon ? result + ';' : result;
    }
  }

  // Single arg
  const result = `${mapping.method}(${args})`;
  return hasSemicolon ? result + ';' : result;
}

/**
 * Simple argument parser
 */
function parseArguments(args) {
  if (!args) return [];
  
  // Simple split by comma, respecting strings and parentheses
  const result = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < args.length; i++) {
    const char = args[i];
    const prevChar = i > 0 ? args[i - 1] : '';

    if (prevChar === '\\' && inString) {
      current += char;
      continue;
    }

    if ((char === '"' || char === "'" || char === '`') && !inString) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (char === stringChar && inString) {
      inString = false;
      stringChar = '';
      current += char;
    } else if (!inString) {
      if (char === '(' || char === '[' || char === '{') {
        depth++;
        current += char;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
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
function hasLoggerImport(content) {
  const hasLogger = /import\s+logger\s+from\s+['"]@\/utils\/logger['"]/.test(content);
  const hasLog = /import\s+.*\{[^}]*log[^}]*\}\s+from\s+['"]@\/utils\/logger['"]/.test(content);
  const hasCombined = /import\s+logger\s*,\s*\{[^}]*log[^}]*\}\s+from\s+['"]@\/utils\/logger['"]/.test(content);
  
  return {
    hasLogger: hasLogger || hasCombined,
    hasLog: hasLog || hasCombined,
  };
}

/**
 * Add logger import to file
 */
function addLoggerImport(content, needsLogger, needsLog) {
  const { hasLogger, hasLog } = hasLoggerImport(content);

  const needLogger = needsLogger && !hasLogger;
  const needLog = needsLog && !hasLog;

  if (!needLogger && !needLog) {
    return content;
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

  // Find insertion point (after other imports)
  const lines = content.split('\n');
  let insertIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      insertIndex = i + 1;
    } else if (insertIndex > 0 && lines[i].trim() === '' && i > insertIndex) {
      break;
    }
  }

  // Check if we can update existing import
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("from '@/utils/logger'")) {
      if (needLogger && needLog && !hasLogger && !hasLog) {
        lines[i] = "import logger, { log } from '@/utils/logger';";
        return lines.join('\n');
      } else if (needLogger && !hasLogger) {
        if (line.includes('import { log }')) {
          lines[i] = "import logger, { log } from '@/utils/logger';";
        } else {
          lines[i] = line.replace(/import\s+\{/, 'import logger, {');
        }
        return lines.join('\n');
      } else if (needLog && !hasLog) {
        if (line.includes('import logger')) {
          lines[i] = line.replace(/import\s+logger\s+from/, 'import logger, { log } from');
        } else {
          lines[i] = line.replace(/\{([^}]*)\}/, `{ log, $1 }`);
        }
        return lines.join('\n');
      }
    }
  }

  // Insert new import
  lines.splice(insertIndex, 0, importStatement);
  return lines.join('\n');
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const result = {
    file: filePath,
    replacements: [],
    importsAdded: [],
    hasErrors: false,
    error: null,
  };

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Find all console statements
    const consoleStatements = findConsoleStatements(content);
    
    if (consoleStatements.length === 0) {
      return result;
    }

    // Determine what imports we need
    let needsLogger = false;
    let needsLog = false;

    for (const stmt of consoleStatements) {
      const mapping = CONSOLE_MAPPINGS[stmt.method];
      if (mapping) {
        if (mapping.import === 'logger') needsLogger = true;
        if (mapping.import === 'log') needsLog = true;
      }
    }

    // Replace console statements (process lines in reverse order)
    const lines = content.split('\n');
    const processedLines = [...lines];
    
    // Group by line number
    const statementsByLine = {};
    for (const stmt of consoleStatements) {
      if (!statementsByLine[stmt.line]) {
        statementsByLine[stmt.line] = [];
      }
      statementsByLine[stmt.line].push(stmt);
    }

    // Process each line
    for (const lineNum in statementsByLine) {
      const lineIndex = parseInt(lineNum) - 1;
      let line = processedLines[lineIndex];
      const statements = statementsByLine[lineNum];

      for (const stmt of statements) {
        const replacement = convertConsoleToLogger(stmt.match, stmt.method);
        
        result.replacements.push({
          line: parseInt(lineNum),
          original: stmt.match,
          replacement: replacement,
          consoleMethod: stmt.method,
        });

        if (!isDryRun && !validateOnly) {
          // Replace in line
          line = line.replace(stmt.match, replacement);
        }
      }

      processedLines[lineIndex] = line;
    }

    if (!isDryRun && !validateOnly) {
      content = processedLines.join('\n');
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

  } catch (error) {
    result.hasErrors = true;
    result.error = error.message;
  }

  return result;
}

/**
 * Find all TypeScript/JavaScript files
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    
    try {
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
    } catch (err) {
      // Skip files we can't access
    }
  }

  return fileList;
}

/**
 * Validate logger usage in files
 */
function validateLoggerUsage(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for console statements
    const consoleMatches = content.match(/console\.(log|error|warn|info|debug)\(/g);
    if (consoleMatches && consoleMatches.length > 0) {
      issues.push(`Found ${consoleMatches.length} console statement(s) that should use logger`);
    }

    // Check if logger is imported but not used
    const hasLoggerImport = content.includes("from '@/utils/logger'");
    const usesLogger = /\blogger\.(info|error|warn|debug|fatal)\(/.test(content) || 
                      /\blog\.(info|error|warn|debug|fatal)\(/.test(content);
    
    if (hasLoggerImport && !usesLogger) {
      issues.push('Logger imported but not used');
    }

    // Check if logger is used but not imported
    if (usesLogger && !hasLoggerImport) {
      issues.push('Logger used but not imported');
    }

  } catch (error) {
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

  let files = [];

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
    files = findFiles(projectRoot);
  }

  console.log(`Found ${files.length} files to process\n`);

  const results = [];
  let totalReplacements = 0;
  let totalFilesModified = 0;
  let totalErrors = 0;

  // Process files
  for (const file of files) {
    if (validateOnly) {
      const validation = validateLoggerUsage(file);
      if (!validation.isValid) {
        const relativePath = path.relative(projectRoot, file);
        console.log(`⚠️  ${relativePath}`);
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
