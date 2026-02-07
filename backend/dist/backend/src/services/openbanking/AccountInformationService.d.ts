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
export declare class AccountInformationService {
    /**
     * List Accounts (AIS Use Case #1)
     * Section 9.2.5: Obtain a list of accounts
     */
    listAccounts(beneficiaryId: string, status?: 'open' | 'closed'): Promise<Account[]>;
    /**
     * Get Account Balance (AIS Use Case #2)
     * Section 9.2.5: Obtain the balance for a single specified account
     */
    getAccountBalance(accountId: string): Promise<Balance[]>;
    /**
     * List Transactions (AIS Use Case #3)
     * Section 9.2.5: Obtain transactions for a specific account
     * Section 9.1.4: Pagination support (max 1000 records)
     */
    listTransactions(accountId: string, fromDate?: string, toDate?: string, page?: number, pageSize?: number): Promise<{
        transactions: Transaction[];
        totalRecords: number;
        totalPages: number;
    }>;
    /**
     * Create Account (helper for testing/onboarding)
     */
    createAccount(beneficiaryId: string, accountType: string, accountNumber: string, accountName: string, currency?: string): Promise<Account>;
    /**
     * Update Account Balance (helper for testing/updates)
     */
    updateBalance(accountId: string, balanceType: string, amount: number): Promise<void>;
}
//# sourceMappingURL=AccountInformationService.d.ts.map