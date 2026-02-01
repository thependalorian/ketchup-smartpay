import logger, { log } from '@/utils/logger';
/**
 * Environment Variable Validation
 * 
 * Location: utils/envValidation.ts
 * Purpose: Validate required environment variables and fail fast on startup
 * 
 * This ensures production deployments have all required configuration
 * and prevents security vulnerabilities from development fallbacks.
 */

/**
 * List of required environment variables for production
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY', // Required for data encryption at rest
] as const;

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  NODE_ENV: 'development',
  ALLOW_DEV_FALLBACK: 'false',
  EXCHANGE_RATE_API_KEY: '',
  EXCHANGE_RATE_API_BASE: 'https://api.exchangerate.host',
  ADUMO_CLIENT_ID: '',
  ADUMO_CLIENT_SECRET: '',
  ADUMO_BASE_URL: 'https://api.adumo.com',
  FINERACT_URL: '',
  FINERACT_TENANT: 'default',
  FINERACT_API_KEY: '',
} as const;

/**
 * Validate environment variables on startup
 * @throws Error if required variables are missing or security settings are invalid
 */
export function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Security checks
  if (process.env.NODE_ENV === 'production') {
    // In production, ALLOW_DEV_FALLBACK must be false or unset
    if (process.env.ALLOW_DEV_FALLBACK === 'true') {
      errors.push(
        'CRITICAL SECURITY: ALLOW_DEV_FALLBACK cannot be true in production. ' +
        'This is a security vulnerability that allows unauthorized access.'
      );
    }

    // In production, ensure JWT secrets are set and not default values
    if (process.env.JWT_SECRET === 'your-secret-key-here' || 
        process.env.JWT_SECRET === 'dev-secret' ||
        !process.env.JWT_SECRET) {
      errors.push(
        'CRITICAL SECURITY: JWT_SECRET must be set to a secure random value in production. ' +
        'Do not use default or placeholder values.'
      );
    }

    if (process.env.JWT_REFRESH_SECRET === 'your-refresh-secret-here' ||
        process.env.JWT_REFRESH_SECRET === 'dev-refresh-secret' ||
        !process.env.JWT_REFRESH_SECRET) {
      errors.push(
        'CRITICAL SECURITY: JWT_REFRESH_SECRET must be set to a secure random value in production. ' +
        'Do not use default or placeholder values.'
      );
    }

    // Validate ENCRYPTION_KEY in production
    if (!process.env.ENCRYPTION_KEY) {
      errors.push(
        'CRITICAL SECURITY: ENCRYPTION_KEY must be set in production. ' +
        'This is required for data encryption at rest. ' +
        'Generate a key using: npx tsx scripts/generate-encryption-key.ts'
      );
    } else if (process.env.ENCRYPTION_KEY.length < 32) {
      errors.push(
        'CRITICAL SECURITY: ENCRYPTION_KEY must be at least 32 characters long. ' +
        'Current length: ' + process.env.ENCRYPTION_KEY.length + '. ' +
        'Generate a secure key using: npx tsx scripts/generate-encryption-key.ts'
      );
    } else if (process.env.ENCRYPTION_KEY === 'default-key-change-in-production') {
      errors.push(
        'CRITICAL SECURITY: ENCRYPTION_KEY cannot be the default value in production. ' +
        'Generate a secure key using: npx tsx scripts/generate-encryption-key.ts'
      );
    }
  }

  // Development warnings
  if (process.env.NODE_ENV === 'development') {
    if (process.env.ALLOW_DEV_FALLBACK === 'true') {
      warnings.push(
        'WARNING: ALLOW_DEV_FALLBACK is enabled. This should be disabled before production deployment.'
      );
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      warnings.push(
        'WARNING: JWT_SECRET should be at least 32 characters for security.'
      );
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment Variable Warnings:');
    warnings.forEach(warning => logger.warn(`  - ${warning}`));
  }

  // Throw errors (fail fast)
  if (errors.length > 0) {
    log.error('Environment Variable Validation Failed:');
    errors.forEach(error => log.error(`  ❌ ${error}`));
    throw new Error(
      `Environment validation failed:\n${errors.join('\n')}\n\n` +
      'Please check your .env file and ensure all required variables are set correctly.'
    );
  }

  logger.info('✅ Environment variables validated successfully');
}

/**
 * Get environment variable with optional default
 */
export function getEnv(key: keyof typeof OPTIONAL_ENV_VARS, defaultValue?: string): string {
  return process.env[key] || defaultValue || OPTIONAL_ENV_VARS[key] || '';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if development fallback is allowed (should only be true in development)
 */
export function isDevFallbackAllowed(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.ALLOW_DEV_FALLBACK === 'true';
}

