/**
 * Open Banking API: /api/v1/wallets
 * 
 * Open Banking-compliant wallets endpoint
 * 
 * Features:
 * - Open Banking account format
 * - Account balance retrieval
 * - Open Banking pagination
 * - API versioning (v1)
 * 
 * Example requests:
 * GET /api/v1/wallets
 * POST /api/v1/wallets
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { validateCurrency, validateWalletType } from '@/utils/validators';
import { log } from '@/utils/logger';
import { fineractService } from '@/services/fineractService';
import { randomUUID } from 'crypto';

/**
 * GET /api/v1/wallets
 * List wallets/accounts with Open Banking pagination
 */
async function handleGetWallets(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Parse Open Banking pagination parameters
    const { page, pageSize } = parsePaginationParams(req);

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM wallets WHERE user_id = $1',
      [actualUserId]
    );
    const total = parseInt(countResult[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / pageSize);

    // Fetch wallets with pagination
    const offset = (page - 1) * pageSize;
    const wallets = await query<any>(
      `SELECT * FROM wallets 
       WHERE user_id = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [actualUserId, pageSize, offset]
    );

    // Format as Open Banking accounts
    const accounts = await Promise.all(
      wallets.map(async (wallet) => {
        // Try to get Fineract wallet for balance
        let balance = parseFloat(wallet.balance.toString());
        try {
          const fineractWallet = await fineractService.getWallet(wallet.id);
          balance = parseFloat(fineractWallet.balance.toString());
        } catch (error) {
          // Fallback to DB balance
        }

        return {
          AccountId: wallet.id,
          Status: wallet.status === 'active' ? 'Enabled' : 'Disabled',
          StatusUpdateDateTime: wallet.updated_at?.toISOString() || wallet.created_at.toISOString(),
          Currency: wallet.currency || 'NAD',
          AccountType: wallet.type || 'Personal',
          AccountSubType: wallet.purpose || 'CurrentAccount',
          Nickname: wallet.name || 'Wallet',
          Account: [
            {
              SchemeName: 'BuffrAccount',
              Identification: wallet.id,
              Name: wallet.name || 'Wallet',
              SecondaryIdentification: null,
            },
          ],
          Servicer: {
            SchemeName: 'Buffr',
            Identification: 'BUFFR',
          },
        };
      })
    );

    return helpers.paginated(
      accounts,
      'Account',
      '/api/v1/wallets',
      page,
      pageSize,
      total,
      req,
      undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching wallets:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching wallets',
      500
    );
  }
}

/**
 * POST /api/v1/wallets
 * Create wallet (Open Banking format)
 */
async function handleCreateWallet(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Name, Type, Currency, Purpose, AutoPaySettings } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!Name) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Name is missing',
          'Data.Name'
        )
      );
    }

    if (!Type) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Type is missing',
          'Data.Type'
        )
      );
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
      );
    }

    // Validate type
    const typeCheck = validateWalletType(Type);
    if (!typeCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        typeCheck.error || 'Invalid wallet type',
        400
      );
    }

    // Validate currency
    const currency = Currency || 'NAD';
    if (!validateCurrency(currency)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid currency code',
        400
      );
    }

    // Create wallet in Fineract
    const walletId = randomUUID();
    try {
      await fineractService.createWalletForUser(
        actualUserId,
        {
          walletId,
          name: Name,
          type: Type,
          currency,
          purpose: Purpose || null,
        },
        { requestId: context?.requestId, userId: actualUserId }
      );
    } catch (error: any) {
      log.error('Fineract wallet creation error:', error);
      // Fallback: Create in local DB
      await query(
        `INSERT INTO wallets (
          id, user_id, name, type, currency, purpose, balance, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          walletId,
          actualUserId,
          Name,
          Type,
          currency,
          Purpose || null,
          0,
          'active',
          new Date(),
        ]
      );
    }

    // Handle AutoPay settings if provided
    if (AutoPaySettings && AutoPaySettings.Enabled) {
      await query(
        `UPDATE wallets SET 
          auto_pay_enabled = $1,
          auto_pay_max_amount = $2,
          auto_pay_frequency = $3,
          auto_pay_amount = $4,
          auto_pay_deduct_date = $5,
          auto_pay_deduct_time = $6
        WHERE id = $7`,
        [
          true,
          AutoPaySettings.MaxAmount || null,
          AutoPaySettings.Frequency || null,
          AutoPaySettings.Amount || null,
          AutoPaySettings.DeductDate || null,
          AutoPaySettings.DeductTime || null,
          walletId,
        ]
      );
    }

    const walletResponse = {
      Data: {
        WalletId: walletId,
        UserId: actualUserId,
        Name,
        Type,
        Currency: currency,
        Purpose: Purpose || null,
        Balance: 0,
        Status: 'active',
        AutoPayEnabled: AutoPaySettings?.Enabled || false,
        CreatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/wallets/${walletId}`,
      },
      Meta: {},
    };

    return helpers.created(
      walletResponse,
      `/api/v1/wallets/${walletId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating wallet:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the wallet',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetWallets,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleCreateWallet,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
