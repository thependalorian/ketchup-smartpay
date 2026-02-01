/**
 * Open Banking API: /api/v1/cards
 * 
 * Payment card management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { prepareEncryptedCardNumber } from '@/utils/encryptedFields';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

/**
 * GET /api/v1/cards
 * Get all cards for the authenticated user
 */
async function handleGetCards(req: ExpoRequest) {
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

    const cards = await query<any>(
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
      WHERE user_id = $1 AND is_active = true
      ORDER BY is_default DESC, created_at DESC`,
      [actualUserId]
    );

    // Format as Open Banking
    const formattedCards = cards.map((card: any) => ({
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
    }));

    // Pagination
    const { page, pageSize } = parsePaginationParams(req);
    const total = formattedCards.length;
    const offset = (page - 1) * pageSize;
    const paginatedCards = formattedCards.slice(offset, offset + pageSize);

    return helpers.paginated(
      paginatedCards,
      'Cards',
      '/api/v1/cards',
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
    log.error('Error fetching cards:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching cards',
      500
    );
  }
}

/**
 * POST /api/v1/cards
 * Add a new card
 */
async function handleAddCard(req: ExpoRequest) {
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

    const { CardNumber, ExpiryMonth, ExpiryYear, CardholderName, CardType, BankName } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!CardNumber) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field CardNumber is missing',
          'Data.CardNumber'
        )
      );
    }

    if (!ExpiryMonth) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field ExpiryMonth is missing',
          'Data.ExpiryMonth'
        )
      );
    }

    if (!ExpiryYear) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field ExpiryYear is missing',
          'Data.ExpiryYear'
        )
      );
    }

    if (!CardholderName) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field CardholderName is missing',
          'Data.CardholderName'
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

    // Clean card number and get last 4
    const cleanedNumber = CardNumber.replace(/\s/g, '');
    const last4 = cleanedNumber.slice(-4);

    // Detect card network
    let network = 'other';
    if (cleanedNumber.startsWith('4')) network = 'visa';
    else if (cleanedNumber.startsWith('5') || cleanedNumber.startsWith('2')) network = 'mastercard';
    else if (cleanedNumber.startsWith('3')) network = 'amex';
    else if (cleanedNumber.startsWith('6')) network = 'discover';

    // Check if this is the first card (make it default)
    const existingCards = await query<any>(
      'SELECT COUNT(*) as count FROM user_cards WHERE user_id = $1 AND is_active = true',
      [actualUserId]
    );
    const isFirstCard = parseInt(existingCards[0]?.count || '0') === 0;

    // If this will be default, unset other defaults
    if (isFirstCard) {
      await query(
        'UPDATE user_cards SET is_default = false WHERE user_id = $1',
        [actualUserId]
      );
    }

    // Encrypt card number using AES-256-GCM
    const encrypted = prepareEncryptedCardNumber(cleanedNumber);

    const result = await queryOne<any>(
      `INSERT INTO user_cards (
        id, user_id, card_number_encrypted_data, card_number_iv, card_number_tag,
        last_four, expiry_month, expiry_year, cardholder_name, card_type, network,
        bank_name, is_default, is_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, true)
      RETURNING id, last_four as "last4", expiry_month, expiry_year,
        cardholder_name as "cardholderName", card_type as "cardType",
        network, bank_name as "bankName", is_default as "isDefault",
        is_verified as "isVerified", is_active as "isActive", created_at as "createdAt"`,
      [
        randomUUID(),
        actualUserId,
        encrypted.card_number_encrypted_data,
        encrypted.card_number_iv,
        encrypted.card_number_tag,
        last4,
        ExpiryMonth,
        ExpiryYear,
        CardholderName,
        CardType || 'debit',
        network,
        BankName || null,
        isFirstCard,
      ]
    );

    const cardResponse = {
      Data: {
        CardId: result.id,
        CardNumber: '****', // Never return actual card number
        LastFour: result.last4,
        ExpiryDate: `${String(ExpiryMonth).padStart(2, '0')}/${String(ExpiryYear).slice(-2)}`,
        ExpiryMonth: result.expiry_month,
        ExpiryYear: result.expiry_year,
        CardholderName: result.cardholderName,
        CardType: result.cardType,
        Network: result.network,
        BankName: result.bankName || null,
        IsDefault: result.isDefault,
        IsVerified: result.isVerified,
        CreatedDateTime: result.createdAt.toISOString(),
      },
      Links: {
        Self: `/api/v1/cards/${result.id}`,
      },
      Meta: {},
    };

    return helpers.created(
      cardResponse,
      `/api/v1/cards/${result.id}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error adding card:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while adding the card',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetCards,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleAddCard,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
