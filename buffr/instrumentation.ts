/**
 * Next.js Instrumentation Hook
 * 
 * Location: instrumentation.ts (root of app directory)
 * Purpose: Initialize application-wide services and validate environment on startup
 * 
 * This file runs once when the Next.js server starts (not on every request).
 * Use it to:
 * - Validate environment variables
 * - Initialize database connections
 * - Set up monitoring/logging
 * - Perform startup checks
 * 
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { validateEnvironment } from '@/utils/envValidation';
import { validateFineractEnvironment, logValidationResults } from '@/utils/fineractEnvValidation';
import logger from '@/utils/logger';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // This code runs only on the Node.js server (not in Edge runtime)
    
    try {
      // Validate environment variables on startup
      // This will throw an error if required variables are missing or invalid
      validateEnvironment();
      
      logger.info('✅ Next.js server initialized successfully');
      logger.info('✅ Environment variables validated');
      
      // Validate Fineract configuration (if Fineract is enabled)
      const fineractEnabled = process.env.FINERACT_WRITE_URL || process.env.FINERACT_API_URL;
      if (fineractEnabled) {
        logger.info('🔍 Validating Fineract configuration...');
        const fineractValidation = await validateFineractEnvironment();
        logValidationResults(fineractValidation);
        
        if (!fineractValidation.valid && process.env.NODE_ENV === 'production') {
          throw new Error(
            `Fineract environment validation failed:\n${fineractValidation.errors.join('\n')}`
          );
        }
      } else {
        logger.info('ℹ️  Fineract integration not configured (FINERACT_WRITE_URL or FINERACT_API_URL not set)');
      }
      
      // Additional startup checks can be added here:
      // - Database connection test
      // - External service health checks
      // - Configuration validation
      
    } catch (error: any) {
      // Log error but don't crash the server in development
      // In production, this should fail fast
      logger.error('❌ Server initialization failed:', error);
      
      if (process.env.NODE_ENV === 'production') {
        // In production, fail fast on validation errors
        throw error;
      } else {
        // In development, log warning but continue
        logger.warn('⚠️  Continuing in development mode despite validation errors');
      }
    }
  }
}
