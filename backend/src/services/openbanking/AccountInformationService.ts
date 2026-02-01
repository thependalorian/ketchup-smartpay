/**
 * Account Information Service (AIS)
 * 
 * Location: backend/src/services/openbanking/AccountInformationService.ts
 * Purpose: Implementation of Account Information Services per Namibian Open Banking Standards v1.0
 * 
 * Standards Compliance:
 * - Section 9.2.5: Supported AIS API Use Cases
 * - Section 9.2.4: Banking Resource Objects
 */

import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';

export interface Account {
  accountId: string;
  beneficiaryId: string;
  accountType: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  status: string;
  openedDate?: string;
}

export interface Balance {
  balanceId: string;
  accountId: string;
  balanceType: string;
  amount: string;
  currency: string;
  asOfDate: string;
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  transactionType: string;
  transactionReference?: string;
  description?: string;
  amount: string;
  currency: string;
  postingDate: string;
  valueDate?: string;
  balanceAfter?: string;
  status: string;
  merchantName?: string;
}

export class AccountInformationService {
  /**
   * List Accounts (AIS Use Case #1)
   * Section 9.2.5: Obtain a list of accounts
   */
  async listAccounts(
    beneficiaryId: string,
    status?: 'open' | 'closed'
  ): Promise<Account[]> {
    try {
      let accounts;
      
      if (status) {
        // Filter by status
        accounts = await sql`
          SELECT 
            account_id as "accountId",
            beneficiary_id as "beneficiaryId",
            account_type as "accountType",
            account_number as "accountNumber",
            account_name as "accountName",
            currency,
            status,
            opened_date as "openedDate",
            closed_date as "closedDate"
          FROM open_banking_accounts
          WHERE beneficiary_id = ${beneficiaryId}
          AND status = ${status}
          ORDER BY created_at DESC
        `;
      } else {
        // No status filter
        accounts = await sql`
          SELECT 
            account_id as "accountId",
            beneficiary_id as "beneficiaryId",
            account_type as "accountType",
            account_number as "accountNumber",
            account_name as "accountName",
            currency,
            status,
            opened_date as "openedDate",
            closed_date as "closedDate"
          FROM open_banking_accounts
          WHERE beneficiary_id = ${beneficiaryId}
          ORDER BY created_at DESC
        `;
      }

      log('Listed accounts', { beneficiaryId, count: accounts.length });
      return accounts as Account[];
    } catch (error) {
      logError('Failed to list accounts', error, { beneficiaryId });
      throw error;
    }
  }

  /**
   * Get Account Balance (AIS Use Case #2)
   * Section 9.2.5: Obtain the balance for a single specified account
   */
  async getAccountBalance(accountId: string): Promise<Balance[]> {
    try {
      // Verify account exists
      const [account] = await sql`
        SELECT account_id FROM open_banking_accounts
        WHERE account_id = ${accountId}
      `;

      if (!account) {
        throw new Error('Account not found');
      }

      const balances = await sql`
        SELECT 
          balance_id as "balanceId",
          account_id as "accountId",
          balance_type as "balanceType",
          TO_CHAR(amount, 'FM999999999990.00') as amount,
          currency,
          as_of_date as "asOfDate"
        FROM open_banking_balances
        WHERE account_id = ${accountId}
        ORDER BY created_at DESC
        LIMIT 10
      `;

      log('Retrieved account balance', { accountId, count: balances.length });
      return balances as Balance[];
    } catch (error) {
      logError('Failed to get account balance', error, { accountId });
      throw error;
    }
  }

