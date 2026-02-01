/**
 * Open Banking API: /api/v1/fineract/wallets
 * 
 * Fineract wallet management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/fineract/wallets
 * Get Fineract wallet by user ID
 */
async function handleGetWallet(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id'); // Buffr user ID

    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'user_id query parameter is required',
        400
      );
    }

    // Get Fineract wallet by external ID
    const externalId = `buffr_user_${userId}`;
    const wallet = await fineractService.getWalletByExternalId(externalId, {
      userId,
    });

    if (!wallet) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Fineract wallet not found for user',
        404
      );
    }

    // Check if mapping exists
    const accounts = await query<any>(
      'SELECT id, user_id, fineract_client_id, fineract_wallet_id, wallet_no, status FROM fineract_accounts WHERE user_id = $1',
      [userId]
    );

    const walletResponse = {
      Data: {
        WalletId: wallet.id,
        UserId: userId,
        FineractClientId: wallet.clientId,
        WalletNumber: wallet.walletNumber,
        Balance: parseFloat(wallet.balance.toString()),
        AvailableBalance: parseFloat(wallet.availableBalance?.toString() || wallet.balance.toString()),
        CurrencyCode: wallet.currencyCode,
        Status: wallet.status.value,
        USSDEnabled: wallet.ussdEnabled,
        LastSyncChannel: wallet.lastSyncChannel,
        LastSyncAt: wallet.lastSyncAt,
        Mapped: accounts.length > 0,
      },
      Links: {
        Self: `/api/v1/fineract/wallets?user_id=${userId}`,
      },
      Meta: {},
    };

    return helpers.success(
      walletResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting Fineract wallet:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving the wallet',
      500
    );
  }
}

/**
 * POST /api/v1/fineract/wallets
 * Create wallet in Fineract
 */
async function handleCreateWallet(req: ExpoRequest) {
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

    const { UserId, ProductId, USSDEnabled } = Data;

    if (!UserId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.UserId is required',
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

    // Create wallet in Fineract
    const wallet = await fineractService.createWalletForUser(
      client.id,
      {
        walletId: UserId,
        name: `${user.first_name} ${user.last_name} Wallet`,
        type: 'personal',
        currency: 'NAD',
        purpose: null,
      },
      { requestId: context?.requestId, userId: UserId }
    );

    // Store mapping
    await query(
      `INSERT INTO fineract_accounts (
        user_id, fineract_client_id, fineract_wallet_id, wallet_no, status
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) 
      DO UPDATE SET fineract_wallet_id = $3, updated_at = NOW()`,
      [
        UserId,
        client.id,
        wallet.id,
        wallet.walletNumber,
        'active',
      ]
    );

    const walletResponse = {
      Data: {
        WalletId: wallet.id,
        UserId,
        FineractClientId: client.id,
        WalletNumber: wallet.walletNumber,
        Balance: 0,
        CurrencyCode: 'NAD',
        Status: 'active',
        USSDEnabled: USSDEnabled !== false,
      },
      Links: {
        Self: `/api/v1/fineract/wallets?user_id=${UserId}`,
      },
      Meta: {},
    };

    return helpers.created(
      walletResponse,
      `/api/v1/fineract/wallets?user_id=${UserId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating Fineract wallet:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the wallet',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetWallet,
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
