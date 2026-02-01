/**
 * Fineract Environment Variable Validation
 * 
 * Location: utils/fineractEnvValidation.ts
 * Purpose: Validate Fineract environment variables and configuration
 * 
 * Validates:
 * - Database version requirements (PostgreSQL ≥17.0 OR MariaDB ≥11.5.2)
 * - Timezone configuration (UTC mandatory)
 * - SSL/TLS configuration (HTTPS mandatory in production)
 * - Multi-instance configuration
 */

import logger from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DatabaseVersion {
  type: 'postgresql' | 'mariadb';
  version: string;
  major: number;
  minor: number;
  patch: number;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate database version
 * 
 * Requirements:
 * - PostgreSQL ≥17.0
 * - MariaDB ≥11.5.2
 */
export function validateDatabaseVersion(versionString: string): {
  valid: boolean;
  version?: DatabaseVersion;
  error?: string;
} {
  try {
    // Parse version string (e.g., "PostgreSQL 17.0" or "10.11.2-MariaDB")
    const postgresMatch = versionString.match(/PostgreSQL\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
    const mariadbMatch = versionString.match(/(\d+)\.(\d+)\.(\d+)-MariaDB/i);

    if (postgresMatch) {
      const major = parseInt(postgresMatch[1], 10);
      const minor = parseInt(postgresMatch[2], 10);
      const patch = postgresMatch[3] ? parseInt(postgresMatch[3], 10) : 0;

      if (major < 17) {
        return {
          valid: false,
          error: `PostgreSQL version ${major}.${minor} is below minimum required version 17.0`,
        };
      }

      return {
        valid: true,
        version: {
          type: 'postgresql',
          version: `${major}.${minor}.${patch}`,
          major,
          minor,
          patch,
        },
      };
    }

    if (mariadbMatch) {
      const major = parseInt(mariadbMatch[1], 10);
      const minor = parseInt(mariadbMatch[2], 10);
      const patch = parseInt(mariadbMatch[3], 10);

      if (major < 11 || (major === 11 && minor < 5) || (major === 11 && minor === 5 && patch < 2)) {
        return {
          valid: false,
          error: `MariaDB version ${major}.${minor}.${patch} is below minimum required version 11.5.2`,
        };
      }

      return {
        valid: true,
        version: {
          type: 'mariadb',
          version: `${major}.${minor}.${patch}`,
          major,
          minor,
          patch,
        },
      };
    }

    return {
      valid: false,
      error: `Unable to parse database version: ${versionString}`,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Error validating database version: ${error}`,
    };
  }
}

/**
 * Validate timezone configuration
 * 
 * Requirements:
 * - TZ environment variable must be UTC
 * - Database timezone must be UTC
 */
export function validateTimezone(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check TZ environment variable
  const tz = process.env.TZ;
  if (!tz || tz.toUpperCase() !== 'UTC') {
    errors.push(`TZ environment variable must be set to UTC (current: ${tz || 'not set'})`);
  }

  // Check JAVA_OPTS for timezone
  const javaOpts = process.env.JAVA_OPTS || '';
  if (!javaOpts.includes('-Duser.timezone=UTC')) {
    warnings.push('JAVA_OPTS should include -Duser.timezone=UTC for Fineract JVM');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate SSL/TLS configuration
 * 
 * Requirements:
 * - SSL enabled in production
 * - CA-signed certificates (not self-signed) in production
 */
export function validateSSL(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isProduction = process.env.NODE_ENV === 'production';
  const sslEnabled = process.env.FINERACT_SERVER_SSL_ENABLED === 'true';

  if (isProduction && !sslEnabled) {
    errors.push('SSL must be enabled in production (FINERACT_SERVER_SSL_ENABLED=true)');
  }

  if (sslEnabled) {
    const keystore = process.env.FINERACT_SERVER_SSL_KEYSTORE;
    const keystorePassword = process.env.FINERACT_SERVER_SSL_KEYSTORE_PASSWORD;

    if (!keystore) {
      errors.push('SSL keystore path must be set (FINERACT_SERVER_SSL_KEYSTORE)');
    }

    if (!keystorePassword) {
      errors.push('SSL keystore password must be set (FINERACT_SERVER_SSL_KEYSTORE_PASSWORD)');
    }

    if (isProduction) {
      const certType = process.env.SSL_CERT_TYPE;
      if (certType === 'development' || !certType) {
        warnings.push('Production should use CA-signed certificates (SSL_CERT_TYPE=production)');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multi-instance configuration
 * 
 * Checks if multi-instance URLs are configured correctly
 */
export function validateMultiInstanceConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const writeUrl = process.env.FINERACT_WRITE_URL;
  const readUrls = process.env.FINERACT_READ_URLS;
  const batchUrl = process.env.FINERACT_BATCH_URL;

  // Check if multi-instance is configured
  if (!writeUrl && !readUrls) {
    // Single instance mode (fallback) - OK for development
    if (process.env.NODE_ENV === 'production') {
      warnings.push('Multi-instance configuration not set. Using single-instance mode (not recommended for production)');
    }
    return {
      valid: true,
      errors: [],
      warnings,
    };
  }

  // Validate write instance
  if (!writeUrl) {
    errors.push('FINERACT_WRITE_URL must be set for multi-instance configuration');
  } else if (!writeUrl.startsWith('https://')) {
    errors.push('FINERACT_WRITE_URL must use HTTPS');
  }

  // Validate read instances
  if (!readUrls) {
    warnings.push('FINERACT_READ_URLS not set. Read operations will use write instance');
  } else {
    const urls = readUrls.split(',').map(url => url.trim());
    if (urls.length < 2 && process.env.NODE_ENV === 'production') {
      warnings.push('Production should have at least 2 read instances for redundancy');
    }
    urls.forEach((url, index) => {
      if (!url.startsWith('https://')) {
        errors.push(`FINERACT_READ_URLS[${index}] must use HTTPS: ${url}`);
      }
    });
  }

  // Validate batch instance (optional)
  if (!batchUrl && process.env.NODE_ENV === 'production') {
    warnings.push('FINERACT_BATCH_URL not set. Batch operations will use write instance');
  } else if (batchUrl && !batchUrl.startsWith('https://')) {
    errors.push('FINERACT_BATCH_URL must use HTTPS');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive validation of all Fineract environment variables
 */
export async function validateFineractEnvironment(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate timezone
  const tzValidation = validateTimezone();
  errors.push(...tzValidation.errors);
  warnings.push(...tzValidation.warnings);

  // Validate SSL
  const sslValidation = validateSSL();
  errors.push(...sslValidation.errors);
  warnings.push(...sslValidation.warnings);

  // Validate multi-instance configuration
  const instanceValidation = validateMultiInstanceConfig();
  errors.push(...instanceValidation.errors);
  warnings.push(...instanceValidation.warnings);

  // Database version validation (requires database connection)
  // This should be called separately after database connection is established
  // See validateDatabaseVersion() function

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate database version by querying the database
 * 
 * Requires database connection to be established
 */
export async function validateDatabaseVersionFromDB(
  queryFn: (sql: string) => Promise<Array<{ version: string }>>
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Query database version
    const result = await queryFn('SELECT version() as version');
    if (result.length === 0) {
      errors.push('Unable to query database version');
      return { valid: false, errors, warnings };
    }

    const versionString = result[0].version;
    const validation = validateDatabaseVersion(versionString);

    if (!validation.valid) {
      errors.push(validation.error || 'Database version validation failed');
    } else if (validation.version) {
      logger.info(`Database version validated: ${validation.version.type} ${validation.version.version}`);
    }

    // Check database timezone
    const tzResult = await queryFn("SELECT current_setting('timezone') as timezone");
    if (tzResult.length > 0) {
      const dbTimezone = tzResult[0].timezone;
      if (dbTimezone.toUpperCase() !== 'UTC') {
        errors.push(`Database timezone must be UTC (current: ${dbTimezone})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error: any) {
    errors.push(`Error validating database: ${error.message}`);
    return {
      valid: false,
      errors,
      warnings,
    };
  }
}

/**
 * Log validation results
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.valid) {
    logger.info('✅ Fineract environment validation passed');
  } else {
    logger.error('❌ Fineract environment validation failed');
  }

  if (result.errors.length > 0) {
    logger.error('Errors:');
    result.errors.forEach(error => logger.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    logger.warn('Warnings:');
    result.warnings.forEach(warning => logger.warn(`  - ${warning}`));
  }
}