  /**
   * List Transactions (AIS Use Case #3)
   * Section 9.2.5: Obtain transactions for a specific account
   * Section 9.1.4: Pagination support (max 1000 records)
   */
  async listTransactions(
    accountId: string,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    transactions: Transaction[];
    totalRecords: number;
    totalPages: number;
  }> {
    try {
      // Validate page size (max 1000 per standards)
      if (pageSize > 1000) {
        throw new Error('Invalid page size. Maximum is 1000 records per page.');
      }

      // Verify account exists
      const [account] = await sql`
        SELECT account_id FROM open_banking_accounts
        WHERE account_id = ${accountId}
      `;

      if (!account) {
        throw new Error('Account not found');
      }

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Build query based on filters (Neon doesn't handle conditional SQL well)
      let countQuery, transactionQuery;
      
      if (fromDate && toDate) {
        // Both dates provided
        countQuery = sql`
          SELECT COUNT(*) as count
          FROM open_banking_transactions
          WHERE account_id = ${accountId}
          AND posting_date >= ${fromDate}::date
          AND posting_date <= ${toDate}::date
        `;
        transactionQuery = sql`
          SELECT 
            transaction_id as "transactionId", account_id as "accountId",
            transaction_type as "transactionType", transaction_reference as "transactionReference",
            description, TO_CHAR(amount, 'FM999999999990.00') as amount, currency,
            posting_date as "postingDate", value_date as "valueDate",
            TO_CHAR(balance_after, 'FM999999999990.00') as "balanceAfter",
            status, merchant_name as "merchantName", merchant_category as "merchantCategory"
          FROM open_banking_transactions
          WHERE account_id = ${accountId}
          AND posting_date >= ${fromDate}::date AND posting_date <= ${toDate}::date
          ORDER BY posting_date DESC, created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } else if (fromDate) {
        // Only fromDate
        countQuery = sql`
          SELECT COUNT(*) as count FROM open_banking_transactions
          WHERE account_id = ${accountId} AND posting_date >= ${fromDate}::date
        `;
        transactionQuery = sql`
          SELECT transaction_id as "transactionId", account_id as "accountId",
            transaction_type as "transactionType", transaction_reference as "transactionReference",
            description, TO_CHAR(amount, 'FM999999999990.00') as amount, currency,
            posting_date as "postingDate", value_date as "valueDate",
            TO_CHAR(balance_after, 'FM999999999990.00') as "balanceAfter",
            status, merchant_name as "merchantName", merchant_category as "merchantCategory"
          FROM open_banking_transactions
          WHERE account_id = ${accountId} AND posting_date >= ${fromDate}::date
          ORDER BY posting_date DESC, created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } else if (toDate) {
        // Only toDate
        countQuery = sql`
          SELECT COUNT(*) as count FROM open_banking_transactions
          WHERE account_id = ${accountId} AND posting_date <= ${toDate}::date
        `;
        transactionQuery = sql`
          SELECT transaction_id as "transactionId", account_id as "accountId",
            transaction_type as "transactionType", transaction_reference as "transactionReference",
            description, TO_CHAR(amount, 'FM999999999990.00') as amount, currency,
            posting_date as "postingDate", value_date as "valueDate",
            TO_CHAR(balance_after, 'FM999999999990.00') as "balanceAfter",
            status, merchant_name as "merchantName", merchant_category as "merchantCategory"
          FROM open_banking_transactions
          WHERE account_id = ${accountId} AND posting_date <= ${toDate}::date
          ORDER BY posting_date DESC, created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } else {
        // No date filters
        countQuery = sql`
          SELECT COUNT(*) as count FROM open_banking_transactions
          WHERE account_id = ${accountId}
        `;
        transactionQuery = sql`
          SELECT transaction_id as "transactionId", account_id as "accountId",
            transaction_type as "transactionType", transaction_reference as "transactionReference",
            description, TO_CHAR(amount, 'FM999999999990.00') as amount, currency,
            posting_date as "postingDate", value_date as "valueDate",
            TO_CHAR(balance_after, 'FM999999999990.00') as "balanceAfter",
            status, merchant_name as "merchantName", merchant_category as "merchantCategory"
          FROM open_banking_transactions
          WHERE account_id = ${accountId}
          ORDER BY posting_date DESC, created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      }

      const [countResult] = await countQuery;
      const totalRecords = Number(countResult.count);
      const totalPages = Math.ceil(totalRecords / pageSize);

      const transactions = await transactionQuery;

      log('Listed transactions', { 
        accountId, 
        count: transactions.length, 
        totalRecords,
        page 
      });

      return {
        transactions: transactions as Transaction[],
        totalRecords,
        totalPages,
      };
    } catch (error) {
      logError('Failed to list transactions', error, { accountId });
      throw error;
    }
  }

  /**
   * Create Account (helper for testing/onboarding)
   */
  async createAccount(
    beneficiaryId: string,
    accountType: string,
    accountNumber: string,
    accountName: string,
    currency: string = 'NAD'
  ): Promise<Account> {
    try {
      const [account] = await sql`
        INSERT INTO open_banking_accounts (
          beneficiary_id, account_type, account_number, account_name, 
          currency, status, opened_date
        )
        VALUES (
          ${beneficiaryId}, ${accountType}, ${accountNumber}, ${accountName},
          ${currency}, 'open', CURRENT_DATE
        )
        RETURNING 
          account_id as "accountId",
          beneficiary_id as "beneficiaryId",
          account_type as "accountType",
          account_number as "accountNumber",
          account_name as "accountName",
          currency,
          status,
          opened_date as "openedDate"
      `;

      log('Account created', { accountId: account.accountId, beneficiaryId });
      return account as Account;
    } catch (error) {
      logError('Failed to create account', error);
      throw error;
    }
  }

  /**
   * Update Account Balance (helper for testing/updates)
   */
  async updateBalance(
    accountId: string,
    balanceType: string,
    amount: number
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO open_banking_balances (
          account_id, balance_type, amount
        )
        VALUES (
          ${accountId}, ${balanceType}, ${amount}
        )
      `;

      log('Balance updated', { accountId, balanceType, amount });
    } catch (error) {
      logError('Failed to update balance', error);
      throw error;
    }
  }
}
