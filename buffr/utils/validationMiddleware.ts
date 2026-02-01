/**
 * Validation Middleware for API Routes
 *
 * Location: utils/validationMiddleware.ts
 * Purpose: Schema-based request validation middleware
 *
 * Security Benefits:
 * - Input validation at the API boundary
 * - Prevents SQL injection, XSS, and other attacks
 * - Provides consistent error responses for invalid data
 * - Type-safe validation with TypeScript inference
 *
 * Usage:
 * ```typescript
 * import { withValidation, schemas } from '@/utils/validationMiddleware';
 *
 * export const POST = withValidation(
 *   schemas.sendMoney,
 *   async (req, body) => {
 *     // body is typed as SendMoneyRequest
 *     const { amount, recipient, note } = body;
 *     // ... handler logic
 *   }
 * );
 * ```
 */

import { validationErrorResponse, errorResponse, HttpStatus } from './apiResponse';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Schema definition for validation
 */
export interface ValidationSchema<T> {
  validate: (data: unknown) => ValidationResult<T>;
}

/**
 * Create a validation schema from a validation function
 */
export function createSchema<T>(
  validator: (data: unknown) => ValidationResult<T>
): ValidationSchema<T> {
  return { validate: validator };
}

/**
 * Common validation helpers
 */
export const validators = {
  required: (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  string: (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }
    return null;
  },

  number: (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'number' || isNaN(value)) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  positiveNumber: (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  email: (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },

  phone: (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }
    // Namibian phone format: +264XXXXXXXXX or 0XXXXXXXXX
    const phoneRegex = /^(\+264|0)[0-9]{9}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return `${fieldName} must be a valid Namibian phone number`;
    }
    return null;
  },

  minLength: (min: number) => (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'string' || value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number) => (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'string' || value.length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return null;
  },

  minValue: (min: number) => (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'number' || value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  maxValue: (max: number) => (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'number' || value > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return null;
  },

  oneOf: <T extends string | number>(allowed: T[]) => (value: unknown, fieldName: string): string | null => {
    if (!allowed.includes(value as T)) {
      return `${fieldName} must be one of: ${allowed.join(', ')}`;
    }
    return null;
  },

  uuid: (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return `${fieldName} must be a valid UUID`;
    }
    return null;
  },

  date: (value: unknown, fieldName: string): string | null => {
    if (typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${fieldName} must be a valid date`;
    }
    return null;
  },

  optional: (validator: (value: unknown, fieldName: string) => string | null) =>
    (value: unknown, fieldName: string): string | null => {
      if (value === undefined || value === null || value === '') {
        return null; // Skip validation for optional empty values
      }
      return validator(value, fieldName);
    },
};

/**
 * Field validator type
 */
type FieldValidator = (value: unknown, fieldName: string) => string | null;

/**
 * Create a schema from field definitions
 */
export function createObjectSchema<T extends Record<string, unknown>>(
  fields: { [K in keyof T]: FieldValidator | FieldValidator[] }
): ValidationSchema<T> {
  return createSchema((data: unknown) => {
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        errors: { _root: 'Request body must be an object' },
      };
    }

    const errors: Record<string, string> = {};
    const obj = data as Record<string, unknown>;

    for (const [fieldName, fieldValidators] of Object.entries(fields)) {
      const validatorArray = Array.isArray(fieldValidators) ? fieldValidators : [fieldValidators];
      const value = obj[fieldName];

      for (const validator of validatorArray) {
        const error = validator(value, fieldName);
        if (error) {
          errors[fieldName] = error;
          break; // Stop at first error for this field
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: obj as T };
  });
}

/**
 * Pre-built schemas for common operations
 */
export const schemas = {
  /**
   * Send money request validation
   */
  sendMoney: createObjectSchema<{
    amount: number;
    recipient: string;
    walletId?: string;
    note?: string;
  }>({
    amount: [validators.required, validators.positiveNumber, validators.maxValue(1000000)],
    recipient: [validators.required, validators.string, validators.minLength(3)],
    walletId: validators.optional(validators.string),
    note: validators.optional(validators.maxLength(200)),
  }),

  /**
   * Create wallet request validation
   */
  createWallet: createObjectSchema<{
    name: string;
    type?: string;
    currency?: string;
    purpose?: string;
  }>({
    name: [validators.required, validators.string, validators.minLength(1), validators.maxLength(50)],
    type: validators.optional(validators.oneOf(['personal', 'business', 'savings', 'investment', 'bills', 'travel', 'budget'])),
    currency: validators.optional(validators.string),
    purpose: validators.optional(validators.maxLength(200)),
  }),

  /**
   * Login request validation
   */
  login: createObjectSchema<{
    phone: string;
    otp?: string;
  }>({
    phone: [validators.required, validators.phone],
    otp: validators.optional(validators.minLength(6)),
  }),

  /**
   * Add card request validation
   */
  addCard: createObjectSchema<{
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  }>({
    cardNumber: [validators.required, validators.string, validators.minLength(16), validators.maxLength(19)],
    cardholderName: [validators.required, validators.string, validators.minLength(2)],
    expiryDate: [validators.required, validators.string], // Format: MM/YY
    cvv: [validators.required, validators.string, validators.minLength(3), validators.maxLength(4)],
  }),

  /**
   * User profile update validation
   */
  updateProfile: createObjectSchema<{
    firstName?: string;
    lastName?: string;
    email?: string;
  }>({
    firstName: validators.optional(validators.minLength(1)),
    lastName: validators.optional(validators.minLength(1)),
    email: validators.optional(validators.email),
  }),

  /**
   * Loan application validation
   */
  loanApplication: createObjectSchema<{
    amount: number;
    term: number;
    purpose: string;
  }>({
    amount: [validators.required, validators.positiveNumber, validators.minValue(100), validators.maxValue(100000)],
    term: [validators.required, validators.positiveNumber, validators.oneOf([3, 6, 12, 24, 36])],
    purpose: [validators.required, validators.string, validators.minLength(10), validators.maxLength(500)],
  }),
};

/**
 * Validation middleware wrapper for API routes
 *
 * Usage:
 * ```typescript
 * export const POST = withValidation(schemas.sendMoney, async (req, body) => {
 *   const { amount, recipient, note } = body;
 *   // ... handler logic
 *   return successResponse({ transactionId: '123' });
 * });
 * ```
 */
export function withValidation<T, H extends (req: Request, body: T, ...args: any[]) => Promise<Response>>(
  schema: ValidationSchema<T>,
  handler: H
): (req: Request, ...args: any[]) => Promise<Response> {
  return async (req: Request, ...args: any[]) => {
    let body: unknown;

    try {
      body = await req.json();
    } catch (error) {
      return errorResponse('Invalid JSON body', HttpStatus.BAD_REQUEST);
    }

    const result = schema.validate(body);

    if (!result.success) {
      return validationErrorResponse(result.errors || { _root: 'Validation failed' });
    }

    return handler(req, result.data as T, ...args);
  };
}

/**
 * Validate request body without middleware
 *
 * Usage:
 * ```typescript
 * const body = await parseAndValidate(req, schemas.sendMoney);
 * if (body instanceof Response) {
 *   return body; // Return error response
 * }
 * // body is now typed correctly
 * ```
 */
export async function parseAndValidate<T>(
  req: Request,
  schema: ValidationSchema<T>
): Promise<T | Response> {
  let body: unknown;

  try {
    body = await req.json();
  } catch (error) {
    return errorResponse('Invalid JSON body', HttpStatus.BAD_REQUEST);
  }

  const result = schema.validate(body);

  if (!result.success) {
    return validationErrorResponse(result.errors || { _root: 'Validation failed' });
  }

  return result.data as T;
}

export default withValidation;
