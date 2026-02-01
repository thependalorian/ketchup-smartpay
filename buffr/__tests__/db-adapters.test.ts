/**
 * Unit Tests: Database Adapters
 * 
 * Location: __tests__/db-adapters.test.ts
 * Purpose: Test adapter functions that map between database and API schemas
 */

import {
  mapUserRow,
  mapWalletRow,
  mapTransactionRow,
  prepareWalletData,
  prepareTransactionData,
  getUserIdForQuery,
} from '../utils/db-adapters';

describe('Database Adapters', () => {
  describe('mapUserRow', () => {
    it('should map user with full_name to first_name and last_name', () => {
      const dbUser = {
        id: 'uuid-123',
        external_id: 'user-1',
        full_name: 'John Doe',
        phone_number: '+264811234567',
        email: 'john@example.com',
        kyc_level: 1,
        metadata: {
          avatar: 'https://example.com/avatar.jpg',
          is_two_factor_enabled: true,
          currency: 'USD',
          last_login_at: '2025-01-15T10:00:00Z',
        },
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-15'),
      };

      const result = mapUserRow(dbUser);

      expect(result.id).toBe('uuid-123');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.full_name).toBe('John Doe');
      expect(result.phone_number).toBe('+264811234567');
      expect(result.email).toBe('john@example.com');
      expect(result.is_verified).toBe(true);
      expect(result.is_two_factor_enabled).toBe(true);
      expect(result.currency).toBe('USD');
      expect(result.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should handle user with only first name', () => {
      const dbUser = {
        id: 'uuid-456',
        full_name: 'Alice',
        phone_number: '+264812345678',
        kyc_level: 0,
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = mapUserRow(dbUser);

      expect(result.first_name).toBe('Alice');
      expect(result.last_name).toBe('');
      expect(result.is_verified).toBe(false);
      expect(result.currency).toBe('N$'); // Default currency
    });

    it('should handle user with multiple name parts', () => {
      const dbUser = {
        id: 'uuid-789',
        full_name: 'Mary Jane Watson Smith',
        phone_number: '+264813456789',
        kyc_level: 2,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = mapUserRow(dbUser);

      expect(result.first_name).toBe('Mary');
      expect(result.last_name).toBe('Jane Watson Smith');
    });

    it('should handle user without full_name', () => {
      const dbUser = {
        id: 'uuid-000',
        full_name: null,
        phone_number: '+264814567890',
        kyc_level: 0,
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = mapUserRow(dbUser);

      expect(result.first_name).toBeNull();
      expect(result.last_name).toBeNull();
      expect(result.full_name).toBeNull();
    });

    it('should use external_id when id is missing', () => {
      const dbUser = {
        external_id: 'user-external-1',
        full_name: 'Test User',
        phone_number: '+264815678901',
        kyc_level: 1,
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = mapUserRow(dbUser);

      expect(result.id).toBe('user-external-1');
    });
  });

  describe('mapWalletRow', () => {
    it('should map wallet with metadata', () => {
      const dbWallet = {
        id: 'wallet-uuid-123',
        user_id: 'user-uuid-456',
        name: 'My Savings',
        type: 'savings',
        balance: 1000.50,
        currency: 'N$',
        metadata: {
          icon: 'piggy-bank',
          purpose: 'Emergency fund',
          card_design: 3,
          card_number: '4111111111111111',
          cardholder_name: 'JOHN DOE',
          expiry_date: '12/26',
          auto_pay_enabled: true,
          auto_pay_max_amount: 500,
          auto_pay_frequency: 'monthly',
          pin_protected: true,
          biometric_enabled: true,
        },
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-15'),
      };

      const result = mapWalletRow(dbWallet);

      expect(result.id).toBe('wallet-uuid-123');
      expect(result.user_id).toBe('user-uuid-456');
      expect(result.name).toBe('My Savings');
      expect(result.type).toBe('savings');
      expect(result.balance).toBe(1000.50);
      expect(result.icon).toBe('piggy-bank');
      expect(result.purpose).toBe('Emergency fund');
      expect(result.card_design).toBe(3);
      expect(result.auto_pay_enabled).toBe(true);
      expect(result.auto_pay_max_amount).toBe(500);
      expect(result.pin_protected).toBe(true);
      expect(result.biometric_enabled).toBe(true);
    });

    it('should use defaults when metadata is null', () => {
      const dbWallet = {
        id: 'wallet-uuid-789',
        user_id: 'user-uuid-000',
        name: 'Basic Wallet',
        type: 'personal',
        balance: 0,
        currency: 'N$',
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = mapWalletRow(dbWallet);

      expect(result.icon).toBe('credit-card'); // Default icon
      expect(result.card_design).toBe(2); // Default design
      expect(result.auto_pay_enabled).toBe(false);
      expect(result.pin_protected).toBe(false);
      expect(result.biometric_enabled).toBe(false);
    });

    it('should handle empty metadata object', () => {
      const dbWallet = {
        id: 'wallet-uuid-abc',
        user_id: 'user-uuid-def',
        name: 'Empty Metadata Wallet',
        type: 'personal',
        balance: 250,
        currency: 'USD',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = mapWalletRow(dbWallet);

      expect(result.icon).toBe('credit-card');
      expect(result.purpose).toBeNull();
      expect(result.auto_pay_settings).toBeNull();
    });
  });

  describe('mapTransactionRow', () => {
    it('should map debit transaction to sent', () => {
      const dbTransaction = {
        id: 'tx-uuid-123',
        user_id: 'user-uuid-456',
        amount: 100,
        currency: 'N$',
        transaction_type: 'debit',
        status: 'completed',
        transaction_time: new Date('2025-01-15T10:30:00Z'),
        merchant_name: 'Alice Smith',
        merchant_category: 'Transfer',
        merchant_id: 'merchant-123',
        metadata: {
          wallet_id: 'wallet-uuid-789',
          description: 'Payment for lunch',
          recipient_id: 'user-789',
        },
        created_at: new Date('2025-01-15'),
      };

      const result = mapTransactionRow(dbTransaction);

      expect(result.id).toBe('tx-uuid-123');
      expect(result.type).toBe('sent'); // Mapped from 'debit'
      expect(result.amount).toBe(100);
      expect(result.wallet_id).toBe('wallet-uuid-789');
      expect(result.description).toBe('Payment for lunch');
      expect(result.recipient_name).toBe('Alice Smith');
      expect(result.status).toBe('completed');
    });

    it('should map credit transaction to received', () => {
      const dbTransaction = {
        id: 'tx-uuid-456',
        user_id: 'user-uuid-789',
        amount: 250.50,
        currency: 'N$',
        transaction_type: 'credit',
        status: 'completed',
        transaction_time: new Date('2025-01-15T14:00:00Z'),
        merchant_name: 'Bob Johnson',
        metadata: {},
        created_at: new Date(),
      };

      const result = mapTransactionRow(dbTransaction);

      expect(result.type).toBe('received'); // Mapped from 'credit'
      expect(result.amount).toBe(250.50);
    });

    it('should map deposit to transfer_in', () => {
      const dbTransaction = {
        id: 'tx-uuid-789',
        user_id: 'user-uuid-000',
        amount: 500,
        currency: 'N$',
        transaction_type: 'deposit',
        status: 'completed',
        transaction_time: new Date(),
        metadata: null,
        created_at: new Date(),
      };

      const result = mapTransactionRow(dbTransaction);

      expect(result.type).toBe('transfer_in');
    });

    it('should handle unknown transaction type', () => {
      const dbTransaction = {
        id: 'tx-uuid-abc',
        user_id: 'user-uuid-def',
        amount: 75,
        currency: 'N$',
        transaction_type: 'REFUND',
        status: 'completed',
        transaction_time: new Date(),
        metadata: null,
        created_at: new Date(),
      };

      const result = mapTransactionRow(dbTransaction);

      expect(result.type).toBe('refund'); // Lowercased
    });

    it('should use merchant_name when description is missing', () => {
      const dbTransaction = {
        id: 'tx-uuid-xyz',
        user_id: 'user-uuid-xyz',
        amount: 50,
        currency: 'N$',
        transaction_type: 'payment',
        status: 'completed',
        transaction_time: new Date(),
        merchant_name: 'Coffee Shop',
        metadata: null,
        created_at: new Date(),
      };

      const result = mapTransactionRow(dbTransaction);

      expect(result.description).toBe('Coffee Shop');
      expect(result.recipient_name).toBe('Coffee Shop');
    });
  });

  describe('prepareWalletData', () => {
    it('should prepare wallet data with camelCase input', () => {
      const input = {
        name: 'New Wallet',
        type: 'savings',
        currency: 'N$',
        icon: 'star',
        purpose: 'Vacation fund',
        cardDesign: 5,
        autoPayEnabled: true,
        autoPayMaxAmount: 1000,
        pinProtected: true,
      };

      const result = prepareWalletData(input, 'user-uuid-123');

      expect(result.user_id).toBe('user-uuid-123');
      expect(result.name).toBe('New Wallet');
      expect(result.type).toBe('savings');
      expect(result.status).toBe('active');
      expect(result.metadata.icon).toBe('star');
      expect(result.metadata.purpose).toBe('Vacation fund');
      expect(result.metadata.card_design).toBe(5);
      expect(result.metadata.auto_pay_enabled).toBe(true);
      expect(result.metadata.auto_pay_max_amount).toBe(1000);
      expect(result.metadata.pin_protected).toBe(true);
    });

    it('should prepare wallet data with snake_case input', () => {
      const input = {
        name: 'Another Wallet',
        type: 'personal',
        auto_pay_enabled: false,
        auto_pay_frequency: 'weekly',
        biometric_enabled: true,
      };

      const result = prepareWalletData(input, 'user-uuid-456');

      expect(result.metadata.auto_pay_enabled).toBe(false);
      expect(result.metadata.auto_pay_frequency).toBe('weekly');
      expect(result.metadata.biometric_enabled).toBe(true);
    });

    it('should use default values when not provided', () => {
      const input = {
        name: 'Minimal Wallet',
      };

      const result = prepareWalletData(input, 'user-uuid-789');

      expect(result.type).toBe('personal');
      expect(result.currency).toBe('N$');
      expect(result.balance).toBe(0);
      expect(result.available_balance).toBe(0);
      expect(result.is_default).toBe(false);
    });

    it('should remove undefined metadata values', () => {
      const input = {
        name: 'Clean Wallet',
        icon: 'wallet',
      };

      const result = prepareWalletData(input, 'user-uuid-000');

      // Only icon should be in metadata
      expect(result.metadata.icon).toBe('wallet');
      expect(result.metadata.purpose).toBeUndefined();
      expect(result.metadata.auto_pay_enabled).toBeUndefined();
    });
  });

  describe('prepareTransactionData', () => {
    it('should prepare transaction data with camelCase input', () => {
      const input = {
        amount: 150,
        type: 'sent',
        walletId: 'wallet-123',
        description: 'Payment for services',
        recipientId: 'user-recipient',
        recipientName: 'Jane Doe',
        category: 'Services',
        date: new Date('2025-01-15T12:00:00Z'),
      };

      const result = prepareTransactionData(input, 'user-uuid-sender');

      expect(result.user_id).toBe('user-uuid-sender');
      expect(result.amount).toBe(150);
      expect(result.transaction_type).toBe('debit'); // Mapped from 'sent'
      expect(result.status).toBe('completed');
      expect(result.merchant_name).toBe('Jane Doe');
      expect(result.merchant_category).toBe('Services');
      expect(result.metadata.wallet_id).toBe('wallet-123');
      expect(result.metadata.description).toBe('Payment for services');
      expect(result.metadata.recipient_id).toBe('user-recipient');
      expect(result.external_id).toMatch(/^txn_\d+_[a-z0-9]+$/);
    });

    it('should map transfer_in to deposit', () => {
      const input = {
        amount: 500,
        type: 'transfer_in',
        description: 'Deposit from bank',
      };

      const result = prepareTransactionData(input, 'user-uuid-123');

      expect(result.transaction_type).toBe('deposit');
    });

    it('should map received to credit', () => {
      const input = {
        amount: 200,
        type: 'received',
        recipientName: 'Bob Smith',
      };

      const result = prepareTransactionData(input, 'user-uuid-456');

      expect(result.transaction_type).toBe('credit');
    });

    it('should use default currency and status', () => {
      const input = {
        amount: 75,
        type: 'payment',
      };

      const result = prepareTransactionData(input, 'user-uuid-789');

      expect(result.currency).toBe('N$');
      expect(result.status).toBe('completed');
    });

    it('should generate unique external_id', () => {
      const input = { amount: 100, type: 'sent' };

      const result1 = prepareTransactionData(input, 'user-1');
      const result2 = prepareTransactionData(input, 'user-2');

      expect(result1.external_id).not.toBe(result2.external_id);
    });
  });

  describe('getUserIdForQuery', () => {
    it('should return UUID as is', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      
      const result = getUserIdForQuery(uuid);
      
      expect(result).toBe(uuid);
    });

    it('should return non-UUID string as is', () => {
      const externalId = 'user-1';
      
      const result = getUserIdForQuery(externalId);
      
      expect(result).toBe(externalId);
    });

    it('should handle uppercase UUID', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000';
      
      const result = getUserIdForQuery(uuid);
      
      expect(result).toBe(uuid);
    });
  });
});
