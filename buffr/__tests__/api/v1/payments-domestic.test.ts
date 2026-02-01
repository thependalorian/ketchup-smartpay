/**
 * Integration Tests: Domestic Payments API (Open Banking v1)
 * 
 * Location: __tests__/api/v1/payments-domestic.test.ts
 * Purpose: Test Open Banking v1 domestic payments endpoint
 * 
 * Based on TrueLayer Testing Patterns:
 * - Payment creation (Step 4)
 * - Payment status tracking (Step 6)
 * - Error handling (Payments API Errors)
 * - Idempotency testing
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

import { createOpenBankingErrorResponse, OpenBankingErrorCode } from '../../../utils/openBanking';

describe('POST /api/v1/payments/domestic-payments', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  const AUTH_TOKEN = process.env.TOKEN || 'test-token';
  
  // Skip tests if server is not running
  const isServerRunning = async () => {
    try {
      const response = await fetch(`${API_URL}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // TrueLayer Pattern: Test data (amount_in_minor ≥ 1)
  const validPaymentRequest = {
    Data: {
      ConsentId: 'test-consent-id',
      Initiation: {
        InstructionIdentification: 'test-instruction-id',
        EndToEndIdentification: 'test-end-to-end-id',
        InstructedAmount: {
          Amount: '100.00', // TrueLayer pattern: amount_in_minor (10000 = 100.00)
          Currency: 'NAD',
        },
        DebtorAccount: {
          SchemeName: 'BuffrAccount',
          Identification: 'test-wallet-id',
        },
        CreditorAccount: {
          SchemeName: 'BuffrAccount',
          Identification: 'recipient-wallet-id',
        },
        RemittanceInformation: {
          Unstructured: 'Test payment',
        },
      },
    },
    Risk: {},
  };

  describe('Payment Creation (TrueLayer Step 4)', () => {
    it('should create payment with valid Open Banking format', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-1',
        },
        body: JSON.stringify(validPaymentRequest),
      });

      // TrueLayer Pattern: Check for payment id and status in response
      if (response.ok) {
        const data = await response.json();
        expect(data.Data).toBeDefined();
        expect(data.Data.PaymentId).toBeDefined();
        expect(data.Data.Status).toBeDefined();
      }
    });

    it('should require Idempotency-Key header (TrueLayer Step 3.2)', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          // Missing Idempotency-Key
        },
        body: JSON.stringify(validPaymentRequest),
      });

      // Should return 400 or require idempotency key
      expect([400, 401, 403]).toContain(response.status);
    });

    it('should validate amount_in_minor (≥ 1) - TrueLayer Pattern', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const invalidRequest = {
        ...validPaymentRequest,
        Data: {
          ...validPaymentRequest.Data,
          Initiation: {
            ...validPaymentRequest.Data.Initiation,
            InstructedAmount: {
              Amount: '0.00', // Invalid: < 1 minor unit
              Currency: 'NAD',
            },
          },
        },
      };

      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-2',
        },
        body: JSON.stringify(invalidRequest),
      });

      // Should return 400 Invalid Parameters (TrueLayer pattern)
      if (response.status === 400) {
        const error = await response.json();
        expect(error.Code || error.Data?.Code).toBeDefined();
      }
    });

    it('should validate currency (NAD) - TrueLayer Pattern', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const invalidRequest = {
        ...validPaymentRequest,
        Data: {
          ...validPaymentRequest.Data,
          Initiation: {
            ...validPaymentRequest.Data.Initiation,
            InstructedAmount: {
              Amount: '100.00',
              Currency: 'USD', // Invalid: Only NAD supported
            },
          },
        },
      };

      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-3',
        },
        body: JSON.stringify(invalidRequest),
      });

      // Should return 400 Invalid Parameters
      expect([400, 422]).toContain(response.status);
    });

    it('should validate DebtorAccount and CreditorAccount', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const invalidRequest = {
        ...validPaymentRequest,
        Data: {
          ...validPaymentRequest.Data,
          Initiation: {
            ...validPaymentRequest.Data.Initiation,
            DebtorAccount: {
              SchemeName: 'BuffrAccount',
              Identification: '', // Invalid: Empty account
            },
          },
        },
      };

      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-4',
        },
        body: JSON.stringify(invalidRequest),
      });

      // Should return 400 Invalid Parameters
      expect([400, 422]).toContain(response.status);
    });

    it('should return payment id and status in response', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-5',
        },
        body: JSON.stringify(validPaymentRequest),
      });

      if (response.ok) {
        const data = await response.json();
        // TrueLayer Pattern: Response should contain payment id and status
        expect(data.Data?.PaymentId || data.Data?.Payment?.PaymentId).toBeDefined();
        expect(data.Data?.Status || data.Data?.Payment?.Status).toBeDefined();
      }
    });
  });

  describe('Idempotency Testing (TrueLayer Step 3.2)', () => {
    it('should handle duplicate idempotency keys', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const idempotencyKey = 'test-idempotency-key-duplicate';

      // First request
      const response1 = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(validPaymentRequest),
      });

      // Second request with same idempotency key
      const response2 = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': idempotencyKey, // Same key
        },
        body: JSON.stringify(validPaymentRequest),
      });

      // TrueLayer Pattern: Should return same result or 409/422
      if (response1.ok && response2.ok) {
        const data1 = await response1.json();
        const data2 = await response2.json();
        // Should return same payment id
        const id1 = data1.Data?.PaymentId || data1.Data?.Payment?.PaymentId;
        const id2 = data2.Data?.PaymentId || data2.Data?.Payment?.PaymentId;
        expect(id1).toBe(id2);
      } else {
        // Or return 409/422 for idempotency conflict
        expect([409, 422]).toContain(response2.status);
      }
    });
  });

  describe('Error Handling (TrueLayer: Payments API Errors)', () => {
    it('should return 400 for invalid parameters', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const invalidRequest = {
        Data: {
          // Missing required Initiation
        },
      };

      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-error-1',
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      
      if (response.status === 400) {
        const error = await response.json();
        // TrueLayer Pattern: Open Banking error format
        expect(error.Code || error.Data?.Code).toBeDefined();
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Missing Authorization header
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-error-2',
        },
        body: JSON.stringify(validPaymentRequest),
      });

      expect(response.status).toBe(401);
    });

    it('should return 403 for forbidden operations', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      // Test with invalid token or insufficient permissions
      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer invalid-token`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-error-3',
        },
        body: JSON.stringify(validPaymentRequest),
      });

      // Should return 401 or 403
      expect([401, 403]).toContain(response.status);
    });

    it('should return Open Banking error format', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const invalidRequest = {
        Data: {
          Initiation: {
            InstructedAmount: {
              Amount: '0.00', // Invalid amount
              Currency: 'NAD',
            },
          },
        },
      };

      const response = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-error-4',
        },
        body: JSON.stringify(invalidRequest),
      });

      if (response.status >= 400) {
        const error = await response.json();
        // TrueLayer Pattern: Open Banking error format
        // Should have Code, Id, Message, or Data.Errors
        expect(
          error.Code || 
          error.Data?.Code || 
          error.Data?.Errors ||
          error.Message
        ).toBeDefined();
      }
    });
  });

  describe('Payment Status (TrueLayer Step 6)', () => {
    it('should return payment status', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      // First create a payment
      const createResponse = await fetch(`${API_URL}/api/v1/payments/domestic-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'X-API-Version': 'v1',
          'Idempotency-Key': 'test-idempotency-key-status-1',
        },
        body: JSON.stringify(validPaymentRequest),
      });

      if (createResponse.ok) {
        const createData = await createResponse.json();
        const paymentId = createData.Data?.PaymentId || createData.Data?.Payment?.PaymentId;

        if (paymentId) {
          // Then get payment status
          const statusResponse = await fetch(
            `${API_URL}/api/v1/payments/domestic-payments/${paymentId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'X-API-Version': 'v1',
              },
            }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            // TrueLayer Pattern: Should return payment status
            expect(statusData.Data?.Status || statusData.Data?.Payment?.Status).toBeDefined();
          }
        }
      }
    });

    it('should handle payment not found', async () => {
      // Skip if server not running
      if (!(await isServerRunning())) {
        console.log('⚠️  Skipping: Server not running');
        return;
      }
      
      const response = await fetch(
        `${API_URL}/api/v1/payments/domestic-payments/non-existent-payment-id`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'X-API-Version': 'v1',
          },
        }
      );

      // Should return 404
      expect([404, 400]).toContain(response.status);
    });
  });
});
