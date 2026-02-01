/**
 * Unit Tests: Open Banking Utilities
 * 
 * Location: __tests__/utils/openBanking.test.ts
 * Purpose: Test Open Banking utility functions
 * 
 * Based on TrueLayer Testing Patterns:
 * - Error response format
 * - Pagination format
 * - API versioning
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

import {
  createOpenBankingErrorResponse,
  createOpenBankingPaginatedResponse,
  OpenBankingErrorCode,
  createErrorDetail,
  extractApiVersion,
  API_VERSION,
} from '../../utils/openBanking';

describe('Open Banking Utilities', () => {
  describe('createOpenBankingErrorResponse', () => {
    it('should create error response with Code, Id, Message (TrueLayer Pattern)', () => {
      const error = createOpenBankingErrorResponse(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid field format',
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_INVALID_FORMAT,
            'Amount must be ≥ 1',
            'Data.Initiation.InstructedAmount.Amount'
          ),
        ]
      );

      // TrueLayer Pattern: Open Banking error format
      expect(error.Code).toBeDefined();
      expect(error.Id).toBeDefined();
      expect(error.Message).toBeDefined();
      expect(error.Errors).toBeDefined();
      expect(error.Errors?.length).toBeGreaterThan(0);
    });

    it('should include Errors array when provided', () => {
      const error = createOpenBankingErrorResponse(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient funds',
        [
          createErrorDetail(
            OpenBankingErrorCode.INSUFFICIENT_FUNDS,
            'Account balance is insufficient',
            'Data.Initiation.InstructedAmount.Amount'
          ),
        ]
      );

      expect(error.Errors).toBeDefined();
      expect(error.Errors?.length).toBe(1);
      expect(error.Errors?.[0].ErrorCode).toBe(OpenBankingErrorCode.INSUFFICIENT_FUNDS);
    });

    it('should handle error without details', () => {
      const error = createOpenBankingErrorResponse(
        OpenBankingErrorCode.SERVER_ERROR,
        'Unknown error occurred'
      );

      expect(error.Code).toBeDefined();
      expect(error.Message).toBe('Unknown error occurred');
      expect(error.Errors).toBeUndefined();
    });
  });

  describe('createOpenBankingPaginatedResponse', () => {
    it('should create paginated response with Links and Meta (TrueLayer Pattern)', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const paginated = createOpenBankingPaginatedResponse(
        data,
        'Transactions', // dataKey
        '/api/v1/transactions',
        1, // page
        10, // pageSize
        25 // total
      );

      // TrueLayer Pattern: Open Banking pagination format
      expect(paginated.Data).toBeDefined();
      expect(paginated.Data.Links).toBeDefined();
      expect(paginated.Data.Meta).toBeDefined();
      expect(paginated.Data.Links.Self).toBeDefined();
      expect(paginated.Data.Meta.TotalPages).toBe(3); // 25 items / 10 per page = 3 pages
    });

    it('should calculate total pages correctly', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: `${i + 1}` }));
      const paginated = createOpenBankingPaginatedResponse(
        data,
        'Transactions',
        '/api/v1/transactions',
        1,
        10,
        25 // total
      );

      expect(paginated.Data.Meta.TotalPages).toBe(3);
      // Note: TotalRecords is not in the Meta interface, only TotalPages
    });

    it('should include pagination links', () => {
      const data = [{ id: '1' }];
      const paginated = createOpenBankingPaginatedResponse(
        data,
        'Transactions',
        '/api/v1/transactions',
        2, // page 2
        10,
        25
      );

      // TrueLayer Pattern: Pagination links
      expect(paginated.Data.Links.Self).toContain('page=2');
      expect(paginated.Data.Links.First).toBeDefined();
      expect(paginated.Data.Links.Last).toBeDefined();
      expect(paginated.Data.Links.Prev).toBeTruthy(); // Page 2 has previous (not null)
      expect(paginated.Data.Links.Next).toBeTruthy(); // Page 2 has next (not null)
    });

    it('should handle first page (no previous link)', () => {
      const data = [{ id: '1' }];
      const paginated = createOpenBankingPaginatedResponse(
        data,
        'Transactions',
        '/api/v1/transactions',
        1, // first page
        10,
        25
      );

      expect(paginated.Data.Links.Prev).toBeNull(); // null for first page
      expect(paginated.Data.Links.Next).toBeTruthy(); // has next
    });

    it('should handle last page (no next link)', () => {
      const data = [{ id: '1' }];
      const paginated = createOpenBankingPaginatedResponse(
        data,
        'Transactions',
        '/api/v1/transactions',
        3, // last page (25 items / 10 per page = 3 pages)
        10,
        25
      );

      expect(paginated.Data.Links.Prev).toBeTruthy(); // has previous
      expect(paginated.Data.Links.Next).toBeNull(); // null for last page
    });
  });

  describe('extractApiVersion', () => {
    it('should extract API version from request', () => {
      const request = new Request('https://api.buffr.com/api/v1/payments/domestic-payments');

      const version = extractApiVersion(request);
      expect(version).toBe(API_VERSION.V1);
    });

    it('should extract version from URL path', () => {
      const request = new Request('https://api.buffr.com/api/v1/transactions');

      const version = extractApiVersion(request);
      expect(version).toBe(API_VERSION.V1);
    });

    it('should return null for legacy endpoints', () => {
      const request = new Request('https://api.buffr.com/api/transactions'); // No version in path

      const version = extractApiVersion(request);
      expect(version).toBeNull();
    });
  });

  describe('createErrorDetail', () => {
    it('should create error detail with required fields', () => {
      const errorDetail = createErrorDetail(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Amount must be ≥ 1',
        'Data.Initiation.InstructedAmount.Amount'
      );

      expect(errorDetail.ErrorCode).toBe(OpenBankingErrorCode.FIELD_INVALID_FORMAT);
      expect(errorDetail.Message).toBe('Amount must be ≥ 1');
      expect(errorDetail.Path).toBe('Data.Initiation.InstructedAmount.Amount');
    });

    it('should handle error detail without path', () => {
      const errorDetail = createErrorDetail(
        OpenBankingErrorCode.SERVER_ERROR,
        'Unknown error'
      );

      expect(errorDetail.ErrorCode).toBeDefined();
      expect(errorDetail.Message).toBe('Unknown error');
      expect(errorDetail.Path).toBeUndefined();
    });
  });
});
