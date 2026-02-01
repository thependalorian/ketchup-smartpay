/**
 * Comprehensive Error Handling Tests
 * 
 * Location: __tests__/api/error-handling.test.ts
 * Purpose: Verify error responses are consistent across all API endpoints
 * 
 * Phase 4: Add comprehensive error handling tests
 * - Verify error responses are consistent
 * - Test all error response helpers
 * - Test security wrapper error handling
 * - Test validation error responses
 */

import {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitResponse,
  paginatedResponse,
  HttpStatus,
} from '../../utils/apiResponse';

describe('API Error Handling - Standardized Response Helpers', () => {
  describe('successResponse', () => {
    it('should return 200 OK with success: true and data', async () => {
      const response = successResponse({ id: '123', name: 'Test' });
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: '123', name: 'Test' });
    });

    it('should include optional message', async () => {
      const response = successResponse({ id: '123' }, 'Operation successful');
      const body = await response.json();

      expect(body.message).toBe('Operation successful');
    });

    it('should handle null data', async () => {
      const response = successResponse(null);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.success).toBe(true);
      expect(body.data).toBeNull();
    });
  });

  describe('errorResponse', () => {
    it('should return 500 by default', async () => {
      const response = errorResponse('Internal server error');
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
    });

    it('should accept custom status code', async () => {
      const response = errorResponse('Not found', HttpStatus.NOT_FOUND);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Not found');
    });

    it('should handle all error status codes', async () => {
      const statusCodes = [
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.NOT_FOUND,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.TOO_MANY_REQUESTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ];

      for (const status of statusCodes) {
        const response = errorResponse('Error message', status);
        expect(response.status).toBe(status);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Error message');
      }
    });
  });

  describe('createdResponse', () => {
    it('should return 201 Created with data', async () => {
      const response = createdResponse({ id: '123', name: 'New Resource' });
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: '123', name: 'New Resource' });
    });

    it('should include Location header when provided', () => {
      const response = createdResponse(
        { id: '123' },
        '/api/resources/123'
      );

      expect(response.headers.get('Location')).toBe('/api/resources/123');
    });

    it('should not include Location header when not provided', () => {
      const response = createdResponse({ id: '123' });

      expect(response.headers.get('Location')).toBeNull();
    });
  });

  describe('noContentResponse', () => {
    it('should return 204 No Content with null body', () => {
      const response = noContentResponse();

      expect(response.status).toBe(HttpStatus.NO_CONTENT);
      expect(response.body).toBeNull();
    });
  });

  describe('validationErrorResponse', () => {
    it('should return 422 with validation errors', async () => {
      const errors = {
        email: 'Invalid email format',
        password: 'Password must be at least 8 characters',
      };
      const response = validationErrorResponse(errors);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.errors).toEqual(errors);
    });

    it('should accept custom error message', async () => {
      const errors = { field: 'Error message' };
      const response = validationErrorResponse(errors, 'Custom validation message');
      const body = await response.json();

      expect(body.error).toBe('Custom validation message');
    });
  });

  describe('notFoundResponse', () => {
    it('should return 404 with resource name', async () => {
      const response = notFoundResponse('User');
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User not found');
    });

    it('should include ID when provided', async () => {
      const response = notFoundResponse('User', '123');
      const body = await response.json();

      expect(body.error).toBe("User with ID '123' not found");
    });
  });

  describe('unauthorizedResponse', () => {
    it('should return 401 with default message', async () => {
      const response = unauthorizedResponse();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Authentication required');
    });

    it('should accept custom message', async () => {
      const response = unauthorizedResponse('Invalid token');
      const body = await response.json();

      expect(body.error).toBe('Invalid token');
    });
  });

  describe('forbiddenResponse', () => {
    it('should return 403 with default message', async () => {
      const response = forbiddenResponse();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Permission denied');
    });

    it('should accept custom message', async () => {
      const response = forbiddenResponse('Admin access required');
      const body = await response.json();

      expect(body.error).toBe('Admin access required');
    });
  });

  describe('rateLimitResponse', () => {
    it('should return 429 with Retry-After header', async () => {
      const response = rateLimitResponse(60);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(body.success).toBe(false);
      expect(body.error).toBe('Too many requests');
      expect(body.retryAfter).toBe(60);
    });

    it('should accept custom message', async () => {
      const response = rateLimitResponse(30, 'Rate limit exceeded');
      const body = await response.json();

      expect(body.error).toBe('Rate limit exceeded');
    });
  });

  describe('paginatedResponse', () => {
    it('should return paginated data with metadata', async () => {
      const data = [{ id: '1' }, { id: '2' }];
      const pagination = { page: 1, limit: 10, total: 25 };
      const response = paginatedResponse(data, pagination);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.meta.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        hasMore: true,
      });
    });

    it('should correctly calculate hasMore', async () => {
      const data = [{ id: '1' }];
      const pagination = { page: 3, limit: 10, total: 25 };
      const response = paginatedResponse(data, pagination);
      const body = await response.json();

      expect(body.meta.pagination.hasMore).toBe(false); // 3 * 10 = 30 > 25
    });
  });

  describe('Response Consistency', () => {
    it('should have consistent structure for all success responses', async () => {
      const responses = [
        successResponse({ data: 'test' }),
        createdResponse({ id: '123' }),
        paginatedResponse([], { page: 1, limit: 10, total: 0 }),
      ];

      for (const response of responses) {
        const body = await response.json();
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(true);
        expect(body).toHaveProperty('data');
      }
    });

    it('should have consistent structure for all error responses', async () => {
      const responses = [
        errorResponse('Error', HttpStatus.BAD_REQUEST),
        notFoundResponse('Resource'),
        unauthorizedResponse('Auth failed'),
        forbiddenResponse('Access denied'),
        validationErrorResponse({ field: 'error' }),
        rateLimitResponse(60),
      ];

      for (const response of responses) {
        const body = await response.json();
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(false);
        expect(body).toHaveProperty('error');
      }
    });

    it('should always include Content-Type header', () => {
      const responses = [
        successResponse({}),
        errorResponse('Error'),
        createdResponse({}),
        validationErrorResponse({}),
      ];

      for (const response of responses) {
        expect(response.headers.get('Content-Type')).toBe('application/json');
      }
    });
  });

  describe('Error Message Consistency', () => {
    it('should use consistent error message format', async () => {
      const testCases = [
        { response: errorResponse('User not found'), expected: 'User not found' },
        { response: notFoundResponse('User', '123'), expected: "User with ID '123' not found" },
        { response: unauthorizedResponse('Invalid token'), expected: 'Invalid token' },
        { response: forbiddenResponse('Admin required'), expected: 'Admin required' },
      ];

      for (const { response, expected } of testCases) {
        const body = await response.json();
        expect(body.error).toBe(expected);
      }
    });
  });

  describe('Status Code Consistency', () => {
    it('should use correct status codes for each response type', () => {
      expect(successResponse({}).status).toBe(HttpStatus.OK);
      expect(createdResponse({}).status).toBe(HttpStatus.CREATED);
      expect(noContentResponse().status).toBe(HttpStatus.NO_CONTENT);
      expect(errorResponse('Error', HttpStatus.BAD_REQUEST).status).toBe(HttpStatus.BAD_REQUEST);
      expect(notFoundResponse('Resource').status).toBe(HttpStatus.NOT_FOUND);
      expect(unauthorizedResponse().status).toBe(HttpStatus.UNAUTHORIZED);
      expect(forbiddenResponse().status).toBe(HttpStatus.FORBIDDEN);
      expect(validationErrorResponse({}).status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(rateLimitResponse(60).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
});
