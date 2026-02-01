import logger, { log } from '@/utils/logger';
/**
 * Environment Variable Validation for AI Backend
 * 
 * Location: buffr_ai_ts/src/utils/envValidation.ts
 * Purpose: Validate required environment variables and fail fast on startup
 */

/**
 * Validate environment variables on startup
 * @throws Error if required variables are missing or security settings are invalid
 */
export function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  if (!process.env.DATABASE_URL) {
    errors.push('Missing required environment variable: DATABASE_URL');
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
  }

  // Development warnings
  if (process.env.NODE_ENV === 'development') {
    if (process.env.ALLOW_DEV_FALLBACK === 'true') {
      warnings.push(
        'WARNING: ALLOW_DEV_FALLBACK is enabled. This should be disabled before production deployment.'
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

