/**
 * Apache Fineract Core Banking Service
 * 
 * Location: services/fineractService.ts
 * Purpose: Integration with Apache Fineract for core banking operations
 * 
 * Architecture: Dual database
 * - Fineract (MySQL/PostgreSQL): Core banking data (clients, accounts, transactions)
 * - Neon PostgreSQL: Application data (users, vouchers, wallets, analytics)
 * 
 * Integration Points:
 * - Client (beneficiary) creation and management
 * - Account management (trust account, user accounts)
 * - Transaction sync (voucher redemptions, payments)
 * - Balance sync (trust account reconciliation)
 * - Trust account reconciliation
 */

import { logAPISyncOperation, generateRequestId } from '@/utils/auditLogger';
import logger from '@/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Multi-instance configuration
// Write instance: All mutations (POST, PUT, PATCH, DELETE)
const FINERACT_WRITE_URL = process.env.FINERACT_WRITE_URL || process.env.FINERACT_API_URL || 'https://localhost:8443/fineract-provider/api/v1';
const FINERACT_WRITE_USERNAME = process.env.FINERACT_WRITE_USERNAME || process.env.FINERACT_USERNAME || 'mifos';
const FINERACT_WRITE_PASSWORD = process.env.FINERACT_WRITE_PASSWORD || process.env.FINERACT_PASSWORD || 'password';

// Read instances: All read operations (GET) - round-robin load balancing
const FINERACT_READ_URLS = process.env.FINERACT_READ_URLS 
  ? process.env.FINERACT_READ_URLS.split(',').map(url => url.trim())
  : process.env.FINERACT_API_URL 
    ? [process.env.FINERACT_API_URL]
    : ['https://localhost:8443/fineract-provider/api/v1'];
const FINERACT_READ_USERNAME = process.env.FINERACT_READ_USERNAME || process.env.FINERACT_USERNAME || 'mifos';
const FINERACT_READ_PASSWORD = process.env.FINERACT_READ_PASSWORD || process.env.FINERACT_PASSWORD || 'password';

// Batch instance: Scheduled jobs (optional, defaults to write instance)
const FINERACT_BATCH_URL = process.env.FINERACT_BATCH_URL || FINERACT_WRITE_URL;
const FINERACT_BATCH_USERNAME = process.env.FINERACT_BATCH_USERNAME || FINERACT_WRITE_USERNAME;
const FINERACT_BATCH_PASSWORD = process.env.FINERACT_BATCH_PASSWORD || FINERACT_WRITE_PASSWORD;

// Common configuration
const FINERACT_TENANT_ID = process.env.FINERACT_TENANT_ID || 'default';
const FINERACT_TIMEOUT = parseInt(process.env.FINERACT_TIMEOUT || '30000', 10); // 30 seconds

// Read instance health tracking (for round-robin with health checks)
let readInstanceIndex = 0;
const readInstanceHealth: Map<string, { healthy: boolean; lastCheck: number }> = new Map();
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface FineractClient {
  id: number;
  accountNo?: string;
  firstname?: string;
  lastname?: string;
  fullname?: string;
  displayName?: string;
  mobileNo?: string;
  emailAddress?: string;
  dateOfBirth?: string | number[]; // Can be array [year, month, day]
  externalId?: string; // Buffr user ID
  officeId?: number;
  officeName?: string;
  status?: {
    id: number;
    code: string;
    value: string;
  };
  active?: boolean;
  activationDate?: string | number[]; // Can be array [year, month, day]
}

export interface FineractAccount {
  id: number;
  accountNo: string;
  clientId: number;
  clientName?: string;
  savingsProductId?: number;
  savingsProductName?: string;
  status?: {
    id: number;
    code: string;
    value: string;
  };
  summary?: {
    accountBalance: number;
    availableBalance: number;
    currency?: {
      code: string;
      name: string;
    };
  };
  accountBalance?: number; // Direct balance (if not in summary)
  externalId?: string;
}

export interface FineractTransaction {
  id: number;
  accountId: number;
  transactionType: {
    id: number;
    code: string;
    value: string;
  };
  entryType?: 'DEBIT' | 'CREDIT';
  amount: number;
  currency?: {
    code: string;
    name: string;
  };
  date: string;
  transactionDate?: string;
  runningBalance?: number;
  reversed?: boolean;
}

export interface CommandProcessingResult {
  officeId?: number;
  clientId?: number;
  groupId?: number;
  loanId?: number;
  savingsId?: number;
  voucherId?: number; // For fineract-voucher module
  walletId?: number; // For fineract-wallets module
  resourceId: number;
  resourceIdentifier?: string;
  subResourceId?: number;
  changes?: any;
  commandId?: string;
}

export interface FineractSyncLog {
  id: string;
  entity_type: 'client' | 'account' | 'transaction' | 'voucher' | 'wallet';
  entity_id: string;
  fineract_id: number;
  sync_status: 'pending' | 'synced' | 'failed';
  synced_at?: Date;
}

// Voucher types (fineract-voucher module)
export interface FineractVoucher {
  id: number;
  voucherCode: string;
  clientId: number;
  productId: number;
  amount: number;
  currencyCode: string;
  status: {
    id: number;
    code: string;
    value: string; // 'ISSUED', 'ACTIVE', 'REDEEMED', 'EXPIRED'
  };
  issuedDate: string;
  expiryDate: string;
  externalId?: string; // Buffr voucher ID
  namqrData?: string;
  tokenVaultId?: string;
  smartPayStatus?: string;
}

