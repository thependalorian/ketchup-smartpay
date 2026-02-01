/**
 * Open Banking API: /api/v1/fineract/accounts
 * 
 * Fineract account management (Open Banking format)
 * Note: Trust account only - uses standard savings accounts API
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/fineract/accounts
 * Get trust account by user ID
 */
async function handleGetAccount(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'user_id query parameter is required',
        400
      );
    }

    // Get Fineract account mapping
    const accounts = await query<any>(
      'SELECT id, user_id, fineract_client_id, fineract_account_id, account_type, account_no, status FROM fineract_accounts WHERE user_id = $1',
      [userId]
    );

    if (accounts.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Fineract account not found for user',
        404
      );
    }

    const account = accounts[0];

    // Get balance from Fineract
    let balance = 0;
    try {
      balance = await fineractService.getAccountBalance(account.fineract_account_id);
    } catch (error: any) {
      log.error('Failed to get account balance from Fineract', error);
      // Continue with balance = 0 if account not yet activated
    }

    const accountResponse = {
      Data: {
        AccountId: account.id,
        UserId: account.user_id,
        FineractClientId: account.fineract_client_id,
        FineractAccountId: account.fineract_account_id,
        AccountType: account.account_type,
        AccountNumber: account.account_no,
        Status: account.status,
        Balance: balance,
      },
      Links: {
        Self: `/api/v1/fineract/accounts?user_id=${userId}`,
      },
      Meta: {},
    };

    return helpers.success(
      accountResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting Fineract account:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving the account',
      500
    );
  }
}

/**
 * POST /api/v1/fineract/accounts
 * Create trust account for client
 */
async function handleCreateAccount(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { UserId, AccountType } = Data;

    if (!UserId || !AccountType) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'UserId and AccountType are required',
        400
      );
    }

    // Get user
    const users = await query<any>(
      'SELECT id, first_name, last_name, phone FROM users WHERE id = $1',
      [UserId]
    );

    if (users.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const user = users[0];

    // Get or create Fineract client
    let client = await fineractService.getClientByExternalId(UserId);
    if (!client) {
      client = await fineractService.createClient({
        firstname: user.first_name,
        lastname: user.last_name,
        mobileNo: user.phone,
        externalId: UserId,
      });
    }

    // Create account in Fineract
    const account = await fineractService.createAccount(
      client.id,
      AccountType as 'SAVINGS' | 'CURRENT',
      {
        externalId: `${UserId}_${AccountType.toLowerCase()}`,
      }
    );

    // Store account mapping
    const accountResult = await query<any>(
      `INSERT INTO fineract_accounts (
        user_id, fineract_client_id, fineract_account_id, account_type, account_no, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, account_type) 
      DO UPDATE SET fineract_account_id = $3, updated_at = NOW()
      RETURNING id`,
      [
        UserId,
        client.id,
        account.id,
        AccountType,
        account.accountNo || null,
        account.status,
      ]
    );

    const accountResponse = {
      Data: {
        AccountId: accountResult[0].id,
        UserId,
        FineractClientId: client.id,
        FineractAccountId: account.id,
        AccountType: account.accountType,
        AccountNumber: account.accountNo,
        Status: account.status,
      },
      Links: {
        Self: `/api/v1/fineract/accounts?user_id=${UserId}`,
      },
      Meta: {},
    };

    return helpers.created(
      accountResponse,
      `/api/v1/fineract/accounts?user_id=${UserId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating Fineract account:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the account',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetAccount,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleCreateAccount,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
