/**
 * Card Detail API
 *
 * Location: app/api/cards/[id].ts
 * Purpose: Individual card operations
 *
 * Endpoints:
 * - GET /api/cards/:id - Get card details
 * - PUT /api/cards/:id - Update card
 * - DELETE /api/cards/:id - Delete (deactivate) card
 */

import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { query, queryOne } from '@/utils/db';
import { verifyAccessToken } from '@/utils/authServer';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, noContentResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

/**
 * GET /api/cards/:id
 * Get details of a specific card
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
    const cardId = params.id;

    const card = await queryOne<any>(
      `SELECT
        id,
        last_four as "last4",
        expiry_month,
        expiry_year,
        cardholder_name as "cardholderName",
        card_type as "cardType",
        network,
        bank_name as "bankName",
        is_default as "isDefault",
        is_verified as "isVerified",
        is_active as "isActive",
        created_at as "createdAt",
        last_used_at as "lastUsedAt"
      FROM user_cards
      WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [cardId, userId]
    );

    if (!card) {
      return errorResponse('Card not found', HttpStatus.NOT_FOUND);
    }

    return successResponse({
      ...card,
      cardNumber: '****',
      expiryDate: `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`,
      createdAt: new Date(card.createdAt),
      lastUsedAt: card.lastUsedAt ? new Date(card.lastUsedAt) : undefined,
    });
  } catch (error: any) {
    log.error('Error fetching card:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch card',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/cards/:id
 * Update card details (e.g., set as default)
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
    const cardId = params.id;
    const body = await request.json();

    // Verify card belongs to user
    const existingCard = await queryOne<any>(
      'SELECT id FROM user_cards WHERE id = $1 AND user_id = $2 AND is_active = true',
      [cardId, userId]
    );

    if (!existingCard) {
      return errorResponse('Card not found', HttpStatus.NOT_FOUND);
    }

    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await query(
        'UPDATE user_cards SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(body.isDefault);
    }
    if (body.cardholderName) {
      updates.push(`cardholder_name = $${paramIndex++}`);
      values.push(body.cardholderName);
    }
    if (body.bankName !== undefined) {
      updates.push(`bank_name = $${paramIndex++}`);
      values.push(body.bankName);
    }

    if (updates.length === 0) {
      return errorResponse('No updates provided', HttpStatus.BAD_REQUEST);
    }

    values.push(cardId, userId);

    await query(
      `UPDATE user_cards SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
      values
    );

    return successResponse(null, 'Card updated successfully');
  } catch (error: any) {
    log.error('Error updating card:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update card',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/cards/:id
 * Deactivate a card (soft delete)
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
    const cardId = params.id;

    // Check if card exists and get its default status
    const card = await queryOne<any>(
      'SELECT id, is_default FROM user_cards WHERE id = $1 AND user_id = $2 AND is_active = true',
      [cardId, userId]
    );

    if (!card) {
      return errorResponse('Card not found', HttpStatus.NOT_FOUND);
    }

    // Soft delete the card
    await query(
      'UPDATE user_cards SET is_active = false, updated_at = NOW() WHERE id = $1',
      [cardId]
    );

    // If deleted card was default, set first remaining card as default
    if (card.is_default) {
      await query(
        `UPDATE user_cards SET is_default = true
         WHERE user_id = $1 AND is_active = true AND id != $2
         ORDER BY created_at ASC LIMIT 1`,
        [userId, cardId]
      );
    }

    return noContentResponse();
  } catch (error: any) {
    log.error('Error deleting card:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to delete card',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);
