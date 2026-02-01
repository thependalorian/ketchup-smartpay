/**
 * Fineract Accounts API Route (LEGACY - Trust Account Only)
 * 
 * Location: app/api/fineract/accounts/route.ts
 * Purpose: Manage trust account in Fineract (uses standard savings accounts API)
 * 
 * NOTE: This endpoint uses Fineract's standard savings accounts API for trust account management only.
 * All beneficiary operations use custom modules:
 * - Vouchers: Use /api/fineract/vouchers (fineract-voucher module)
 * - Wallets: Use /api/fineract/wallets (fineract-wallets module)
 * 
 * Methods:
 * - GET: Get trust account by user ID
 * - POST: Create trust account for client
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
    const userId = searchParams.get('user_id');

    if (!userId) {
      return errorResponse('user_id is required', HttpStatus.BAD_REQUEST);
    }

    // Get Fineract account mapping
    const accounts = await query<{
      id: string;
      user_id: string;
      fineract_client_id: number;
      fineract_account_id: number;
      account_type: string;
      account_no: string;
      status: string;
    }>(
      'SELECT id, user_id, fineract_client_id, fineract_account_id, account_type, account_no, status FROM fineract_accounts WHERE user_id = $1',
      [userId]
    );

    if (accounts.length === 0) {
      return errorResponse('Fineract account not found for user', HttpStatus.NOT_FOUND);
    }

    const account = accounts[0];

    // Get balance from Fineract
    // Note: Account must be activated first. Balance is 0 for pending accounts.
    let balance = 0;
    try {
      balance = await fineractService.getAccountBalance(account.fineract_account_id);
    } catch (error: any) {
      logger.error('Failed to get account balance from Fineract', error);
      // Continue with balance = 0 if account not yet activated
    }

    return successResponse({
      id: account.id,
      userId: account.user_id,
      fineractClientId: account.fineract_client_id,
      fineractAccountId: account.fineract_account_id,
      accountType: account.account_type,
      accountNo: account.account_no,
      status: account.status,
      balance,
    }, 'Account retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting Fineract account', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve account',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      accountType, // 'SAVINGS' | 'CURRENT'
    } = body;

    if (!userId || !accountType) {
      return errorResponse('userId and accountType are required', HttpStatus.BAD_REQUEST);
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

    // Create account in Fineract
    // Note: Savings product must exist first. The service will try to get default product.
    const account = await fineractService.createAccount(
      client.id,
      accountType as 'SAVINGS' | 'CURRENT',
      {
        externalId: `${userId}_${accountType.toLowerCase()}`,
      }
    );

    // Store account mapping
    const accountResult = await query<{ id: string }>(
      `INSERT INTO fineract_accounts (
        user_id, fineract_client_id, fineract_account_id, account_type, account_no, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, account_type) 
      DO UPDATE SET fineract_account_id = $3, updated_at = NOW()
      RETURNING id`,
      [
        userId,
        client.id,
        account.id,
        accountType,
        account.accountNo || null,
        account.status,
      ]
    );

    return createdResponse(
      {
        id: accountResult[0].id,
        userId,
        fineractClientId: client.id,
        fineractAccountId: account.id,
        accountType: account.accountType,
        accountNo: account.accountNo,
        status: account.status,
      },
      `/api/fineract/accounts?user_id=${userId}`,
      'Account created successfully in Fineract'
    );
  } catch (error: any) {
    logger.error('Error creating Fineract account', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create account',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.api, getHandler);
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
