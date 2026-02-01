/**
 * Cards API
 *
 * Location: app/api/cards/index.ts
 * Purpose: CRUD operations for user payment cards
 *
 * Endpoints:
 * - GET /api/cards - Get all cards for authenticated user
 * - POST /api/cards - Add a new card
 */

import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { query, queryOne } from '@/utils/db';
import { verifyAccessToken } from '@/utils/authServer';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';
import { prepareEncryptedCardNumber } from '@/utils/encryptedFields';

/**
 * GET /api/cards
 * Get all cards for the authenticated user
 */
async function handleGetCards(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    // Verify authentication
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

    // Fetch cards from database
    const cards = await query<any>(
      `SELECT
        id,
        user_id,
        card_number_encrypted as "cardNumber",
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
      [userId]
    );

    // Transform dates and format expiry
    const formattedCards = cards.map((card: any) => ({
      ...card,
      expiryDate: `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`,
      cardNumber: '****', // Never return actual card number
      createdAt: new Date(card.createdAt),
      lastUsedAt: card.lastUsedAt ? new Date(card.lastUsedAt) : undefined,
    }));

    return successResponse(formattedCards);
  } catch (error: any) {
    log.error('Error fetching cards:', error);
    return errorResponse('Failed to fetch cards', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * POST /api/cards
 * Add a new card for the authenticated user
 */
async function handleAddCard(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    // Verify authentication
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
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv, // Not stored - only used for verification
      cardholderName,
      cardType = 'debit',
      bankName,
    } = body;

    // Validate required fields
    if (!cardNumber || !expiryMonth || !expiryYear || !cardholderName) {
      return errorResponse('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    // Clean card number and get last 4
    const cleanedNumber = cardNumber.replace(/\s/g, '');
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
      [userId]
    );
    const isFirstCard = parseInt(existingCards[0]?.count || '0') === 0;

    // If this will be default, unset other defaults
    if (isFirstCard) {
      await query(
        'UPDATE user_cards SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    // Encrypt card number using AES-256-GCM
    const encrypted = prepareEncryptedCardNumber(cleanedNumber);

    const result = await queryOne<any>(
      `INSERT INTO user_cards (
        user_id, card_number_encrypted_data, card_number_iv, card_number_tag,
        last_four, expiry_month, expiry_year, cardholder_name, card_type, network,
        bank_name, is_default, is_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, true)
      RETURNING id, last_four as "last4", expiry_month, expiry_year,
        cardholder_name as "cardholderName", card_type as "cardType",
        network, bank_name as "bankName", is_default as "isDefault",
        is_verified as "isVerified", is_active as "isActive", created_at as "createdAt"`,
      [
        userId,
        encrypted.card_number_encrypted_data,
        encrypted.card_number_iv,
        encrypted.card_number_tag,
        last4,
        expiryMonth,
        expiryYear,
        cardholderName,
        cardType,
        network,
        bankName || null,
        isFirstCard,
      ]
    );

    return successResponse({
      ...result,
      cardNumber: '****',
      expiryDate: `${String(expiryMonth).padStart(2, '0')}/${String(expiryYear).slice(-2)}`,
      createdAt: new Date(result.createdAt),
    });
  } catch (error: any) {
    log.error('Error adding card:', error);
    return errorResponse('Failed to add card', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, handleGetCards);
export const POST = secureAuthRoute(RATE_LIMITS.api, handleAddCard);
