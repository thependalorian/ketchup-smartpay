/**
 * Banks API
 *
 * Location: app/api/banks/index.ts
 * Purpose: CRUD operations for user linked bank accounts
 *
 * Endpoints:
 * - GET /api/banks - Get all banks for authenticated user
 * - POST /api/banks - Link a new bank account
 */

import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { query, queryOne } from '@/utils/db';
import { verifyAccessToken } from '@/utils/authServer';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';
import { prepareEncryptedBankAccount } from '@/utils/encryptedFields';

/**
 * GET /api/banks
 * Get all linked banks for the authenticated user
 */
async function handleGetBanks(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return errorResponse('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    const userId = payload.sub;

    const banks = await query<any>(
      `SELECT
        id,
        account_number_encrypted as "accountNumber",
        last_four as "last4",
        account_holder_name as "accountHolderName",
        bank_name as "bankName",
        account_type as "accountType",
        swift_code as "swiftCode",
        branch_code as "branchCode",
        is_default as "isDefault",
        is_verified as "isVerified",
        is_active as "isActive",
        created_at as "createdAt",
        last_used_at as "lastUsedAt"
      FROM user_banks
      WHERE user_id = $1 AND is_active = true
      ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    const formattedBanks = banks.map((bank: any) => ({
      ...bank,
      accountNumber: '****', // Never return actual account number
      createdAt: new Date(bank.createdAt),
      lastUsedAt: bank.lastUsedAt ? new Date(bank.lastUsedAt) : undefined,
    }));

    return successResponse(formattedBanks);
  } catch (error: any) {
    log.error('Error fetching banks:', error);
    return errorResponse('Failed to fetch banks', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * POST /api/banks
 * Link a new bank account
 */
async function handleAddBank(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return errorResponse('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    const userId = payload.sub;
    const body = await request.json();

    const {
      accountNumber,
      accountHolderName,
      bankName,
      accountType = 'checking',
      swiftCode,
      branchCode,
    } = body;

    if (!accountNumber || !accountHolderName || !bankName) {
      return errorResponse('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    const cleanedNumber = accountNumber.replace(/\s/g, '');
    const last4 = cleanedNumber.slice(-4);

    // Check if first bank
    const existingBanks = await query<any>(
      'SELECT COUNT(*) as count FROM user_banks WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const isFirstBank = parseInt(existingBanks[0]?.count || '0') === 0;

    if (isFirstBank) {
      await query(
        'UPDATE user_banks SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    // Encrypt account number using AES-256-GCM
    const encrypted = prepareEncryptedBankAccount(cleanedNumber);

    const result = await queryOne<any>(
      `INSERT INTO user_banks (
        user_id, account_number_encrypted_data, account_number_iv, account_number_tag,
        last_four, account_holder_name, bank_name, account_type, swift_code, branch_code,
        is_default, is_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, true)
      RETURNING id, last_four as "last4", account_holder_name as "accountHolderName",
        bank_name as "bankName", account_type as "accountType", swift_code as "swiftCode",
        branch_code as "branchCode", is_default as "isDefault", is_verified as "isVerified",
        is_active as "isActive", created_at as "createdAt"`,
      [
        userId,
        encrypted.account_number_encrypted_data,
        encrypted.account_number_iv,
        encrypted.account_number_tag,
        last4,
        accountHolderName,
        bankName,
        accountType,
        swiftCode || null,
        branchCode || null,
        isFirstBank,
      ]
    );

    return successResponse({
      ...result,
      accountNumber: '****',
      createdAt: new Date(result.createdAt),
    });
  } catch (error: any) {
    log.error('Error adding bank:', error);
    return errorResponse('Failed to add bank', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, handleGetBanks);
export const POST = secureAuthRoute(RATE_LIMITS.api, handleAddBank);
