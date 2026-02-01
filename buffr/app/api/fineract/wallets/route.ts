/**
 * Fineract Wallets API Route
 * 
 * Location: app/api/fineract/wallets/route.ts
 * Purpose: Manage wallets in Fineract (fineract-wallets module)
 * 
 * Methods:
 * - GET: Get wallet by Buffr user ID (external ID, includes balance)
 * - POST: Create wallet for Buffr user (with external ID linking)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id'); // Buffr user ID

    if (!userId) {
      return errorResponse('user_id is required', HttpStatus.BAD_REQUEST);
    }

    // Get Fineract wallet by external ID (Buffr user ID)
    const externalId = `buffr_user_${userId}`;
    const wallet = await fineractService.getWalletByExternalId(externalId, {
      userId,
    });

    if (!wallet) {
      return errorResponse('Fineract wallet not found for user', HttpStatus.NOT_FOUND);
    }

    // Check if mapping exists in database
    const accounts = await query<{
      id: string;
      user_id: string;
      fineract_client_id: number;
      fineract_wallet_id: number;
      wallet_no: string;
      status: string;
    }>(
      'SELECT id, user_id, fineract_client_id, fineract_wallet_id, wallet_no, status FROM fineract_accounts WHERE user_id = $1',
      [userId]
    );

    return successResponse({
      id: accounts.length > 0 ? accounts[0].id : null,
      userId,
      fineractClientId: wallet.clientId,
      fineractWalletId: wallet.id,
      walletNumber: wallet.walletNumber,
      balance: wallet.balance,
      availableBalance: wallet.availableBalance,
      currencyCode: wallet.currencyCode,
      status: wallet.status.value,
      ussdEnabled: wallet.ussdEnabled,
      lastSyncChannel: wallet.lastSyncChannel,
      lastSyncAt: wallet.lastSyncAt,
      mapped: accounts.length > 0,
    }, 'Wallet retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting Fineract wallet', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest) {
  try {
    const body = await req.json();
    const {
      userId, // Buffr user ID
      productId, // Wallet product ID (optional, will use default)
      ussdEnabled = true,
    } = body;

    if (!userId) {
      return errorResponse('userId is required', HttpStatus.BAD_REQUEST);
    }

    // Get user
    const users = await query<{ id: string; first_name: string; last_name: string; phone: string }>(
      'SELECT id, first_name, last_name, phone FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    const user = users[0];

    // Get or create Fineract client
    let client = await fineractService.getClientByExternalId(userId);
    if (!client) {
      client = await fineractService.createClient({
        firstname: user.first_name,
        lastname: user.last_name,
        mobileNo: user.phone,
        externalId: userId,
      });
    }

    // Create wallet in Fineract (automatically activated, no approval needed)
    const externalId = `buffr_user_${userId}`;
    const wallet = await fineractService.createWallet(
      {
        clientId: client.id,
        productId,
        externalId,
        ussdEnabled,
      },
      {
        userId,
      }
    );

    // Store wallet mapping in fineract_accounts table
    // Use account_type = 'WALLET' to distinguish from trust account (account_type = 'SAVINGS' or 'TRUST')
    const accountResult = await query<{ id: string }>(
      `INSERT INTO fineract_accounts (
        user_id, fineract_client_id, fineract_wallet_id, wallet_no, account_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, account_type) 
      DO UPDATE SET fineract_wallet_id = $3, wallet_no = $4, status = $6, updated_at = NOW()
      RETURNING id`,
      [
        userId,
        client.id,
        wallet.id,
        wallet.walletNumber,
        'WALLET', // Account type to distinguish from trust account
        wallet.status.value,
      ]
    );

    return createdResponse(
      {
        id: accountResult[0].id,
        userId,
        fineractClientId: client.id,
        fineractWalletId: wallet.id,
        walletNumber: wallet.walletNumber,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        currencyCode: wallet.currencyCode,
        status: wallet.status.value,
        ussdEnabled: wallet.ussdEnabled,
      },
      `/api/fineract/wallets?user_id=${userId}`,
      'Wallet created successfully in Fineract'
    );
  } catch (error: any) {
    logger.error('Error creating Fineract wallet', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.api, getHandler);
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
