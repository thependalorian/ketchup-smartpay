/**
 * Bank Detail API
 *
 * Location: app/api/banks/[id].ts
 * Purpose: Individual bank account operations
 *
 * Endpoints:
 * - GET /api/banks/:id - Get bank details
 * - PUT /api/banks/:id - Update bank
 * - DELETE /api/banks/:id - Delete (deactivate) bank
 */

import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { query, queryOne } from '@/utils/db';
import { verifyAccessToken } from '@/utils/authServer';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, noContentResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

/**
 * GET /api/banks/:id
 */
async function getHandler(request: ExpoRequest, { params }: { params: { id: string } }): Promise<ExpoResponse> {
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
    const bankId = params.id;

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
      [bankId, userId]
    );

    if (!bank) {
      return errorResponse('Bank not found', HttpStatus.NOT_FOUND);
    }

    return successResponse({
      ...bank,
      accountNumber: '****',
      createdAt: new Date(bank.createdAt),
      lastUsedAt: bank.lastUsedAt ? new Date(bank.lastUsedAt) : undefined,
    });
  } catch (error: any) {
    log.error('Error fetching bank:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch bank',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/banks/:id
 */
async function putHandler(request: ExpoRequest, { params }: { params: { id: string } }): Promise<ExpoResponse> {
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
    const bankId = params.id;
    const body = await request.json();

    const existingBank = await queryOne<any>(
      'SELECT id FROM user_banks WHERE id = $1 AND user_id = $2 AND is_active = true',
      [bankId, userId]
    );

    if (!existingBank) {
      return errorResponse('Bank not found', HttpStatus.NOT_FOUND);
    }

    if (body.isDefault) {
      await query(
        'UPDATE user_banks SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(body.isDefault);
    }
    if (body.accountHolderName) {
      updates.push(`account_holder_name = $${paramIndex++}`);
      values.push(body.accountHolderName);
    }
    if (body.branchCode !== undefined) {
      updates.push(`branch_code = $${paramIndex++}`);
      values.push(body.branchCode);
    }

    if (updates.length === 0) {
      return errorResponse('No updates provided', HttpStatus.BAD_REQUEST);
    }

    values.push(bankId, userId);

    await query(
      `UPDATE user_banks SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
      values
    );

    return successResponse(null, 'Bank updated successfully');
  } catch (error: any) {
    log.error('Error updating bank:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update bank',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/banks/:id
 */
async function deleteHandler(request: ExpoRequest, { params }: { params: { id: string } }): Promise<ExpoResponse> {
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
    const bankId = params.id;

    const bank = await queryOne<any>(
      'SELECT id, is_default FROM user_banks WHERE id = $1 AND user_id = $2 AND is_active = true',
      [bankId, userId]
    );

    if (!bank) {
      return errorResponse('Bank not found', HttpStatus.NOT_FOUND);
    }

    await query(
      'UPDATE user_banks SET is_active = false, updated_at = NOW() WHERE id = $1',
      [bankId]
    );

    if (bank.is_default) {
      await query(
        `UPDATE user_banks SET is_default = true
         WHERE user_id = $1 AND is_active = true AND id != $2
         ORDER BY created_at ASC LIMIT 1`,
        [userId, bankId]
      );
    }

    return noContentResponse();
  } catch (error: any) {
    log.error('Error deleting bank:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to delete bank',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);