// Wallet types (fineract-wallets module)
export interface FineractWallet {
  id: number;
  walletNumber: string;
  clientId: number;
  productId: number;
  balance: number;
  availableBalance: number;
  currencyCode: string;
  status: {
    id: number;
    code: string;
    value: string; // 'ACTIVE', 'FROZEN', 'CLOSED'
  };
  externalId?: string; // Buffr user ID
  ussdEnabled: boolean;
  lastSyncChannel?: string;
  lastSyncAt?: string;
}

export interface FineractWalletTransaction {
  id: number;
  walletId: number;
  transactionType: {
    id: number;
    code: string;
    value: string; // 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_OUT', 'TRANSFER_IN', 'PAYMENT'
  };
  amount: number;
  balanceAfter: number;
  transactionDate: string;
  reference?: string;
  description?: string;
  channel?: string; // 'MOBILE_APP', 'USSD', 'SMS', 'API'
  counterpartyWalletId?: number;
  ipsTransactionId?: string;
}

// ============================================================================
// FINERACT SERVICE
// ============================================================================

class FineractService {
  private writeUrl: string;
  private readUrls: string[];
  private batchUrl: string;
  private writeAuthHeader: string;
  private readAuthHeader: string;
  private batchAuthHeader: string;
  private tenantId: string;

  constructor() {
    // Write instance configuration
    this.writeUrl = FINERACT_WRITE_URL;
    const writeCredentials = `${FINERACT_WRITE_USERNAME}:${FINERACT_WRITE_PASSWORD}`;
    this.writeAuthHeader = `Basic ${Buffer.from(writeCredentials).toString('base64')}`;

    // Read instances configuration
    this.readUrls = FINERACT_READ_URLS;
    const readCredentials = `${FINERACT_READ_USERNAME}:${FINERACT_READ_PASSWORD}`;
    this.readAuthHeader = `Basic ${Buffer.from(readCredentials).toString('base64')}`;
    
    // Initialize health tracking for read instances
    this.readUrls.forEach(url => {
      readInstanceHealth.set(url, { healthy: true, lastCheck: 0 });
    });

    // Batch instance configuration
    this.batchUrl = FINERACT_BATCH_URL;
    const batchCredentials = `${FINERACT_BATCH_USERNAME}:${FINERACT_BATCH_PASSWORD}`;
    this.batchAuthHeader = `Basic ${Buffer.from(batchCredentials).toString('base64')}`;

    this.tenantId = FINERACT_TENANT_ID;

    // Start health check for read instances (in background)
    this.startReadInstanceHealthChecks();
  }

  /**
   * Get the appropriate base URL and auth header based on HTTP method
   * 
   * Routing logic:
   * - Write operations (POST, PUT, PATCH, DELETE) → Write instance
   * - Read operations (GET) → Read instance (round-robin with health checks)
   */
  private getInstanceConfig(method: 'GET' | 'POST' | 'PUT' | 'PATCH'): {
    baseUrl: string;
    authHeader: string;
  } {
    if (method === 'GET') {
      // Read operation → use read instance (round-robin)
      const healthyUrls = this.readUrls.filter(url => {
        const health = readInstanceHealth.get(url);
        return health?.healthy !== false;
      });

      if (healthyUrls.length === 0) {
        // All read instances unhealthy, fallback to write instance
        logger.warn('All read instances unhealthy, falling back to write instance for read operation');
        return {
          baseUrl: this.writeUrl,
          authHeader: this.writeAuthHeader,
        };
      }

      // Round-robin selection
      const selectedUrl = healthyUrls[readInstanceIndex % healthyUrls.length];
      readInstanceIndex = (readInstanceIndex + 1) % healthyUrls.length;

      return {
        baseUrl: selectedUrl,
        authHeader: this.readAuthHeader,
      };
    } else {
      // Write operation → use write instance
      return {
        baseUrl: this.writeUrl,
        authHeader: this.writeAuthHeader,
      };
    }
  }

  /**
   * Start background health checks for read instances
   */
  private startReadInstanceHealthChecks(): void {
    // Run health check every HEALTH_CHECK_INTERVAL
    setInterval(async () => {
      for (const url of this.readUrls) {
        try {
          const healthUrl = `${url.replace('/api/v1', '')}/actuator/health`;
          const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Authorization': this.readAuthHeader,
              'Fineract-Platform-TenantId': this.tenantId,
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          const health = readInstanceHealth.get(url);
          if (health) {
            health.healthy = response.ok;
            health.lastCheck = Date.now();
          } else {
            readInstanceHealth.set(url, {
              healthy: response.ok,
              lastCheck: Date.now(),
            });
          }
        } catch (error) {
          // Mark as unhealthy on error
          const health = readInstanceHealth.get(url);
          if (health) {
            health.healthy = false;
            health.lastCheck = Date.now();
          } else {
            readInstanceHealth.set(url, {
              healthy: false,
              lastCheck: Date.now(),
            });
          }
          logger.warn(`Health check failed for read instance ${url}:`, error);
        }
      }
    }, HEALTH_CHECK_INTERVAL);
  }

