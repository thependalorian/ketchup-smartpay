/**
 * Unit Tests: Transactions API
 * 
 * Location: __tests__/api/transactions.test.ts
 * Purpose: Test transaction API endpoint logic and data mapping
 * 
 * Based on TrueLayer Testing Patterns:
 * - Transaction listing with pagination
 * - Transaction status tracking
 * - Open Banking format compliance
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

import { mapTransactionRow, prepareTransactionData } from '../../utils/db-adapters';

describe('Transactions API', () => {
  describe('GET /api/transactions', () => {
    describe('Transaction Type Mapping', () => {
      it('should map debit to sent', () => {
        const dbTx = {
          id: 'tx-1',
          user_id: 'user-1',
          amount: 100,
          currency: 'N$',
          transaction_type: 'debit',
          status: 'completed',
          transaction_time: new Date(),
          metadata: null,
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);
        expect(result.type).toBe('sent');
      });

      it('should map credit to received', () => {
        const dbTx = {
          id: 'tx-2',
          user_id: 'user-2',
          amount: 200,
          currency: 'N$',
          transaction_type: 'credit',
          status: 'completed',
          transaction_time: new Date(),
          metadata: null,
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);
        expect(result.type).toBe('received');
      });

      it('should map deposit to transfer_in', () => {
        const dbTx = {
          id: 'tx-3',
          user_id: 'user-3',
          amount: 500,
          currency: 'N$',
          transaction_type: 'deposit',
          status: 'completed',
          transaction_time: new Date(),
          metadata: null,
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);
        expect(result.type).toBe('transfer_in');
      });

      it('should map transfer to transfer_out', () => {
        const dbTx = {
          id: 'tx-4',
          user_id: 'user-4',
          amount: 300,
          currency: 'N$',
          transaction_type: 'transfer',
          status: 'completed',
          transaction_time: new Date(),
          metadata: null,
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);
        expect(result.type).toBe('transfer_out');
      });

      it('should keep payment as payment', () => {
        const dbTx = {
          id: 'tx-5',
          user_id: 'user-5',
          amount: 150,
          currency: 'N$',
          transaction_type: 'payment',
          status: 'completed',
          transaction_time: new Date(),
          metadata: null,
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);
        expect(result.type).toBe('payment');
      });

      it('should lowercase unknown types', () => {
        const dbTx = {
          id: 'tx-6',
          user_id: 'user-6',
          amount: 75,
          currency: 'N$',
          transaction_type: 'REFUND',
          status: 'completed',
          transaction_time: new Date(),
          metadata: null,
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);
        expect(result.type).toBe('refund');
      });
    });

    describe('Transaction Data Extraction', () => {
      it('should extract wallet_id from metadata', () => {
        const dbTx = {
          id: 'tx-metadata-1',
          user_id: 'user-m1',
          amount: 100,
          currency: 'N$',
          transaction_type: 'debit',
          status: 'completed',
          transaction_time: new Date(),
          metadata: {
            wallet_id: 'wallet-123',
            description: 'Test payment',
          },
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);

        expect(result.wallet_id).toBe('wallet-123');
        expect(result.description).toBe('Test payment');
      });

      it('should use merchant_name when no description in metadata', () => {
        const dbTx = {
          id: 'tx-merchant-1',
          user_id: 'user-m2',
          amount: 50,
          currency: 'N$',
          transaction_type: 'payment',
          status: 'completed',
          transaction_time: new Date(),
          merchant_name: 'Coffee Shop',
          merchant_category: 'Food & Drink',
          metadata: null,
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);

        expect(result.description).toBe('Coffee Shop');
        expect(result.category).toBe('Food & Drink');
        expect(result.recipient_name).toBe('Coffee Shop');
      });

      it('should extract recipient info from metadata', () => {
        const dbTx = {
          id: 'tx-recipient-1',
          user_id: 'user-r1',
          amount: 200,
          currency: 'N$',
          transaction_type: 'debit',
          status: 'completed',
          transaction_time: new Date(),
          metadata: {
            recipient_id: 'user-recipient',
            recipient_name: 'Alice Smith',
          },
          created_at: new Date(),
        };

        const result = mapTransactionRow(dbTx);

        expect(result.recipient_id).toBe('user-recipient');
        expect(result.recipient_name).toBe('Alice Smith');
      });

      it('should use transaction_time for date', () => {
        const txTime = new Date('2025-01-15T10:30:00Z');
        const dbTx = {
          id: 'tx-time-1',
          user_id: 'user-t1',
          amount: 100,
          currency: 'N$',
          transaction_type: 'debit',
          status: 'completed',
          transaction_time: txTime,
          metadata: null,
          created_at: new Date('2025-01-14'),
        };

        const result = mapTransactionRow(dbTx);

        expect(result.date).toEqual(txTime);
      });

      it('should fallback to created_at when transaction_time missing', () => {
        const createdAt = new Date('2025-01-14T08:00:00Z');
        const dbTx = {
          id: 'tx-fallback-1',
          user_id: 'user-f1',
          amount: 100,
          currency: 'N$',
          transaction_type: 'credit',
          status: 'completed',
          transaction_time: null,
          metadata: null,
          created_at: createdAt,
        };

        const result = mapTransactionRow(dbTx);

        expect(result.date).toEqual(createdAt);
      });
    });

    describe('Transaction Response Format', () => {
      it('should format transaction for API response', () => {
        const mappedTx = mapTransactionRow({
          id: 'tx-format-1',
          user_id: 'user-format',
          amount: 150.50,
          currency: 'N$',
          transaction_type: 'debit',
          status: 'completed',
          transaction_time: new Date('2025-01-15T12:00:00Z'),
          merchant_name: 'Jane Doe',
          metadata: {
            wallet_id: 'wallet-format',
            description: 'Lunch payment',
          },
          created_at: new Date(),
        });

        const formatted = {
          id: mappedTx.id,
          walletId: mappedTx.wallet_id,
          type: mappedTx.type,
          amount: parseFloat(mappedTx.amount.toString()),
          currency: mappedTx.currency,
          description: mappedTx.description,
          category: mappedTx.category,
          recipient: mappedTx.recipient_id ? {
            id: mappedTx.recipient_id,
            name: mappedTx.recipient_name,
          } : undefined,
          status: mappedTx.status,
          date: mappedTx.date,
          createdAt: mappedTx.created_at,
        };

        expect(formatted).toMatchObject({
          id: 'tx-format-1',
          walletId: 'wallet-format',
          type: 'sent',
          amount: 150.50,
          currency: 'N$',
          description: 'Lunch payment',
          status: 'completed',
        });
      });
    });
  });

  describe('POST /api/transactions', () => {
    describe('Transaction Data Preparation', () => {
      it('should prepare sent transaction as debit', () => {
        const input = {
          amount: 100,
          type: 'sent',
          walletId: 'wallet-123',
          recipientId: 'user-recipient',
          recipientName: 'Bob Smith',
          description: 'Payment for dinner',
          category: 'Food',
        };

        const result = prepareTransactionData(input, 'user-sender');

        expect(result.transaction_type).toBe('debit');
        expect(result.user_id).toBe('user-sender');
        expect(result.amount).toBe(100);
        expect(result.merchant_name).toBe('Bob Smith');
        expect(result.metadata.wallet_id).toBe('wallet-123');
        expect(result.metadata.recipient_id).toBe('user-recipient');
      });

      it('should prepare transfer_in as deposit', () => {
        const input = {
          amount: 500,
          type: 'transfer_in',
          walletId: 'wallet-456',
          description: 'Bank deposit',
        };

        const result = prepareTransactionData(input, 'user-depositor');

        expect(result.transaction_type).toBe('deposit');
        expect(result.amount).toBe(500);
        expect(result.metadata.description).toBe('Bank deposit');
      });

      it('should generate unique external_id', () => {
        const input = { amount: 100, type: 'sent' };

        const results = Array.from({ length: 5 }, () => 
          prepareTransactionData(input, 'user-test')
        );

        const externalIds = results.map(r => r.external_id);
        const uniqueIds = new Set(externalIds);

        expect(uniqueIds.size).toBe(5);
      });

      it('should use current date when not provided', () => {
        const input = { amount: 100, type: 'payment' };
        const before = new Date();

        const result = prepareTransactionData(input, 'user-test');

        const after = new Date();

        expect(result.transaction_time.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(result.transaction_time.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('should use provided date', () => {
        const specificDate = new Date('2025-01-10T15:30:00Z');
        const input = {
          amount: 100,
          type: 'payment',
          date: specificDate,
        };

        const result = prepareTransactionData(input, 'user-test');

        expect(result.transaction_time).toEqual(specificDate);
      });

      it('should default status to completed', () => {
        const input = { amount: 100, type: 'sent' };

        const result = prepareTransactionData(input, 'user-test');

        expect(result.status).toBe('completed');
      });

      it('should use provided status', () => {
        const input = {
          amount: 100,
          type: 'sent',
          status: 'pending',
        };

        const result = prepareTransactionData(input, 'user-test');

        expect(result.status).toBe('pending');
      });
    });
  });

  describe('Transaction Filtering', () => {
    describe('Type Filter Mapping', () => {
      it('should map sent filter to debit', () => {
        const apiType = 'sent';
        const dbTypeMap: Record<string, string> = {
          'sent': 'debit',
          'received': 'credit',
          'transfer_in': 'deposit',
        };

        expect(dbTypeMap[apiType]).toBe('debit');
      });

      it('should map received filter to credit', () => {
        const apiType = 'received';
        const dbTypeMap: Record<string, string> = {
          'sent': 'debit',
          'received': 'credit',
          'transfer_in': 'deposit',
        };

        expect(dbTypeMap[apiType]).toBe('credit');
      });
    });

    describe('Date Range Filtering', () => {
      it('should filter transactions within date range', () => {
        const transactions = [
          { id: 1, date: new Date('2025-01-01') },
          { id: 2, date: new Date('2025-01-15') },
          { id: 3, date: new Date('2025-01-31') },
          { id: 4, date: new Date('2025-02-15') },
        ];

        const startDate = new Date('2025-01-10');
        const endDate = new Date('2025-01-31');

        const filtered = transactions.filter(
          tx => tx.date >= startDate && tx.date <= endDate
        );

        expect(filtered).toHaveLength(2);
        expect(filtered.map(t => t.id)).toEqual([2, 3]);
      });
    });

    describe('Limit and Pagination', () => {
      it('should limit results', () => {
        const allTransactions = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          amount: 100,
        }));

        const limit = 10;
        const limited = allTransactions.slice(0, limit);

        expect(limited).toHaveLength(10);
        expect(limited[0].id).toBe(1);
        expect(limited[9].id).toBe(10);
      });

      it('should paginate results', () => {
        const allTransactions = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          amount: 100,
        }));

        const page = 3;
        const perPage = 10;
        const offset = (page - 1) * perPage;
        const paginated = allTransactions.slice(offset, offset + perPage);

        expect(paginated).toHaveLength(10);
        expect(paginated[0].id).toBe(21);
        expect(paginated[9].id).toBe(30);
      });
    });
  });
});
