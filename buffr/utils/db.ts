/**
 * Database Utility
 * 
 * Location: utils/db.ts
 * Purpose: Centralized Neon PostgreSQL database connection and query utilities
 * 
 * Features:
 * - Type-safe database queries
 * - Connection pooling for serverless
 * - Error handling
 * - Parameterized queries (SQL injection prevention)
 */

import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import logger, { log } from './logger';

// Lazy-initialized SQL client to prevent errors during client-side bundling
let _sql: NeonQueryFunction<false, false> | null = null;

// Get database URL from environment
const getDatabaseUrl = (): string | null => {
  // Only available server-side
  if (typeof window !== 'undefined') {
    return null;
  }
  
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;
  return dbUrl || null;
};

// Get the SQL client (lazy initialization)
const getSql = (): NeonQueryFunction<false, false> => {
  if (_sql) return _sql;
  
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error('DATABASE_URL or NEON_CONNECTION_STRING environment variable is required. This function can only be called server-side.');
  }
  
  _sql = neon(dbUrl);
  return _sql;
};

// Proxy for lazy SQL access
const sql = new Proxy({} as NeonQueryFunction<false, false>, {
  apply(_, __, args: [TemplateStringsArray, ...any[]]) {
    const sqlFn = getSql();
    return sqlFn(args[0], ...args.slice(1));
  },
  get(_, prop) {
    return (getSql() as any)[prop];
  }
}) as NeonQueryFunction<false, false>;

/**
 * Execute a parameterized SQL query
 * @param query SQL query with placeholders ($1, $2, etc.)
 * @param params Query parameters
 * @returns Query results
 */
export async function query<T = any>(
  queryText: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const sqlFn = getSql();
    
    // Neon serverless supports:
    // 1. Template literals: sql`SELECT * FROM table WHERE id = ${value}`
    // 2. sql.query() method for $1, $2 placeholders (if available)
    // 3. sql.unsafe() for raw SQL without parameters
    
    if (params.length === 0) {
      // No parameters - use unsafe for raw SQL (DDL, etc.)
      const result = await (sqlFn as any).unsafe(queryText);
      return (Array.isArray(result) ? result : result?.rows || []) as T[];
    }
    
    // Try to use .query() method if available (for $1, $2 placeholders)
    if ((sqlFn as any).query && typeof (sqlFn as any).query === 'function') {
      try {
        const result = await (sqlFn as any).query(queryText, params);
        if (Array.isArray(result)) {
          return result as T[];
        } else if (result && result.rows && Array.isArray(result.rows)) {
          return result.rows as T[];
        }
      } catch (queryError: any) {
        // If .query() fails, fall back to template literal conversion
        if (!queryError.message?.includes('tagged-template')) {
          throw queryError;
        }
      }
    }
    
    // Fallback: Convert $1, $2, etc. placeholders to template literal format
    // This is safe because params are already validated
    const parts: string[] = [];
    const values: any[] = [];
    let lastIndex = 0;
    
    // Find all $1, $2, etc. placeholders in order
    const placeholderRegex = /\$(\d+)/g;
    const matches: Array<{ index: number; num: number }> = [];
    let match;
    
    while ((match = placeholderRegex.exec(queryText)) !== null) {
      const placeholderNum = parseInt(match[1]);
      matches.push({ index: match.index, num: placeholderNum });
    }
    
    // Sort by position to process in order
    matches.sort((a, b) => a.index - b.index);
    
    // Build parts and values arrays
    for (const match of matches) {
      const placeholderIndex = match.num - 1; // Convert to 0-based
      
      if (placeholderIndex >= 0 && placeholderIndex < params.length) {
        // Add text before placeholder
        parts.push(queryText.substring(lastIndex, match.index));
        // Add parameter value
        values.push(params[placeholderIndex]);
        lastIndex = match.index + `$${match.num}`.length;
      }
    }
    
    // Add remaining text after last placeholder
    if (lastIndex < queryText.length) {
      parts.push(queryText.substring(lastIndex));
    }
    
    // If no placeholders were found but params were provided, use unsafe (shouldn't happen)
    if (parts.length === 1 && values.length === 0) {
      const result = await (sqlFn as any).unsafe(queryText);
      return (Array.isArray(result) ? result : result?.rows || []) as T[];
    }
    
    // Build template literal: sql`part1${value1}part2${value2}part3`
    // Neon expects: sql(['part1', 'part2', 'part3'], value1, value2)
    // Create a proper TemplateStringsArray with raw property
    const templateParts = Object.assign(parts, { raw: parts }) as any as TemplateStringsArray;
    const result = await sqlFn(templateParts, ...values);
    
    // Neon returns array directly
    if (Array.isArray(result)) {
      return result as T[];
    } else if (result && result.rows && Array.isArray(result.rows)) {
      return result.rows as T[];
    } else {
      return [] as T[];
    }
  } catch (error) {
    log.error('Database query error', error, { query: queryText.substring(0, 100) });
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a single row query (returns first row or null)
 */
export async function queryOne<T = any>(
  queryText: string,
  params: any[] = []
): Promise<T | null> {
  const results = await query<T>(queryText, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a query that should return exactly one row
 * @throws Error if no rows or multiple rows returned
 */
export async function queryOneRequired<T = any>(
  queryText: string,
  params: any[] = []
): Promise<T> {
  const results = await query<T>(queryText, params);
  
  if (results.length === 0) {
    throw new Error('Expected one row but got zero');
  }
  
  if (results.length > 1) {
    throw new Error('Expected one row but got multiple');
  }
  
  return results[0];
}

/**
 * Execute a transaction (multiple queries in sequence)
 */
export async function transaction<T>(
  queries: Array<{ query: string; params?: any[] }>
): Promise<T[]> {
  const results: T[] = [];
  
  // Note: Neon serverless doesn't support explicit transactions
  // For transactions, we need to use a transaction block or connection pooling
  // For now, execute queries sequentially
  for (const { query: queryText, params = [] } of queries) {
    const result = await query<T>(queryText, params);
    results.push(...result);
  }
  
  return results;
}

/**
 * Get current user ID from request
 * Uses JWT authentication via Bearer token
 * 
 * Authentication flow:
 * 1. Check Authorization header for Bearer token
 * 2. Verify JWT token signature and expiration
 * 3. Return user_id from token payload if valid
 * 4. No development fallback - JWT required in all environments
 */
export async function getUserIdFromRequest(req: any): Promise<string | null> {
  // This function is only available server-side
  if (typeof window !== 'undefined') {
    logger.warn('getUserIdFromRequest should only be called server-side');
    return null;
  }

  try {
    // Get authorization header
    const authHeader = req?.headers?.get?.('authorization') || req?.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Extract and verify JWT token
    const token = authHeader.substring(7);

    // Import JWT verification function (server-side only)
    try {
      const { getUserIdFromToken } = await import('./authServer');
      const userId = getUserIdFromToken(token, 'access');

      if (userId) {
        return userId;
      }
    } catch (importError) {
      // authServer not available (blocked in client bundle)
      logger.warn('authServer not available - JWT verification skipped');
      return null;
    }

    // Token is invalid or expired
    return null;
  } catch (error) {
    log.error('Error extracting user ID from request', error);
    return null;
  }
}

/**
 * Check if user is authorized to access resource
 */
export async function checkUserAuthorization(
  userId: string,
  resourceType: 'wallet' | 'transaction' | 'contact' | 'group',
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'wallet':
        const wallet = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM wallets WHERE id = $1',
          [resourceId]
        );
        return wallet?.user_id === userId;
        
      case 'transaction':
        const transaction = await queryOne<{ from_user_id: string; to_user_id: string }>(
          'SELECT from_user_id, to_user_id FROM transactions WHERE id = $1',
          [resourceId]
        );
        return transaction?.from_user_id === userId || transaction?.to_user_id === userId;
        
      case 'contact':
        const contact = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM contacts WHERE id = $1',
          [resourceId]
        );
        return contact?.user_id === userId;
        
      case 'group':
        const group = await queryOne<{ owner_id: string }>(
          'SELECT owner_id FROM groups WHERE id = $1',
          [resourceId]
        );
        return group?.owner_id === userId;
        
      default:
        return false;
    }
  } catch (error) {
    log.error('Authorization check error', error, { userId, resourceId, resourceType });
    return false;
  }
}

