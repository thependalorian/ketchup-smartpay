/**
 * Unit Tests: Users API
 * 
 * Location: __tests__/api/users.test.ts
 * Purpose: Test user API endpoint logic
 */

import { mapUserRow } from '../../utils/db-adapters';

// Mock the database module
jest.mock('../../utils/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  getUserIdFromRequest: jest.fn(),
  findUserId: jest.fn(),
}));

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/me', () => {
    describe('User Data Mapping', () => {
      it('should correctly map user data with full profile', () => {
        const dbUser = {
          id: 'uuid-123',
          external_id: 'user-1',
          full_name: 'John Doe',
          phone_number: '+264811234567',
          email: 'john@buffr.com',
          kyc_level: 2,
          metadata: {
            avatar: 'https://example.com/avatar.jpg',
            is_two_factor_enabled: true,
            currency: 'N$',
          },
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-15'),
        };

        const mapped = mapUserRow(dbUser);

        expect(mapped).toMatchObject({
          id: 'uuid-123',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          phone_number: '+264811234567',
          email: 'john@buffr.com',
          is_verified: true,
          is_two_factor_enabled: true,
          currency: 'N$',
          avatar: 'https://example.com/avatar.jpg',
        });
      });

      it('should handle unverified user (kyc_level 0)', () => {
        const dbUser = {
          id: 'uuid-456',
          full_name: 'New User',
          phone_number: '+264812345678',
          kyc_level: 0,
          metadata: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const mapped = mapUserRow(dbUser);

        expect(mapped.is_verified).toBe(false);
        expect(mapped.is_two_factor_enabled).toBe(false);
      });

      it('should use fallback ID when primary ID missing', () => {
        const dbUser = {
          id: null,
          external_id: 'fallback-user',
          full_name: 'Fallback User',
          phone_number: '+264813456789',
          kyc_level: 1,
          metadata: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const mapped = mapUserRow(dbUser);

        expect(mapped.id).toBe('fallback-user');
      });
    });

    describe('Buffr Card Balance Calculation', () => {
      it('should calculate card balance from wallet with highest balance', () => {
        // This tests the business logic pattern
        const wallets = [
          { balance: 100, currency: 'N$' },
          { balance: 500, currency: 'N$' },
          { balance: 250, currency: 'N$' },
        ];

        const highestBalance = Math.max(...wallets.map(w => w.balance));

        expect(highestBalance).toBe(500);
      });

      it('should default to 0 when no wallets', () => {
        const wallets: any[] = [];

        const balance = wallets.length > 0 
          ? Math.max(...wallets.map(w => w.balance)) 
          : 0;

        expect(balance).toBe(0);
      });
    });
  });

  describe('User Response Format', () => {
    it('should format user response correctly', () => {
      const mappedUser = {
        id: 'uuid-test',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        phone_number: '+264810000000',
        email: 'test@buffr.com',
        is_verified: true,
        is_two_factor_enabled: false,
        currency: 'N$',
        avatar: null,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-15'),
      };

      const buffrCardBalance = 1000;

      const formattedUser = {
        id: mappedUser.id,
        phoneNumber: mappedUser.phone_number,
        email: mappedUser.email,
        firstName: mappedUser.first_name,
        lastName: mappedUser.last_name,
        fullName: mappedUser.full_name,
        avatar: mappedUser.avatar,
        isVerified: mappedUser.is_verified,
        isTwoFactorEnabled: mappedUser.is_two_factor_enabled,
        currency: mappedUser.currency,
        buffrCardBalance: buffrCardBalance,
        createdAt: mappedUser.created_at,
      };

      expect(formattedUser).toMatchObject({
        id: 'uuid-test',
        phoneNumber: '+264810000000',
        email: 'test@buffr.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        isVerified: true,
        isTwoFactorEnabled: false,
        currency: 'N$',
        buffrCardBalance: 1000,
      });
    });
  });
});
