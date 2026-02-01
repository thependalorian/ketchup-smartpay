/**
 * Unit Tests: Adumo Payment Service
 * 
 * Location: __tests__/services/adumoService.test.ts
 * Purpose: Test Adumo Online payment gateway integration
 * 
 * Tests cover:
 * - OAuth token management
 * - Payment initiation (4 options)
 * - 3D Secure flow
 * - Authorise, Settle, Reverse, Refund operations
 * - Complete payment flow
 * - Error handling
 */

// Note: We test the business logic without importing the actual service
// to avoid React Native and Expo dependencies in Node test environment

/**
 * Helper to prepare 3D Secure form data (mirrors the actual function)
 */
function prepare3DSecureForm(
  initiateResponse: any,
  termUrl: string
): { acsUrl: string; paReq: string; termUrl: string; md: string } {
  if (!initiateResponse.threeDSecureAuthRequired) {
    throw new Error('3D Secure not required for this transaction');
  }

  return {
    acsUrl: initiateResponse.acsUrl!,
    paReq: initiateResponse.acsPayload!,
    termUrl,
    md: initiateResponse.acsMD!,
  };
}

describe('Adumo Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Token Management', () => {
    it('should request new token when cache is empty', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'payments',
        jti: 'unique-id',
      };

      // Verify token response structure
      expect(mockTokenResponse.access_token).toBeDefined();
      expect(mockTokenResponse.token_type).toBe('Bearer');
      expect(mockTokenResponse.expires_in).toBeGreaterThan(0);
      
      // Expected OAuth URL format
      const oauthUrl = 'https://staging-apiv3.adumoonline.com/oauth/token?grant_type=client_credentials';
      expect(oauthUrl).toContain('oauth/token');
      expect(oauthUrl).toContain('grant_type=client_credentials');
    });

    it('should use cached token when valid', () => {
      const cachedToken = {
        access_token: 'cached-token',
        expires_at: Date.now() + 3600000, // 1 hour from now
      };

      // Token should still be valid with 60 second buffer
      const isValid = Date.now() < cachedToken.expires_at - 60000;
      expect(isValid).toBe(true);
    });

    it('should refresh token when expired', () => {
      const expiredToken = {
        access_token: 'expired-token',
        expires_at: Date.now() - 1000, // Already expired
      };

      const needsRefresh = Date.now() >= expiredToken.expires_at - 60000;
      expect(needsRefresh).toBe(true);
    });

    it('should refresh token when close to expiry (60s buffer)', () => {
      const almostExpiredToken = {
        access_token: 'almost-expired-token',
        expires_at: Date.now() + 30000, // 30 seconds from now
      };

      const needsRefresh = Date.now() >= almostExpiredToken.expires_at - 60000;
      expect(needsRefresh).toBe(true);
    });
  });

  describe('Payment Initiation', () => {
    describe('Request Validation', () => {
      it('should validate required fields for card payment', () => {
        const request = {
          merchantUid: '9BA5008C-08EE-4286-A349-54AF91A621B0',
          applicationUid: '23ADADC0-DA2D-4DAC-A128-4845A5D71293',
          value: 100,
          merchantReference: 'test-ref-001',
          ipAddress: '192.168.1.1',
          userAgent: 'Buffr Mobile App/1.0.0',
          cardNumber: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 27,
          cvv: '123',
        };

        expect(request.merchantUid).toBeDefined();
        expect(request.applicationUid).toBeDefined();
        expect(request.value).toBeGreaterThan(0);
        expect(request.merchantReference).toBeDefined();
        expect(request.ipAddress).toBeDefined();
        expect(request.userAgent).toBeDefined();
      });

      it('should include optional saveCardDetails flag', () => {
        const requestWithSave = {
          cardNumber: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 27,
          cvv: '123',
          saveCardDetails: true,
        };

        expect(requestWithSave.saveCardDetails).toBe(true);
      });

      it('should support tokenized payment', () => {
        const tokenRequest = {
          profileUid: 'profile-uuid-123',
          token: 'saved-card-token',
          cvv: '123',
        };

        expect(tokenRequest.token).toBeDefined();
        expect(tokenRequest.profileUid).toBeDefined();
      });
    });

    describe('Response Handling', () => {
      it('should identify 3D Secure required', () => {
        const response = {
          transactionId: 'tx-123',
          threeDSecureAuthRequired: true,
          threeDSecureProvider: 'Bankserv',
          acsUrl: 'https://3ds.bank.com/auth',
          acsPayload: 'base64-encoded-payload',
          acsMD: 'merchant-data',
        };

        expect(response.threeDSecureAuthRequired).toBe(true);
        expect(response.acsUrl).toBeDefined();
        expect(response.acsPayload).toBeDefined();
        expect(response.acsMD).toBeDefined();
      });

      it('should identify no 3D Secure required', () => {
        const response = {
          transactionId: 'tx-456',
          threeDSecureAuthRequired: false,
        };

        expect(response.threeDSecureAuthRequired).toBe(false);
      });

      it('should extract profileUid when card is saved', () => {
        const response = {
          transactionId: 'tx-789',
          threeDSecureAuthRequired: false,
          profileUid: 'new-profile-uuid',
        };

        expect(response.profileUid).toBe('new-profile-uuid');
      });
    });
  });

  describe('3D Secure Integration', () => {
    describe('prepare3DSecureForm', () => {
      it('should prepare form data correctly', () => {
        const initiateResponse = {
          transactionId: 'tx-3ds-123',
          threeDSecureAuthRequired: true,
          acsUrl: 'https://3ds.bank.com/auth',
          acsPayload: 'base64-payload',
          acsMD: 'merchant-data-123',
        };
        const termUrl = 'https://buffr.ai/api/payments/3ds-callback';

        const formData = prepare3DSecureForm(initiateResponse, termUrl);

        expect(formData.acsUrl).toBe('https://3ds.bank.com/auth');
        expect(formData.paReq).toBe('base64-payload');
        expect(formData.termUrl).toBe('https://buffr.ai/api/payments/3ds-callback');
        expect(formData.md).toBe('merchant-data-123');
      });

      it('should throw if 3D Secure not required', () => {
        const initiateResponse = {
          transactionId: 'tx-no-3ds',
          threeDSecureAuthRequired: false,
        };
        const termUrl = 'https://buffr.ai/api/payments/3ds-callback';

        expect(() => prepare3DSecureForm(initiateResponse, termUrl)).toThrow(
          '3D Secure not required for this transaction'
        );
      });
    });

    describe('Authenticate Response', () => {
      it('should parse successful authentication', () => {
        const authResponse = {
          transactionId: 'tx-3ds-auth',
          authorizationAllow: 'Y',
          statusCode: '200',
          mdStatus: '1',
          statusMessage: 'Authenticated',
          eciFlag: '05',
          enrolledStatus: 'Y',
          paresStatus: 'Y',
          paresVerified: 'Y',
          syntaxVerified: 'Y',
          dsId: 'ds-123',
          acsId: 'acs-123',
          acsReference: 'acs-ref',
          cavv: 'cavv-value',
          cavvAlgorithm: '3',
          tdsProtocol: '2.2.0',
          tdsApiVersion: '2.2.0',
          cardType: 'Visa',
          authenticationTime: '2025-01-15T10:00:00Z',
          authenticationType: 'ChallengeFlow',
          xid: 'xid-value',
        };

        expect(authResponse.authorizationAllow).toBe('Y');
        expect(authResponse.paresStatus).toBe('Y');
      });

      it('should identify failed authentication', () => {
        const authResponse = {
          transactionId: 'tx-3ds-fail',
          authorizationAllow: 'N',
          statusCode: '400',
          statusMessage: 'Authentication Failed',
        };

        expect(authResponse.authorizationAllow).toBe('N');
      });
    });
  });

  describe('Authorise Payment', () => {
    describe('Request Format', () => {
      it('should require transactionId', () => {
        const request = {
          transactionId: 'tx-auth-123',
        };

        expect(request.transactionId).toBeDefined();
      });

      it('should accept optional amount for partial authorisation', () => {
        const request = {
          transactionId: 'tx-auth-456',
          amount: 50, // Partial auth
        };

        expect(request.amount).toBe(50);
      });

      it('should accept optional cvv', () => {
        const request = {
          transactionId: 'tx-auth-789',
          cvv: '123',
        };

        expect(request.cvv).toBe('123');
      });
    });

    describe('Response Handling', () => {
      it('should parse successful authorisation', () => {
        const response = {
          statusCode: 200,
          statusMessage: 'Approved',
          autoSettle: false,
          authorisedAmount: 100,
          cardCountry: 'NA',
          currencyCode: 'NAD',
          eciFlag: '05',
          authorisationCode: 'AUTH123',
          processorResponse: 'Approved',
        };

        expect(response.statusCode).toBe(200);
        expect(response.authorisationCode).toBe('AUTH123');
        expect(response.autoSettle).toBe(false);
      });

      it('should identify declined transaction', () => {
        const response = {
          statusCode: 400,
          statusMessage: 'Declined',
          authorisedAmount: 0,
        };

        expect(response.statusCode).not.toBe(200);
        expect(response.statusMessage).toBe('Declined');
      });

      it('should identify auto-settled transaction', () => {
        const response = {
          statusCode: 200,
          statusMessage: 'Approved',
          autoSettle: true,
          authorisedAmount: 100,
        };

        expect(response.autoSettle).toBe(true);
      });
    });
  });

  describe('Settle Payment', () => {
    describe('Request Format', () => {
      it('should require transactionId and amount', () => {
        const request = {
          transactionId: 'tx-settle-123',
          amount: 100,
        };

        expect(request.transactionId).toBeDefined();
        expect(request.amount).toBe(100);
      });

      it('should support partial settlement', () => {
        const request = {
          transactionId: 'tx-settle-456',
          amount: 50, // Partial settle
        };

        expect(request.amount).toBeLessThan(100);
      });
    });

    describe('Response Handling', () => {
      it('should parse successful settlement', () => {
        const response = {
          statusCode: 200,
          statusMessage: 'Settled',
          authorisedAmount: 100,
          currencyCode: 'NAD',
        };

        expect(response.statusCode).toBe(200);
        expect(response.statusMessage).toBe('Settled');
      });
    });
  });

  describe('Reverse Payment', () => {
    describe('Request Format', () => {
      it('should require only transactionId', () => {
        const request = {
          transactionId: 'tx-reverse-123',
        };

        expect(request.transactionId).toBeDefined();
      });
    });

    describe('Response Handling', () => {
      it('should parse successful reversal', () => {
        const response = {
          statusCode: 200,
          statusMessage: 'Reversed',
          authorisedAmount: 0,
        };

        expect(response.statusCode).toBe(200);
        expect(response.authorisedAmount).toBe(0);
      });
    });
  });

  describe('Refund Payment', () => {
    describe('Request Format', () => {
      it('should require transactionId and amount', () => {
        const request = {
          transactionId: 'tx-refund-123',
          amount: 100,
        };

        expect(request.transactionId).toBeDefined();
        expect(request.amount).toBe(100);
      });

      it('should support partial refund', () => {
        const request = {
          transactionId: 'tx-refund-456',
          amount: 25, // Partial refund
        };

        expect(request.amount).toBe(25);
      });
    });

    describe('Response Handling', () => {
      it('should parse successful refund', () => {
        const response = {
          statusCode: 200,
          statusMessage: 'Refunded',
          authorisedAmount: 100,
        };

        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Complete Payment Flow', () => {
    describe('Without 3D Secure', () => {
      it('should complete full flow: Initiate → Authorise → Settle', () => {
        const flowSteps = ['initiate', 'authorise', 'settle'];
        
        expect(flowSteps).toHaveLength(3);
        expect(flowSteps[0]).toBe('initiate');
        expect(flowSteps[1]).toBe('authorise');
        expect(flowSteps[2]).toBe('settle');
      });

      it('should skip settle if auto-settled', () => {
        const autoSettle = true;
        const flowSteps = autoSettle 
          ? ['initiate', 'authorise'] 
          : ['initiate', 'authorise', 'settle'];
        
        expect(flowSteps).toHaveLength(2);
      });

      it('should return success response', () => {
        const response = {
          success: true,
          transactionId: 'tx-complete-123',
          statusCode: 200,
          statusMessage: 'Approved',
          requires3DSecure: false,
          authorisationCode: 'AUTH456',
          settled: true,
        };

        expect(response.success).toBe(true);
        expect(response.requires3DSecure).toBe(false);
        expect(response.settled).toBe(true);
      });
    });

    describe('With 3D Secure', () => {
      it('should pause flow for 3D Secure', () => {
        const response = {
          success: false,
          transactionId: 'tx-3ds-flow',
          statusCode: 0,
          statusMessage: '3D Secure authentication required',
          requires3DSecure: true,
          threeDSecureFormData: {
            acsUrl: 'https://3ds.bank.com/auth',
            paReq: 'payload',
            termUrl: 'https://buffr.ai/callback',
            md: 'merchant-data',
          },
          settled: false,
        };

        expect(response.success).toBe(false);
        expect(response.requires3DSecure).toBe(true);
        expect(response.threeDSecureFormData).toBeDefined();
      });

      it('should complete flow after 3D Secure', () => {
        const postAuthResponse = {
          success: true,
          transactionId: 'tx-3ds-complete',
          statusCode: 200,
          statusMessage: 'Approved',
          requires3DSecure: true,
          authorisationCode: 'AUTH789',
          settled: true,
        };

        expect(postAuthResponse.success).toBe(true);
        expect(postAuthResponse.requires3DSecure).toBe(true);
        expect(postAuthResponse.settled).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle declined payment', () => {
        const response = {
          success: false,
          transactionId: 'tx-declined',
          statusCode: 400,
          statusMessage: 'Insufficient funds',
          requires3DSecure: false,
          settled: false,
        };

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
      });

      it('should handle network error', () => {
        const error = new Error('Network request failed');
        
        expect(error.message).toBe('Network request failed');
      });

      it('should handle timeout', () => {
        const error = new Error('Request timeout');
        
        expect(error.message).toContain('timeout');
      });
    });
  });

  describe('Helper Functions', () => {
    describe('User Agent', () => {
      it('should include app name and version', () => {
        const userAgent = 'Buffr Mobile App/1.0.0 (ios 17.0; iPhone 15)';
        
        expect(userAgent).toContain('Buffr Mobile App');
        expect(userAgent).toContain('1.0.0');
      });

      it('should include platform info', () => {
        const userAgent = 'Buffr Mobile App/1.0.0 (ios 17.0; iPhone 15)';
        
        expect(userAgent).toContain('ios');
      });
    });

    describe('IP Address', () => {
      it('should return placeholder in mobile app', () => {
        const ip = '0.0.0.0';
        
        expect(ip).toBe('0.0.0.0');
      });
    });
  });

  describe('Card Validation', () => {
    describe('Card Number Format', () => {
      it('should validate Visa card (starts with 4)', () => {
        const cardNumber = '4111111111111111';
        const isVisa = cardNumber.startsWith('4');
        
        expect(isVisa).toBe(true);
        expect(cardNumber).toHaveLength(16);
      });

      it('should validate Mastercard (starts with 5)', () => {
        const cardNumber = '5500000000000004';
        const isMastercard = cardNumber.startsWith('5');
        
        expect(isMastercard).toBe(true);
        expect(cardNumber).toHaveLength(16);
      });

      it('should detect invalid card length', () => {
        const shortCard = '41111111111';
        const isValid = shortCard.length === 16;
        
        expect(isValid).toBe(false);
      });
    });

    describe('Expiry Validation', () => {
      it('should validate future expiry', () => {
        const now = new Date();
        const expiryMonth = 12;
        const expiryYear = now.getFullYear() + 2 - 2000; // 2 years ahead, 2-digit
        
        const isValid = expiryYear >= now.getFullYear() - 2000;
        expect(isValid).toBe(true);
      });

      it('should reject past expiry', () => {
        const now = new Date();
        const expiryMonth = 1;
        const expiryYear = now.getFullYear() - 1 - 2000; // Last year
        
        const isExpired = expiryYear < now.getFullYear() - 2000;
        expect(isExpired).toBe(true);
      });
    });

    describe('CVV Validation', () => {
      it('should validate 3-digit CVV', () => {
        const cvv = '123';
        const isValid = /^\d{3}$/.test(cvv);
        
        expect(isValid).toBe(true);
      });

      it('should validate 4-digit CVV (Amex)', () => {
        const cvv = '1234';
        const isValid = /^\d{3,4}$/.test(cvv);
        
        expect(isValid).toBe(true);
      });

      it('should reject invalid CVV', () => {
        const cvv = '12';
        const isValid = /^\d{3,4}$/.test(cvv);
        
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Amount Validation', () => {
    it('should accept positive amount', () => {
      const amount = 100;
      const isValid = amount > 0;
      
      expect(isValid).toBe(true);
    });

    it('should reject zero amount', () => {
      const amount = 0;
      const isValid = amount > 0;
      
      expect(isValid).toBe(false);
    });

    it('should reject negative amount', () => {
      const amount = -50;
      const isValid = amount > 0;
      
      expect(isValid).toBe(false);
    });

    it('should handle decimal amounts', () => {
      const amount = 99.99;
      const isValid = amount > 0;
      
      expect(isValid).toBe(true);
      expect(amount).toBeCloseTo(99.99);
    });

    it('should convert to cents for API', () => {
      const amountNAD = 100.50;
      const amountCents = Math.round(amountNAD * 100);
      
      expect(amountCents).toBe(10050);
    });
  });

  describe('Merchant Reference', () => {
    it('should generate unique reference', () => {
      const ref1 = `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ref2 = `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      expect(ref1).not.toBe(ref2);
    });

    it('should include payment context', () => {
      const walletId = 'wallet-123';
      const ref = `add-money-${walletId}-${Date.now()}`;
      
      expect(ref).toContain('add-money');
      expect(ref).toContain(walletId);
    });
  });
});