/**
 * Fetch user name from users or contacts table
 */
export async function getUserName(userId: string, currentUserId?: string): Promise<string> {
  try {
    // Import adapter
    const { mapUserRow, findUserId } = await import('./db-adapters');

    // Find actual user ID (handle UUID or external_id)
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      // Try contacts if user not found
      if (currentUserId) {
        const contact = await queryOne<{ name: string }>(
          'SELECT name FROM contacts WHERE user_id = $1 AND (phone = $2 OR id::text = $2)',
          [currentUserId, userId]
        );
        if (contact?.name) return contact.name;
      }
      return 'User';
    }

    // Get user from users table
    const user = await queryOne<any>(
      'SELECT * FROM users WHERE id = $1',
      [actualUserId]
    );

    if (user) {
      const mapped = mapUserRow(user);
      return mapped.full_name || mapped.first_name || mapped.last_name || user.external_id || 'User';
    }

    return 'User';
  } catch (error) {
    log.error('Error fetching user name', error, { userId });
    return 'User';
  }
}

/**
 * Fetch user phone number
 */
export async function getUserPhone(userId: string): Promise<string> {
  try {
    const user = await queryOne<{ phone_number: string | null }>(
      'SELECT phone_number FROM users WHERE id = $1',
      [userId]
    );

    return user?.phone_number || '';
  } catch (error) {
    log.error('Error fetching user phone', error, { userId });
    return '';
  }
}

/**
 * Fetch multiple user names in batch
 */
export async function getUserNamesBatch(userIds: string[], currentUserId?: string): Promise<Record<string, string>> {
  try {
    // Import adapter
    const { mapUserRow, findUserId } = await import('./db-adapters');

    const names: Record<string, string> = {};

    // Try to find actual user IDs first
    const actualUserIds: string[] = [];
    const userIdMap: Record<string, string> = {};

    for (const userId of userIds) {
      const actualId = await findUserId(query, userId);
      if (actualId) {
        actualUserIds.push(actualId);
        userIdMap[actualId] = userId;
      }
    }

    // Fetch from users table
    if (actualUserIds.length > 0) {
      const users = await query<any>(
        `SELECT * FROM users WHERE id = ANY($1)`,
        [actualUserIds]
      );

      for (const user of users) {
        const originalId = userIdMap[user.id] || user.id;
        const mapped = mapUserRow(user);
        names[originalId] = mapped.full_name || mapped.first_name || mapped.last_name || user.external_id || 'User';
      }
    }

    // Fill in missing names with fallback
    for (const userId of userIds) {
      if (!names[userId]) {
        names[userId] = 'User';
      }
    }

    return names;
  } catch (error) {
    log.error('Error fetching user names batch', error, { userIds: userIds.length });
    // Return fallback for all
    const fallback: Record<string, string> = {};
    userIds.forEach(id => fallback[id] = 'User');
    return fallback;
  }
}

// Re-export findUserId for convenience
export { findUserId } from './db-adapters';

// Export sql client for advanced usage
export { sql };
