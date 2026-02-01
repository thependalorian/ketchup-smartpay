import { log } from '@/utils/logger';
/**
 * Centralized API Response Helpers
 *
 * Location: utils/apiResponse.ts
 * Purpose: DRY principle - Standardized JSON response patterns for all API routes
 *
 * Benefits:
 * - Consistent response structure across all endpoints
 * - Reduces boilerplate code in route handlers
 * - Type-safe response creation
 *
 * Response Format (following REST best practices):
 * ```json
 * {
 *   "success": true|false,
 *   "data": {...} | [...],
 *   "error": "Error message" (only on failure),
 *   "meta": { pagination, etc. } (optional)
 * }
 * ```
 */

/**
 * HTTP Status codes (commonly used)
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Create a JSON response for API routes
 * @param data - The data to send in the response
 * @param statusOrOptions - Either a status code number or an object with status property
 */
export const jsonResponse = (
  data: any,
  statusOrOptions: number | { status: number } = 200
): Response => {
  const status = typeof statusOrOptions === 'number'
    ? statusOrOptions
    : statusOrOptions.status;

  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Create a success response
 */
export const successResponse = <T>(data: T, message?: string): Response => {
  return jsonResponse({
    success: true,
    data,
    ...(message && { message }),
  });
};

/**
 * Create an error response
 */
export const errorResponse = (
  error: string,
  status: number = 500
): Response => {
  return jsonResponse({ success: false, error }, status);
};

/**
 * Create a created response (201 Created)
 */
export const createdResponse = <T>(data: T, location?: string): Response => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (location) {
    headers['Location'] = location;
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { status: HttpStatus.CREATED, headers }
  );
};

/**
 * Create a no content response (204 No Content)
 */
export const noContentResponse = (): Response => {
  return new Response(null, { status: HttpStatus.NO_CONTENT });
};

/**
 * Create a validation error response (422 Unprocessable Entity)
 */
export const validationErrorResponse = (
  errors: Record<string, string>,
  message: string = 'Validation failed'
): Response => {
  return jsonResponse(
    { success: false, error: message, errors },
    HttpStatus.UNPROCESSABLE_ENTITY
  );
};

/**
 * Create a not found response (404 Not Found)
 */
export const notFoundResponse = (resourceName: string, id?: string): Response => {
  const message = id
    ? `${resourceName} with ID '${id}' not found`
    : `${resourceName} not found`;
  return errorResponse(message, HttpStatus.NOT_FOUND);
};

/**
 * Create an unauthorized response (401 Unauthorized)
 */
export const unauthorizedResponse = (message: string = 'Authentication required'): Response => {
  return errorResponse(message, HttpStatus.UNAUTHORIZED);
};

/**
 * Create a forbidden response (403 Forbidden)
 */
export const forbiddenResponse = (message: string = 'Permission denied'): Response => {
  return errorResponse(message, HttpStatus.FORBIDDEN);
};

/**
 * Create a rate limit response (429 Too Many Requests)
 */
export const rateLimitResponse = (
  retryAfter: number,
  message: string = 'Too many requests'
): Response => {
  return new Response(
    JSON.stringify({ success: false, error: message, retryAfter }),
    {
      status: HttpStatus.TOO_MANY_REQUESTS,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
};

/**
 * Create a paginated response
 */
export const paginatedResponse = <T>(
  data: T[],
  pagination: { page: number; limit: number; total: number }
): Response => {
  const { page, limit, total } = pagination;
  return jsonResponse({
    success: true,
    data,
    meta: {
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    },
  });
};

/**
 * Parse request body as JSON with error handling
 */
export const parseJsonBody = async <T>(request: Request): Promise<T | Response> => {
  try {
    return await request.json() as T;
  } catch (error) {
    return errorResponse('Invalid JSON body', HttpStatus.BAD_REQUEST);
  }
};

/**
 * Wrap async handler with error handling
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      log.error('[API Error]', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return errorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }) as T;
};

/**
 * Enhanced error handler with detailed logging
 */
export const handleError = (
  error: unknown,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    requestId?: string;
    additionalInfo?: Record<string, any>;
  }
): Response => {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Enhanced logging with context
  const logContext = {
    error: errorMessage,
    stack: errorStack,
    ...context,
    timestamp: new Date().toISOString(),
  };

  log.error('[API Error Handler]', JSON.stringify(logContext, null, 2));

  // Determine appropriate status code
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  
  // Check for common error types
  if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    statusCode = HttpStatus.NOT_FOUND;
  } else if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
    statusCode = HttpStatus.UNAUTHORIZED;
  } else if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
    statusCode = HttpStatus.FORBIDDEN;
  } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    statusCode = HttpStatus.BAD_REQUEST;
  }

  // In production, don't expose stack traces
  const safeMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An internal server error occurred. Please try again later.'
    : errorMessage;

  return errorResponse(safeMessage, statusCode);
};

/**
 * Validate request body against schema
 */
export const validateRequestBody = <T>(
  body: any,
  schema: {
    [K in keyof T]: (value: any) => { valid: boolean; error?: string };
  }
): { valid: boolean; errors: Record<string, string>; data?: T } => {
  const errors: Record<string, string> = {};
  let allValid = true;

  for (const [key, validator] of Object.entries(schema)) {
    const value = body[key];
    const result = validator(value);
    if (!result.valid) {
      errors[key] = result.error || 'Validation failed';
      allValid = false;
    }
  }

  if (allValid) {
    return { valid: true, data: body as T, errors: {} };
  }

  return { valid: false, errors };
};
