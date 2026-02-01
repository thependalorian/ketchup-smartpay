/**
 * Open Banking API: /api/v1/banks/{bankId}
 * 
 * Get, update, or delete a specific bank account (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/banks/{bankId}
 * Get bank details
 */
async function handleGetBank(
  req: ExpoRequest,
  { params }: { params: { bankId: string } }
) {
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

    const { bankId } = params;

    const bank = await queryOne<any>(
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
      WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [bankId, actualUserId]
    );

    if (!bank) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Bank not found',
        404
      );
    }

    const bankResponse = {
      Data: {
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
      },
      Links: {
        Self: `/api/v1/banks/${bankId}`,
      },
      Meta: {},
    };

    return helpers.success(
      bankResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching bank:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the bank',
      500
    );
  }
}

/**
 * PUT /api/v1/banks/{bankId}
 * Update bank details
 */
async function handleUpdateBank(
  req: ExpoRequest,
  { params }: { params: { bankId: string } }
) {
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

    const { bankId } = params;
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const existingBank = await queryOne<any>(
      'SELECT id FROM user_banks WHERE id = $1 AND user_id = $2 AND is_active = true',
      [bankId, actualUserId]
    );

    if (!existingBank) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Bank not found',
        404
      );
    }

    const { IsDefault, AccountHolderName, BranchCode } = Data;

    // If setting as default, unset other defaults
    if (IsDefault) {
      await query(
        'UPDATE user_banks SET is_default = false WHERE user_id = $1',
        [actualUserId]
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (IsDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(IsDefault);
    }
    if (AccountHolderName !== undefined) {
      updates.push(`account_holder_name = $${paramIndex++}`);
      values.push(AccountHolderName);
    }
    if (BranchCode !== undefined) {
      updates.push(`branch_code = $${paramIndex++}`);
      values.push(BranchCode);
    }

    if (updates.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'No updates provided',
        400
      );
    }

    updates.push('updated_at = NOW()');
    values.push(bankId, actualUserId);

    await query(
      `UPDATE user_banks SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
      values
    );

    const bankResponse = {
      Data: {
        BankId: bankId,
        Message: 'Bank updated successfully',
        UpdatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/banks/${bankId}`,
      },
      Meta: {},
    };

    return helpers.success(
      bankResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error updating bank:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while updating the bank',
      500
    );
  }
}

/**
 * DELETE /api/v1/banks/{bankId}
 * Delete (deactivate) bank account
 */
async function handleDeleteBank(
  req: ExpoRequest,
  { params }: { params: { bankId: string } }
) {
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

    const { bankId } = params;

    const bank = await queryOne<any>(
      'SELECT id, is_default FROM user_banks WHERE id = $1 AND user_id = $2 AND is_active = true',
      [bankId, actualUserId]
    );

    if (!bank) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Bank not found',
        404
      );
    }

    await query(
      'UPDATE user_banks SET is_active = false, updated_at = NOW() WHERE id = $1',
      [bankId]
    );

    // If deleted bank was default, set first remaining bank as default
    if (bank.is_default) {
      await query(
        `UPDATE user_banks SET is_default = true
         WHERE user_id = $1 AND is_active = true AND id != $2
         ORDER BY created_at ASC LIMIT 1`,
        [actualUserId, bankId]
      );
    }

    return helpers.noContent(context?.requestId);
  } catch (error) {
    log.error('Error deleting bank:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while deleting the bank',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBank,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const PUT = openBankingSecureRoute(
  handleUpdateBank,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const DELETE = openBankingSecureRoute(
  handleDeleteBank,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
