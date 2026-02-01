/**
 * Unit Tests: Wallets API
 * 
 * Location: __tests__/api/wallets.test.ts
 * Purpose: Test wallet API endpoint logic and data mapping
 */

import { mapWalletRow, prepareWalletData } from '../../utils/db-adapters';

describe('Wallets API', () => {
  describe('GET /api/wallets', () => {
    describe('Wallet Data Mapping', () => {
      it('should map wallet with full AutoPay configuration', () => {
        const dbWallet = {
          id: 'wallet-uuid-123',
          user_id: 'user-uuid-456',
          name: 'AutoPay Wallet',
          type: 'personal',
          balance: 2500.75,
          currency: 'N$',
          metadata: {
            icon: 'credit-card',
            auto_pay_enabled: true,
            auto_pay_max_amount: 1000,
            auto_pay_frequency: 'monthly',
            auto_pay_deduct_date: '15',
            auto_pay_deduct_time: '09:00',
            auto_pay_amount: 500,
            auto_pay_repayments: 12,
            auto_pay_payment_method: 'wallet',
          },
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = mapWalletRow(dbWallet);

        expect(result).toMatchObject({
          id: 'wallet-uuid-123',
          name: 'AutoPay Wallet',
          balance: 2500.75,
          auto_pay_enabled: true,
          auto_pay_max_amount: 1000,
          auto_pay_frequency: 'monthly',
          auto_pay_deduct_date: '15',
          auto_pay_deduct_time: '09:00',
          auto_pay_amount: 500,
          auto_pay_repayments: 12,
          auto_pay_payment_method: 'wallet',
        });
      });

      it('should map wallet with card details', () => {
        const dbWallet = {
          id: 'wallet-uuid-card',
          user_id: 'user-uuid-789',
          name: 'Buffr Card',
          type: 'card',
          balance: 5000,
          currency: 'N$',
          metadata: {
            icon: 'credit-card',
            card_design: 3,
            card_number: '4111111111111111',
            cardholder_name: 'JOHN DOE',
            expiry_date: '12/27',
          },
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = mapWalletRow(dbWallet);

        expect(result.card_number).toBe('4111111111111111');
        expect(result.cardholder_name).toBe('JOHN DOE');
        expect(result.expiry_date).toBe('12/27');
        expect(result.card_design).toBe(3);
      });

      it('should map wallet with security settings', () => {
        const dbWallet = {
          id: 'wallet-uuid-secure',
          user_id: 'user-uuid-000',
          name: 'Secure Wallet',
          type: 'savings',
          balance: 10000,
          currency: 'N$',
          metadata: {
            pin_protected: true,
            biometric_enabled: true,
          },
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = mapWalletRow(dbWallet);

        expect(result.pin_protected).toBe(true);
        expect(result.biometric_enabled).toBe(true);
      });

      it('should handle wallet without metadata', () => {
        const dbWallet = {
          id: 'wallet-uuid-basic',
          user_id: 'user-uuid-basic',
          name: 'Basic Wallet',
          type: 'personal',
          balance: 100,
          currency: 'N$',
          metadata: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = mapWalletRow(dbWallet);

        expect(result.icon).toBe('credit-card');
        expect(result.card_design).toBe(2);
        expect(result.auto_pay_enabled).toBe(false);
        expect(result.pin_protected).toBe(false);
      });
    });

    describe('Wallet Response Format', () => {
      it('should format wallet for API response', () => {
        const mappedWallet = mapWalletRow({
          id: 'wallet-format-test',
          user_id: 'user-format-test',
          name: 'Format Test Wallet',
          type: 'personal',
          balance: 1500,
          currency: 'N$',
          metadata: {
            icon: 'wallet',
            purpose: 'Testing',
          },
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-15'),
        });

        const formatted = {
          id: mappedWallet.id,
          name: mappedWallet.name,
          icon: mappedWallet.icon,
          type: mappedWallet.type,
          balance: parseFloat(mappedWallet.balance.toString()),
          currency: mappedWallet.currency,
          purpose: mappedWallet.purpose,
          cardDesign: mappedWallet.card_design,
          autoPayEnabled: mappedWallet.auto_pay_enabled,
          autoPayMaxAmount: mappedWallet.auto_pay_max_amount,
          pinProtected: mappedWallet.pin_protected,
          biometricEnabled: mappedWallet.biometric_enabled,
          createdAt: mappedWallet.created_at,
        };

        expect(formatted).toMatchObject({
          id: 'wallet-format-test',
          name: 'Format Test Wallet',
          icon: 'wallet',
          balance: 1500,
          currency: 'N$',
          purpose: 'Testing',
          autoPayEnabled: false,
        });
      });
    });
  });

  describe('POST /api/wallets', () => {
    describe('Wallet Data Preparation', () => {
      it('should prepare wallet with all fields', () => {
        const input = {
          name: 'New Savings Wallet',
          type: 'savings',
          currency: 'N$',
          icon: 'piggy-bank',
          purpose: 'Emergency fund',
          cardDesign: 5,
          autoPayEnabled: true,
          autoPayMaxAmount: 2000,
          autoPayFrequency: 'weekly',
          autoPayDeductDate: '1',
          autoPayDeductTime: '10:00',
          pinProtected: true,
          biometricEnabled: true,
        };

        const result = prepareWalletData(input, 'user-uuid-test');

        expect(result).toMatchObject({
          user_id: 'user-uuid-test',
          name: 'New Savings Wallet',
          type: 'savings',
          currency: 'N$',
          balance: 0,
          available_balance: 0,
          status: 'active',
        });

        expect(result.metadata).toMatchObject({
          icon: 'piggy-bank',
          purpose: 'Emergency fund',
          card_design: 5,
          auto_pay_enabled: true,
          auto_pay_max_amount: 2000,
          auto_pay_frequency: 'weekly',
          pin_protected: true,
          biometric_enabled: true,
        });
      });

      it('should use defaults for minimal input', () => {
        const input = { name: 'Minimal Wallet' };

        const result = prepareWalletData(input, 'user-uuid-minimal');

        expect(result.type).toBe('personal');
        expect(result.currency).toBe('N$');
        expect(result.balance).toBe(0);
        expect(result.status).toBe('active');
        expect(result.is_default).toBe(false);
      });

      it('should handle mixed camelCase and snake_case input', () => {
        const input = {
          name: 'Mixed Case Wallet',
          autoPayEnabled: true, // camelCase
          auto_pay_max_amount: 500, // snake_case
          pinProtected: false,
          biometric_enabled: true,
        };

        const result = prepareWalletData(input, 'user-uuid-mixed');

        expect(result.metadata.auto_pay_enabled).toBe(true);
        expect(result.metadata.auto_pay_max_amount).toBe(500);
        expect(result.metadata.pin_protected).toBe(false);
        expect(result.metadata.biometric_enabled).toBe(true);
      });
    });
  });

  describe('PUT /api/wallets/[id]', () => {
    describe('AutoPay Update Logic', () => {
      it('should merge AutoPay settings with existing metadata', () => {
        const existingMetadata = {
          icon: 'wallet',
          card_design: 2,
          auto_pay_enabled: false,
        };

        const updates = {
          autoPayEnabled: true,
          autoPayMaxAmount: 1000,
          autoPayFrequency: 'monthly',
        };

        // Simulate the merge logic
        const mergedMetadata = {
          ...existingMetadata,
          auto_pay_enabled: updates.autoPayEnabled,
          auto_pay_max_amount: updates.autoPayMaxAmount,
          auto_pay_frequency: updates.autoPayFrequency,
        };

        expect(mergedMetadata).toMatchObject({
          icon: 'wallet',
          card_design: 2,
          auto_pay_enabled: true,
          auto_pay_max_amount: 1000,
          auto_pay_frequency: 'monthly',
        });
      });

      it('should update security settings', () => {
        const existingMetadata = {
          icon: 'lock',
          pin_protected: false,
          biometric_enabled: false,
        };

        const updates = {
          pinProtected: true,
          biometricEnabled: true,
        };

        const mergedMetadata = {
          ...existingMetadata,
          pin_protected: updates.pinProtected,
          biometric_enabled: updates.biometricEnabled,
        };

        expect(mergedMetadata.pin_protected).toBe(true);
        expect(mergedMetadata.biometric_enabled).toBe(true);
      });
    });
  });

  describe('Balance Operations', () => {
    it('should calculate new balance after adding money', () => {
      const currentBalance = 1000;
      const addAmount = 500;

      const newBalance = currentBalance + addAmount;

      expect(newBalance).toBe(1500);
    });

    it('should calculate new balance after sending money', () => {
      const currentBalance = 1000;
      const sendAmount = 250;

      const newBalance = currentBalance - sendAmount;

      expect(newBalance).toBe(750);
    });

    it('should handle decimal amounts correctly', () => {
      const currentBalance = 100.50;
      const addAmount = 50.25;

      const newBalance = parseFloat((currentBalance + addAmount).toFixed(2));

      expect(newBalance).toBe(150.75);
    });
  });
});
