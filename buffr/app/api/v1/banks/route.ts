/**
 * Open Banking API: /api/v1/banks
 * 
 * Bank account management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { prepareEncryptedBankAccount } from '@/utils/encryptedFields';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

/**
 * GET /api/v1/banks
 * Get all linked banks for the authenticated user
 */
async function handleGetBanks(req: ExpoRequest) {
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

    const banks = await query<any>(
      `SELECT
        id,
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
      [actualUserId]
    );

    // Format as Open Banking
    const formattedBanks = banks.map((bank: any) => ({
      BankId: bank.id,
      AccountNumber: '****', // Never return actual account number
      LastFour: bank.last4,
      AccountHolderName: bank.accountHolderName,
      BankName: bank.bankName,
      AccountType: bank.accountType,
      SwiftCode: bank.swiftCode || null,
      BranchCode: bank.branchCode || null,
      IsDefault: bank.isDefault,
      IsVerified: bank.isVerified,
      IsActive: bank.isActive,
      CreatedDateTime: bank.createdAt.toISOString(),
      LastUsedDateTime: bank.lastUsedAt ? bank.lastUsedAt.toISOString() : null,
    }));

    // Pagination
    const { page, pageSize } = parsePaginationParams(req);
    const total = formattedBanks.length;
    const offset = (page - 1) * pageSize;
    const paginatedBanks = formattedBanks.slice(offset, offset + pageSize);

    return helpers.paginated(
      paginatedBanks,
      'Banks',
      '/api/v1/banks',
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
    log.error('Error fetching banks:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching banks',
      500
    );
  }
}

/**
 * POST /api/v1/banks
 * Link a new bank account
 */
async function handleAddBank(req: ExpoRequest) {
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

    const { AccountNumber, AccountHolderName, BankName, AccountType, SwiftCode, BranchCode } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!AccountNumber) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field AccountNumber is missing',
          'Data.AccountNumber'
        )
      );
    }

    if (!AccountHolderName) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field AccountHolderName is missing',
          'Data.AccountHolderName'
        )
      );
    }

    if (!BankName) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field BankName is missing',
          'Data.BankName'
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

    const cleanedNumber = AccountNumber.replace(/\s/g, '');
    const last4 = cleanedNumber.slice(-4);

    // Check if first bank
    const existingBanks = await query<any>(
      'SELECT COUNT(*) as count FROM user_banks WHERE user_id = $1 AND is_active = true',
      [actualUserId]
    );
    const isFirstBank = parseInt(existingBanks[0]?.count || '0') === 0;

    if (isFirstBank) {
      await query(
        'UPDATE user_banks SET is_default = false WHERE user_id = $1',
        [actualUserId]
      );
    }

    // Encrypt account number using AES-256-GCM
    const encrypted = prepareEncryptedBankAccount(cleanedNumber);

    const result = await queryOne<any>(
      `INSERT INTO user_banks (
        id, user_id, account_number_encrypted_data, account_number_iv, account_number_tag,
        last_four, account_holder_name, bank_name, account_type, swift_code, branch_code,
        is_default, is_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, true)
      RETURNING id, last_four as "last4", account_holder_name as "accountHolderName",
        bank_name as "bankName", account_type as "accountType", swift_code as "swiftCode",
        branch_code as "branchCode", is_default as "isDefault", is_verified as "isVerified",
        is_active as "isActive", created_at as "createdAt"`,
      [
        randomUUID(),
        actualUserId,
        encrypted.account_number_encrypted_data,
        encrypted.account_number_iv,
        encrypted.account_number_tag,
        last4,
        AccountHolderName,
        BankName,
        AccountType || 'checking',
        SwiftCode || null,
        BranchCode || null,
        isFirstBank,
      ]
    );

    const bankResponse = {
      Data: {
        BankId: result.id,
        AccountNumber: '****', // Never return actual account number
        LastFour: result.last4,
        AccountHolderName: result.accountHolderName,
        BankName: result.bankName,
        AccountType: result.accountType,
        SwiftCode: result.swiftCode || null,
        BranchCode: result.branchCode || null,
        IsDefault: result.isDefault,
        IsVerified: result.isVerified,
        CreatedDateTime: result.createdAt.toISOString(),
      },
      Links: {
        Self: `/api/v1/banks/${result.id}`,
      },
      Meta: {},
    };

    return helpers.created(
      bankResponse,
      `/api/v1/banks/${result.id}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error adding bank:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while adding the bank',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBanks,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleAddBank,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
