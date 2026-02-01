/**
 * Open Banking API: /api/v1/cards/{cardId}
 * 
 * Get, update, or delete a specific card (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/cards/{cardId}
 * Get card details
 */
async function handleGetCard(
  req: ExpoRequest,
  { params }: { params: { cardId: string } }
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

    const { cardId } = params;

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
      [cardId, actualUserId]
    );

    if (!card) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Card not found',
        404
      );
    }

    const cardResponse = {
      Data: {
        CardId: card.id,
        CardNumber: '****', // Never return actual card number
        LastFour: card.last4,
        ExpiryDate: `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`,
        ExpiryMonth: card.expiry_month,
        ExpiryYear: card.expiry_year,
        CardholderName: card.cardholderName,
        CardType: card.cardType,
        Network: card.network,
        BankName: card.bankName || null,
        IsDefault: card.isDefault,
        IsVerified: card.isVerified,
        IsActive: card.isActive,
        CreatedDateTime: card.createdAt.toISOString(),
        LastUsedDateTime: card.lastUsedAt ? card.lastUsedAt.toISOString() : null,
      },
      Links: {
        Self: `/api/v1/cards/${cardId}`,
      },
      Meta: {},
    };

    return helpers.success(
      cardResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching card:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the card',
      500
    );
  }
}

/**
 * PUT /api/v1/cards/{cardId}
 * Update card details
 */
async function handleUpdateCard(
  req: ExpoRequest,
  { params }: { params: { cardId: string } }
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

    const { cardId } = params;
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    // Verify card belongs to user
    const existingCard = await queryOne<any>(
      'SELECT id FROM user_cards WHERE id = $1 AND user_id = $2 AND is_active = true',
      [cardId, actualUserId]
    );

    if (!existingCard) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Card not found',
        404
      );
    }

    const { IsDefault, CardholderName, BankName } = Data;

    // If setting as default, unset other defaults first
    if (IsDefault) {
      await query(
        'UPDATE user_cards SET is_default = false WHERE user_id = $1',
        [actualUserId]
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (IsDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(IsDefault);
    }
    if (CardholderName !== undefined) {
      updates.push(`cardholder_name = $${paramIndex++}`);
      values.push(CardholderName);
    }
    if (BankName !== undefined) {
      updates.push(`bank_name = $${paramIndex++}`);
      values.push(BankName);
    }

    if (updates.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'No updates provided',
        400
      );
    }

    updates.push('updated_at = NOW()');
    values.push(cardId, actualUserId);

    await query(
      `UPDATE user_cards SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
      values
    );

    const cardResponse = {
      Data: {
        CardId: cardId,
        Message: 'Card updated successfully',
        UpdatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/cards/${cardId}`,
      },
      Meta: {},
    };

    return helpers.success(
      cardResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error updating card:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while updating the card',
      500
    );
  }
}

/**
 * DELETE /api/v1/cards/{cardId}
 * Deactivate a card (soft delete)
 */
async function handleDeleteCard(
  req: ExpoRequest,
  { params }: { params: { cardId: string } }
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

    const { cardId } = params;

    // Check if card exists and get its default status
    const card = await queryOne<any>(
      'SELECT id, is_default FROM user_cards WHERE id = $1 AND user_id = $2 AND is_active = true',
      [cardId, actualUserId]
    );

    if (!card) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Card not found',
        404
      );
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
        [actualUserId, cardId]
      );
    }

    return helpers.noContent(context?.requestId);
  } catch (error) {
    log.error('Error deleting card:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while deleting the card',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetCard,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const PUT = openBankingSecureRoute(
  handleUpdateCard,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const DELETE = openBankingSecureRoute(
  handleDeleteCard,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
