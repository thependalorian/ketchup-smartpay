# Console to Logger Replacement Scripts

## Overview

These scripts help replace `console.log`, `console.error`, `console.warn`, `console.info`, and `console.debug` statements with the structured logger utility (`@/utils/logger`).

## Files

1. **`replace-console-with-logger.js`** - Main replacement script (Node.js/CommonJS)
2. **`replace-console-with-logger.ts`** - TypeScript version (if using tsx)
3. **`validate-logger-usage.sh`** - Quick validation script (bash)

## Usage

### 1. Validate Current State

Check how many console statements exist:

```bash
# Quick validation
./scripts/validate-logger-usage.sh

# Or use the Node.js script
node scripts/replace-console-with-logger.js --validate-only
```

### 2. Dry Run (Preview Changes)

See what would be changed without making changes:

```bash
# All files
node scripts/replace-console-with-logger.js --dry-run

# Specific file
node scripts/replace-console-with-logger.js --dry-run --file app/api/payments/send.ts
```

### 3. Apply Changes

Replace console statements with logger:

```bash
# All files
node scripts/replace-console-with-logger.js

# Specific file
node scripts/replace-console-with-logger.js --file app/api/payments/send.ts
```

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would be changed without making changes |
| `--validate-only` | Only validate existing logger usage |
| `--file <path>` | Process only specific file (relative to project root) |

## Console Method Mappings

| Console Method | Logger Replacement | Import Needed |
|---------------|-------------------|---------------|
| `console.log()` | `logger.info()` | `logger` |
| `console.error()` | `log.error()` | `log` |
| `console.warn()` | `logger.warn()` | `logger` |
| `console.info()` | `logger.info()` | `logger` |
| `console.debug()` | `logger.debug()` | `logger` |

## Examples

### Before
```typescript
console.log('User logged in', { userId: '123' });
console.error('Payment failed', error);
console.warn('Low balance', { balance: 100 });
```

### After
```typescript
import logger, { log } from '@/utils/logger';

logger.info('User logged in', { userId: '123' });
log.error('Payment failed', error);
logger.warn('Low balance', { balance: 100 });
```

## Special Handling

### console.error with Error Object

The script detects when `console.error` is called with an Error object as the second argument:

```typescript
// Before
console.error('Payment failed', error);

// After
log.error('Payment failed', error);
```

### Multiple Arguments

When multiple arguments are provided, the script creates a context object:

```typescript
// Before
console.log('User action', { userId: '123', action: 'login' });

// After
logger.info('User action', { userId: '123', action: 'login' });
```

## Files Skipped

The script automatically skips:
- `node_modules/`
- `.git/`
- `.expo/`
- `dist/`, `build/`, `.next/`
- `__tests__/`
- `backups/`
- `.claude/`
- Markdown files (`.md`)
- JSON files (`.json`)
- Script files (kept for CLI output)

## Import Management

The script automatically:
- ✅ Adds missing logger imports
- ✅ Updates existing imports to include needed exports
- ✅ Combines imports when both `logger` and `log` are needed

## Validation

After running the replacement, validate the changes:

```bash
# Check for remaining console statements
./scripts/validate-logger-usage.sh

# Or
node scripts/replace-console-with-logger.js --validate-only
```

## Best Practices

1. **Always run with `--dry-run` first** to review changes
2. **Test after replacement** to ensure functionality
3. **Review imports** to ensure correct logger usage
4. **Check error handling** - `log.error()` handles Error objects specially

## Troubleshooting

### Script doesn't find files
- Ensure you're running from project root
- Check file paths are correct
- Verify files aren't in skipped directories

### Import issues
- Manually review imports after replacement
- Ensure `@/utils/logger` path is correct for your setup
- Check TypeScript path aliases in `tsconfig.json`

### Replacement doesn't work
- Check if console statement is in a string or comment
- Verify file isn't in skip list
- Review the dry-run output for details

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate Logger Usage
  run: |
    node scripts/replace-console-with-logger.js --validate-only
    if [ $? -ne 0 ]; then
      echo "❌ Console statements found. Use logger instead."
      exit 1
    fi
```

## Related Files

- `utils/logger.ts` - Logger utility implementation
- `CODEBASE_AUDIT_REPORT.md` - Audit report mentioning console.log usage