  /**
   * Make API call to Fineract
   * 
   * Automatically routes to appropriate instance:
   * - GET → Read instance (round-robin)
   * - POST/PUT/PATCH → Write instance
   */
  private async callFineract<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    payload?: any,
    options?: { requestId?: string; userId?: string; instanceType?: 'write' | 'read' | 'batch' }
  ): Promise<{ success: boolean; data?: T; error?: string; responseTime?: number }> {
    const requestId = options?.requestId || generateRequestId();
    const startTime = Date.now();

    try {
      // Get instance configuration based on method (or override with instanceType)
      let instanceConfig;
      if (options?.instanceType === 'batch') {
        instanceConfig = {
          baseUrl: this.batchUrl,
          authHeader: this.batchAuthHeader,
        };
      } else if (options?.instanceType === 'write') {
        instanceConfig = {
          baseUrl: this.writeUrl,
          authHeader: this.writeAuthHeader,
        };
      } else if (options?.instanceType === 'read') {
        // Use round-robin for read
        const healthyUrls = this.readUrls.filter(url => {
          const health = readInstanceHealth.get(url);
          return health?.healthy !== false;
        });
        const selectedUrl = healthyUrls.length > 0 
          ? healthyUrls[readInstanceIndex % healthyUrls.length]
          : this.writeUrl; // Fallback to write if all read instances unhealthy
        instanceConfig = {
          baseUrl: selectedUrl,
          authHeader: this.readAuthHeader,
        };
      } else {
        // Auto-route based on method
        instanceConfig = this.getInstanceConfig(method);
      }

      const url = `${instanceConfig.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': instanceConfig.authHeader,
        'Fineract-Platform-TenantId': this.tenantId,
        'X-Request-ID': requestId,
      };

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(FINERACT_TIMEOUT),
      };

      if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(payload);
      }

      const response = await fetch(url, fetchOptions);
      const responseTime = Date.now() - startTime;

      // Log API sync operation (audit trail)
      await logAPISyncOperation({
        request_id: requestId,
        direction: 'outbound',
        endpoint: url,
        method,
        statusCode: response.status,
        responseTime,
        success: response.ok,
        errorMessage: response.ok ? undefined : `Fineract API error: ${response.status}`,
        userId: options?.userId,
      }).catch(err => logger.error('Failed to log Fineract API sync:', err));

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Fineract API error (${response.status}): ${errorText}`,
          responseTime,
        };
      }

      const data = await response.json() as T;
      return {
        success: true,
        data,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.message || 'Fineract API call failed';

      // Log failed API sync operation
      await logAPISyncOperation({
        request_id: requestId,
        direction: 'outbound',
        endpoint: `${this.baseUrl}${endpoint}`,
        method,
        statusCode: 0,
        responseTime,
        success: false,
        errorMessage,
        userId: options?.userId,
      }).catch(err => logger.error('Failed to log Fineract API sync:', err));

      return {
        success: false,
        error: errorMessage,
        responseTime,
      };
    }
  }

  /**
   * Create client (beneficiary) in Fineract
   * 
   * Required fields: firstname, lastname, officeId, active, activationDate
   * Optional fields: externalId, mobileNo, dateOfBirth, savingsProductId
   */
  async createClient(
    clientData: {
      firstname: string;
      lastname: string;
      mobileNo: string;
      dateOfBirth?: string;
      externalId?: string; // Buffr user ID
      officeId?: number; // Default office ID (1 if not provided)
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractClient> {
    // Get default office if not provided
    let officeId = clientData.officeId;
    if (!officeId) {
      // Try to get first office (usually ID 1 is the head office)
      const officesResult = await this.callFineract<Array<{ id: number }>>(
        '/offices',
        'GET',
        undefined,
        options
      );
      if (officesResult.success && officesResult.data && officesResult.data.length > 0) {
        officeId = officesResult.data[0].id;
      } else {
        officeId = 1; // Fallback to office ID 1
      }
    }

    const result = await this.callFineract<CommandProcessingResult>(
      '/clients',
      'POST',
      {
        firstname: clientData.firstname,
        lastname: clientData.lastname,
        mobileNo: clientData.mobileNo,
        dateOfBirth: clientData.dateOfBirth,
        externalId: clientData.externalId,
        officeId: officeId,
        legalFormId: 1, // 1 = Person (Individual), 2 = Entity (Organization)
        active: true,
        activationDate: new Date().toISOString().split('T')[0],
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Fineract client');
    }

    // Extract client ID from CommandProcessingResult
    const clientId = (result.data as any).clientId || (result.data as any).resourceId;
    if (!clientId) {
      throw new Error('Client created but no client ID returned');
    }

    // Fetch the created client
    const clientResult = await this.callFineract<FineractClient>(
      `/clients/${clientId}`,
      'GET',
      undefined,
      options
    );

    if (!clientResult.success || !clientResult.data) {
      throw new Error('Client created but could not retrieve client details');
    }

    return clientResult.data;
  }

  /**
   * Get client by external ID (Buffr user ID)
   * 
   * Uses: GET /v1/clients?externalId={externalId}
   * Or: GET /v1/clients/external-id/{externalId}
   */
  async getClientByExternalId(
    externalId: string,
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractClient | null> {
    // Try the external-id path first (more direct)
    const directResult = await this.callFineract<FineractClient>(
      `/clients/external-id/${encodeURIComponent(externalId)}`,
      'GET',
      undefined,
      options
    );

    if (directResult.success && directResult.data) {
      return directResult.data;
    }

    // Fallback to query parameter approach
    const result = await this.callFineract<{ pageItems: FineractClient[] }>(
      `/clients?externalId=${encodeURIComponent(externalId)}`,
      'GET',
      undefined,
      options
    );

    if (!result.success || !result.data) {
      return null;
    }

    // Handle paginated response
    const clients = (result.data as any).pageItems || (result.data as any) || [];
    return Array.isArray(clients) && clients.length > 0 ? clients[0] : null;
  }

  /**
   * Create savings account for client
   * 
   * Required: clientId, productId, submittedOnDate
   * Optional: externalId, accountNo
   * 
   * Note: Savings product must exist first. Use getDefaultSavingsProduct() to get product ID.
   */
  async createAccount(
    clientId: number,
    accountType: 'SAVINGS' | 'CURRENT',
    options?: { requestId?: string; userId?: string; productId?: number; externalId?: string }
  ): Promise<FineractAccount> {
    // Get default savings product if not provided
    let productId = options?.productId;
    if (!productId) {
      const productsResult = await this.callFineract<Array<{ id: number }>>(
        '/savingsproducts',
        'GET',
        undefined,
        options
      );
      if (productsResult.success && productsResult.data && productsResult.data.length > 0) {
        productId = productsResult.data[0].id;
      } else {
        throw new Error('No savings products found. Please create a savings product first.');
      }
    }

    const result = await this.callFineract<CommandProcessingResult>(
      '/savingsaccounts',
      'POST',
      {
        clientId: clientId,
        productId: productId,
        submittedOnDate: new Date().toISOString().split('T')[0],
        externalId: options?.externalId,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Fineract account');
    }

    // Extract account ID from CommandProcessingResult
    const accountId = (result.data as any).savingsId || (result.data as any).resourceId;
    if (!accountId) {
      throw new Error('Account created but no account ID returned');
    }

    // Fetch the created account
    const accountResult = await this.callFineract<FineractAccount>(
      `/savingsaccounts/${accountId}`,
      'GET',
      undefined,
      options
    );

    if (!accountResult.success || !accountResult.data) {
      throw new Error('Account created but could not retrieve account details');
    }

    return accountResult.data;
  }

  /**
   * Get account balance
   * 
   * Uses: GET /v1/savingsaccounts/{accountId}
   * Balance is in summary.accountBalance
   */
  async getAccountBalance(
    accountId: number,
    options?: { requestId?: string; userId?: string }
  ): Promise<number> {
    const result = await this.callFineract<{
      summary?: { accountBalance?: number; availableBalance?: number };
      accountBalance?: number;
    }>(
      `/savingsaccounts/${accountId}`,
      'GET',
      undefined,
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get account balance');
    }

    // Extract balance from response (can be in summary or directly)
    const data = result.data;
    if (data.summary?.accountBalance !== undefined) {
      return parseFloat(data.summary.accountBalance.toString());
    }
    if (data.accountBalance !== undefined) {
      return parseFloat(data.accountBalance.toString());
    }

    return 0;
  }

  /**
   * Create transaction in Fineract
   * 
   * Uses: POST /v1/savingsaccounts/{savingsId}/transactions?command=deposit|withdrawal
   * 
   * Required: transactionDate, transactionAmount
   * Optional: paymentTypeId, note
   */
  async createTransaction(
    accountId: number,
    transactionData: {
      transactionType: 'DEBIT' | 'CREDIT' | 'deposit' | 'withdrawal';
      amount: number;
      currency?: string;
      reference?: string;
      description?: string;
      paymentTypeId?: number;
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractTransaction> {
    // Map transaction type to Fineract command
    const command = transactionData.transactionType === 'CREDIT' || transactionData.transactionType === 'deposit'
      ? 'deposit'
      : 'withdrawal';

    const result = await this.callFineract<CommandProcessingResult>(
      `/savingsaccounts/${accountId}/transactions?command=${command}`,
      'POST',
      {
        transactionDate: new Date().toISOString().split('T')[0],
        transactionAmount: transactionData.amount,
        paymentTypeId: transactionData.paymentTypeId || 1, // Default payment type
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
        note: transactionData.description || transactionData.reference,
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Fineract transaction');
    }

    // Extract transaction ID from CommandProcessingResult
    const transactionId = (result.data as any).resourceId;
    if (!transactionId) {
      throw new Error('Transaction created but no transaction ID returned');
    }

    // Fetch the created transaction
    const transactionResult = await this.callFineract<FineractTransaction>(
      `/savingsaccounts/${accountId}/transactions/${transactionId}`,
      'GET',
      undefined,
      options
    );

    if (!transactionResult.success || !transactionResult.data) {
      throw new Error('Transaction created but could not retrieve transaction details');
    }

    return transactionResult.data;
  }

  /**
   * Sync transaction to Fineract
   */
  async syncTransaction(
    transactionId: string,
    accountId: number,
    transactionData: {
      transactionType: 'DEBIT' | 'CREDIT';
      amount: number;
      currency: string;
      reference: string;
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractTransaction> {
    const transaction = await this.createTransaction(accountId, transactionData, options);

    // Log sync status (in application database)
    const { query } = await import('@/utils/db');
    await query(
      `INSERT INTO fineract_sync_logs (entity_type, entity_id, fineract_id, sync_status, synced_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (entity_type, entity_id) 
       DO UPDATE SET fineract_id = $3, sync_status = $4, synced_at = NOW()`,
      ['transaction', transactionId, transaction.id, 'synced']
    ).catch(err => logger.error('Failed to log Fineract sync:', err));

    return transaction;
  }

  /**
   * Reconcile trust account with Fineract
   * 
   * NOTE: This method uses legacy savings accounts API for trust account management only.
   * All beneficiary operations use custom modules (fineract-voucher, fineract-wallets).
   */
  async reconcileTrustAccount(
    trustAccountId: number,
    options?: { requestId?: string }
  ): Promise<{
    fineractBalance: number;
    applicationBalance: number;
    difference: number;
    reconciled: boolean;
  }> {
    // Get Fineract account balance (trust account uses savings accounts API)
    const fineractBalance = await this.getAccountBalance(trustAccountId, options);

    // Get application trust account balance
    const { query } = await import('@/utils/db');
    const trustAccount = await query<{ balance: number }>(
      'SELECT balance FROM trust_account WHERE id = $1',
      [trustAccountId]
    );

    const applicationBalance = trustAccount.length > 0
      ? parseFloat(trustAccount[0].balance.toString())
      : 0;

    const difference = Math.abs(fineractBalance - applicationBalance);
    const reconciled = difference < 0.01; // Allow 0.01 NAD difference for rounding

    return {
      fineractBalance,
      applicationBalance,
      difference,
      reconciled,
    };
  }

  // ============================================================================
  // VOUCHER METHODS (fineract-voucher module)
  // ============================================================================

  /**
   * Create voucher in Fineract (fineract-voucher module)
   * 
   * Uses: POST /v1/vouchers
   * Required: clientId, productId, amount, issuedDate, expiryDate
   * Optional: externalId (Buffr voucher ID), namqrData, tokenVaultId
   */
  async createVoucher(
    voucherData: {
      clientId: number;
      productId?: number; // Voucher product ID (will fetch default if not provided)
      amount: number;
      currencyCode?: string;
      issuedDate: string; // yyyy-MM-dd
      expiryDate: string; // yyyy-MM-dd
      externalId?: string; // Buffr voucher ID (format: buffr_voucher_{voucherId})
      namqrData?: string;
      tokenVaultId?: string;
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractVoucher> {
    // Get default voucher product if not provided
    // Phase 1: Use savings products (not custom voucher products)
    let productId = voucherData.productId;
    if (!productId) {
      const productsResult = await this.callFineract<Array<{ id: number; name: string }>>(
        '/savingsproducts',
        'GET',
        undefined,
        options
      );
      if (productsResult.success && productsResult.data) {
        // Look for voucher product by name
        const products = Array.isArray(productsResult.data) 
          ? productsResult.data 
          : (productsResult.data as any).pageItems || [];
        const voucherProduct = products.find((p: any) => 
          p.name?.includes('Voucher') || p.name?.includes('voucher')
        );
        if (voucherProduct) {
          productId = voucherProduct.id;
        } else if (products.length > 0) {
          // Fallback to first product if no voucher product found
          productId = products[0].id;
        } else {
          throw new Error('No voucher products found. Please create a voucher product first.');
        }
      } else {
        throw new Error('No voucher products found. Please create a voucher product first.');
      }
    }

    // Phase 1: Use savings accounts API (not custom vouchers API)
    // Create a savings account for the voucher
    const result = await this.callFineract<CommandProcessingResult>(
      '/savingsaccounts',
      'POST',
      {
        clientId: voucherData.clientId,
        productId: productId,
        externalId: voucherData.externalId,
        submittedOnDate: voucherData.issuedDate,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Fineract voucher');
    }

    // Extract voucher ID from CommandProcessingResult
    const voucherId = (result.data as any).voucherId || (result.data as any).resourceId;
    if (!voucherId) {
      throw new Error('Voucher created but no voucher ID returned');
    }

    // Phase 1: Use savings accounts API (not custom vouchers API)
    const voucherResult = await this.callFineract<FineractVoucher>(
      `/savingsaccounts/${voucherId}`,
      'GET',
      undefined,
      options
    );

    if (!voucherResult.success || !voucherResult.data) {
      throw new Error('Voucher created but could not retrieve voucher details');
    }

    return voucherResult.data;
  }

  /**
   * Get voucher by ID
   * 
   * Uses: GET /v1/vouchers/{voucherId}
   */
  async getVoucher(
    voucherId: number,
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractVoucher> {
    const result = await this.callFineract<FineractVoucher>(
      `/vouchers/${voucherId}`,
      'GET',
      undefined,
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get Fineract voucher');
    }

    return result.data;
  }

  /**
   * Get voucher by external ID (Buffr voucher ID)
   * 
   * Uses: GET /v1/vouchers/external-id/{externalId}
   */
  async getVoucherByExternalId(
    externalId: string,
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractVoucher | null> {
    const result = await this.callFineract<FineractVoucher>(
      `/vouchers/external-id/${encodeURIComponent(externalId)}`,
      'GET',
      undefined,
      options
    );

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  }

  /**
   * Redeem voucher in Fineract (fineract-voucher module)
   * 
   * Uses: PUT /v1/vouchers/{voucherId}?command=redeem
   * Required: redemptionMethod, redemptionDate
   * Automatically debits trust account on redemption
   */
  async redeemVoucher(
    voucherId: number,
    redemptionData: {
      redemptionMethod: number; // 1=QR, 2=Bank Transfer, 3=Merchant Payment, 4=Cash Out
      redemptionDate: string; // yyyy-MM-dd
      bankAccountEncrypted?: string; // For bank transfer
      merchantId?: number; // For merchant payment
      description?: string;
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractVoucher> {
    const result = await this.callFineract<CommandProcessingResult>(
      `/vouchers/${voucherId}?command=redeem`,
      'PUT',
      {
        redemptionMethod: redemptionData.redemptionMethod,
        redemptionDate: redemptionData.redemptionDate,
        bankAccountEncrypted: redemptionData.bankAccountEncrypted,
        merchantId: redemptionData.merchantId,
        description: redemptionData.description,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to redeem Fineract voucher');
    }

    // Fetch the updated voucher
    return this.getVoucher(voucherId, options);
  }

  /**
   * Update SmartPay status for voucher (fineract-voucher module)
   * 
   * Uses: PUT /v1/vouchers/{voucherId}?command=updateSmartPayStatus
   * Required: smartPayStatus
   * Optional: description
   */
  async updateSmartPayStatus(
    voucherId: number,
    statusData: {
      smartPayStatus: string; // 'ISSUED', 'VERIFIED', 'REDEEMED', 'EXPIRED', 'CANCELLED'
      description?: string;
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractVoucher> {
    const result = await this.callFineract<CommandProcessingResult>(
      `/vouchers/${voucherId}?command=updateSmartPayStatus`,
      'PUT',
      {
        smartPayStatus: statusData.smartPayStatus,
        description: statusData.description,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update SmartPay status');
    }

    // Fetch the updated voucher
    return this.getVoucher(voucherId, options);
  }

  // ============================================================================
  // WALLET METHODS (fineract-wallets module)
  // ============================================================================

  /**
   * Create wallet in Fineract (fineract-wallets module)
   * 
   * Uses: POST /v1/wallets
   * Required: clientId, productId
   * Optional: externalId (Buffr user ID), ussdEnabled
   * Note: Wallet is automatically activated (no approval workflow)
   */
  async createWallet(
    walletData: {
      clientId: number;
      productId?: number; // Wallet product ID (will fetch default if not provided)
      externalId?: string; // Buffr user ID (format: buffr_user_{userId})
      ussdEnabled?: boolean;
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractWallet> {
    // Get default wallet product if not provided
    // Phase 1: Use savings products (not custom wallet products)
    let productId = walletData.productId;
    if (!productId) {
      const productsResult = await this.callFineract<Array<{ id: number; name: string }>>(
        '/savingsproducts',
        'GET',
        undefined,
        options
      );
      if (productsResult.success && productsResult.data) {
        // Look for wallet product by name
        const products = Array.isArray(productsResult.data) 
          ? productsResult.data 
          : (productsResult.data as any).pageItems || [];
        const walletProduct = products.find((p: any) => 
          p.name?.includes('Wallet') || p.name?.includes('wallet')
        );
        if (walletProduct) {
          productId = walletProduct.id;
        } else if (products.length > 0) {
          // Fallback to first product if no wallet product found
          productId = products[0].id;
        } else {
          throw new Error('No wallet products found. Please create a wallet product first.');
        }
      } else {
        throw new Error('No wallet products found. Please create a wallet product first.');
      }
    }

    // Phase 1: Use savings accounts API (not custom wallets API)
    const result = await this.callFineract<CommandProcessingResult>(
      '/savingsaccounts',
      'POST',
      {
        clientId: walletData.clientId,
        productId: productId,
        externalId: walletData.externalId,
        submittedOnDate: new Date().toISOString().split('T')[0],
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Fineract wallet');
    }

    // Extract wallet ID from CommandProcessingResult
    const walletId = (result.data as any).savingsId || (result.data as any).resourceId;
    if (!walletId) {
      throw new Error('Wallet created but no wallet ID returned');
    }

    // Phase 1: Approve and activate the savings account (required before transactions)
    // Approve the account
    const approveResult = await this.callFineract<CommandProcessingResult>(
      `/savingsaccounts/${walletId}?command=approve`,
      'POST',
      {
        approvedOnDate: new Date().toISOString().split('T')[0],
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (approveResult.success) {
      // Activate the account
      await this.callFineract<CommandProcessingResult>(
        `/savingsaccounts/${walletId}?command=activate`,
        'POST',
        {
          activatedOnDate: new Date().toISOString().split('T')[0],
          dateFormat: 'yyyy-MM-dd',
          locale: 'en',
        },
        options
      );
    }

    // Fetch the created wallet (Phase 1: Use savings accounts API)
    const walletResult = await this.callFineract<FineractWallet>(
      `/savingsaccounts/${walletId}`,
      'GET',
      undefined,
      options
    );

    if (!walletResult.success || !walletResult.data) {
      throw new Error('Wallet created but could not retrieve wallet details');
    }

    return walletResult.data;
  }

  /**
   * Get wallet by ID
   * 
   * Phase 1: Uses GET /v1/savingsaccounts/{walletId} (not custom wallets API)
   */
  async getWallet(
    walletId: number,
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractWallet> {
    // Phase 1: Use savings accounts API (not custom wallets API)
    const result = await this.callFineract<FineractWallet>(
      `/savingsaccounts/${walletId}`,
      'GET',
      undefined,
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get Fineract wallet');
    }

    return result.data;
  }

  /**
   * Get wallet by external ID (Buffr user ID)
   * 
   * Uses: GET /v1/wallets/external-id/{externalId}
   */
  async getWalletByExternalId(
    externalId: string,
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractWallet | null> {
    const result = await this.callFineract<FineractWallet>(
      `/wallets/external-id/${encodeURIComponent(externalId)}`,
      'GET',
      undefined,
      options
    );

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  }

  /**
   * Get wallet balance
   * 
   * Uses: GET /v1/wallets/{walletId}
   * Balance is in balance or availableBalance field
   */
  async getWalletBalance(
    walletId: number,
    options?: { requestId?: string; userId?: string }
  ): Promise<number> {
    const wallet = await this.getWallet(walletId, options);
    return parseFloat(wallet.balance.toString());
  }

  /**
   * Deposit to wallet (fineract-wallets module)
   * 
   * Uses: PUT /v1/wallets/{walletId}?command=deposit
   * Required: transactionDate, transactionAmount
   * Optional: reference, description, channel
   */
  async depositToWallet(
    walletId: number,
    depositData: {
      amount: number;
      transactionDate: string; // yyyy-MM-dd
      reference?: string;
      description?: string;
      channel?: 'mobile_app' | 'ussd' | 'sms' | 'api';
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractWalletTransaction> {
    // Phase 1: Use savings accounts API (not custom wallets API)
    const result = await this.callFineract<CommandProcessingResult>(
      `/savingsaccounts/${walletId}/transactions?command=deposit`,
      'POST',
      {
        transactionDate: depositData.transactionDate,
        transactionAmount: depositData.amount,
        paymentTypeId: 1, // Default payment type
        note: depositData.description || depositData.reference || 'Deposit',
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to deposit to Fineract wallet');
    }

    // Extract transaction ID from CommandProcessingResult
    const transactionId = (result.data as any).resourceId;
    if (!transactionId) {
      throw new Error('Deposit created but no transaction ID returned');
    }

    // Phase 1: Use savings accounts API
    const transactionResult = await this.callFineract<FineractWalletTransaction>(
      `/savingsaccounts/${walletId}/transactions/${transactionId}`,
      'GET',
      undefined,
      options
    );

    if (!transactionResult.success || !transactionResult.data) {
      throw new Error('Deposit created but could not retrieve transaction details');
    }

    return transactionResult.data;
  }

  /**
   * Withdraw from wallet (fineract-wallets module)
   * 
   * Uses: PUT /v1/wallets/{walletId}?command=withdraw
   * Required: transactionDate, transactionAmount
   * Optional: reference, description, channel
   */
  async withdrawFromWallet(
    walletId: number,
    withdrawData: {
      amount: number;
      transactionDate: string; // yyyy-MM-dd
      reference?: string;
      description?: string;
      channel?: 'mobile_app' | 'ussd' | 'sms' | 'api';
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractWalletTransaction> {
    // Phase 1: Use savings accounts API (not custom wallets API)
    const result = await this.callFineract<CommandProcessingResult>(
      `/savingsaccounts/${walletId}/transactions?command=withdrawal`,
      'POST',
      {
        transactionDate: withdrawData.transactionDate,
        transactionAmount: withdrawData.amount,
        paymentTypeId: 1, // Default payment type
        note: withdrawData.description || withdrawData.reference || 'Withdrawal',
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to withdraw from Fineract wallet');
    }

    // Extract transaction ID from CommandProcessingResult
    const transactionId = (result.data as any).resourceId;
    if (!transactionId) {
      throw new Error('Withdrawal created but no transaction ID returned');
    }

    // Phase 1: Use savings accounts API
    const transactionResult = await this.callFineract<FineractWalletTransaction>(
      `/savingsaccounts/${walletId}/transactions/${transactionId}`,
      'GET',
      undefined,
      options
    );

    if (!transactionResult.success || !transactionResult.data) {
      throw new Error('Withdrawal created but could not retrieve transaction details');
    }

    return transactionResult.data;
  }

  /**
   * Transfer between wallets (fineract-wallets module)
   * 
   * Uses: PUT /v1/wallets/{walletId}?command=transfer
   * Required: toWalletId, transactionDate, transactionAmount
   * Optional: reference, description, channel, ipsTransactionId
   */
  async transferBetweenWallets(
    fromWalletId: number,
    transferData: {
      toWalletId: number;
      amount: number;
      transactionDate: string; // yyyy-MM-dd
      reference?: string;
      description?: string;
      channel?: 'mobile_app' | 'ussd' | 'sms' | 'api';
      ipsTransactionId?: string; // IPS transaction ID for wallet-to-wallet transfers
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractWalletTransaction> {
    const result = await this.callFineract<CommandProcessingResult>(
      `/wallets/${fromWalletId}?command=transfer`,
      'PUT',
      {
        toWalletId: transferData.toWalletId,
        transactionDate: transferData.transactionDate,
        transactionAmount: transferData.amount,
        reference: transferData.reference,
        description: transferData.description,
        channel: transferData.channel || 'api',
        ipsTransactionId: transferData.ipsTransactionId,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      },
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to transfer between Fineract wallets');
    }

    // Extract transaction ID from CommandProcessingResult
    const transactionId = (result.data as any).resourceId;
    if (!transactionId) {
      throw new Error('Transfer created but no transaction ID returned');
    }

    // Fetch the created transaction
    const transactionResult = await this.callFineract<FineractWalletTransaction>(
      `/wallets/${fromWalletId}/transactions/${transactionId}`,
      'GET',
      undefined,
      options
    );

    if (!transactionResult.success || !transactionResult.data) {
      throw new Error('Transfer created but could not retrieve transaction details');
    }

    return transactionResult.data;
  }

  /**
   * Get wallet transaction history
   * 
   * Uses: GET /v1/wallets/{walletId}/transactions
   * Optional query params: fromDate, toDate, limit, offset
   */
  async getWalletTransactions(
    walletId: number,
    filters?: {
      fromDate?: string; // yyyy-MM-dd
      toDate?: string; // yyyy-MM-dd
      limit?: number;
      offset?: number;
    },
    options?: { requestId?: string; userId?: string }
  ): Promise<FineractWalletTransaction[]> {
    // Phase 1: Use savings accounts API
    let endpoint = `/savingsaccounts/${walletId}/transactions`;
    const params: string[] = [];
    
    if (filters?.fromDate) params.push(`fromDate=${filters.fromDate}`);
    if (filters?.toDate) params.push(`toDate=${filters.toDate}`);
    if (filters?.limit) params.push(`limit=${filters.limit}`);
    if (filters?.offset) params.push(`offset=${filters.offset}`);
    
    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }

    const result = await this.callFineract<{ pageItems?: FineractWalletTransaction[] } | FineractWalletTransaction[]>(
      endpoint,
      'GET',
      undefined,
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get wallet transactions');
    }

    // Handle paginated response
    const data = result.data as any;
    if (data.pageItems) {
      return data.pageItems;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }

  /**
   * Get or create Fineract wallet for Buffr user
   * 
   * Helper method to ensure user has a Fineract wallet.
   * Returns existing wallet or creates new one.
   * 
   * This is the recommended way to get a user's wallet for payment operations.
   */
  async getOrCreateWalletForUser(
    userId: string,
    options?: { requestId?: string }
  ): Promise<FineractWallet> {
    // Try to get existing wallet by external ID
    let wallet = await this.getWalletByExternalId(userId, options);
    
    if (wallet) {
      return wallet;
    }

    // Get or create Fineract client
    let client = await this.getClientByExternalId(userId, options);
    
    if (!client) {
      // Get user details to create client
      const { query } = await import('@/utils/db');
      const userDetails = await query<{
        first_name: string;
        last_name: string;
        phone_number: string;
      }>(
        'SELECT first_name, last_name, phone_number FROM users WHERE id = $1',
        [userId]
      );

      if (userDetails.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      client = await this.createClient({
        firstname: userDetails[0].first_name,
        lastname: userDetails[0].last_name,
        mobileNo: userDetails[0].phone_number,
        externalId: userId,
      }, options);

      // Log sync status
      await query(
        `INSERT INTO fineract_sync_logs (entity_type, entity_id, fineract_id, sync_status, synced_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (entity_type, entity_id) 
         DO UPDATE SET fineract_id = $3, sync_status = $4, synced_at = NOW()`,
        ['client', userId, client.id, 'synced']
      ).catch(err => logger.error('Failed to log Fineract client sync:', err));
    }

    // Create wallet
    wallet = await this.createWallet({
      clientId: client.id,
      externalId: userId,
      ussdEnabled: true, // Enable USSD access for feature phones
    }, options);

    // Store wallet mapping
    const { query } = await import('@/utils/db');
    await query(
      `INSERT INTO fineract_accounts (
        user_id, fineract_client_id, fineract_wallet_id, wallet_no, status
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) 
      DO UPDATE SET fineract_wallet_id = $3, wallet_no = $4, status = $5`,
      [
        userId,
        client.id,
        wallet.id,
        wallet.walletNumber,
        'ACTIVE',
      ]
    ).catch(err => logger.error('Failed to store wallet mapping:', err));

    // Log sync status
    await query(
      `INSERT INTO fineract_sync_logs (entity_type, entity_id, fineract_id, sync_status, synced_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (entity_type, entity_id) 
       DO UPDATE SET fineract_id = $3, sync_status = $4, synced_at = NOW()`,
      ['wallet', userId, wallet.id, 'synced']
    ).catch(err => logger.error('Failed to log Fineract wallet sync:', err));

    return wallet;
  }
}

export const fineractService = new FineractService();
