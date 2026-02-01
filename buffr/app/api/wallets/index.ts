/**
 * API Route: /api/wallets
 *
 * - GET: Fetches all wallets for the current user.
 * - POST: Creates a new wallet with optional AutoPay settings.
 */
import { ExpoRequest } from 'expo-router/server';

import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { mapWalletRow, prepareWalletData } from '@/utils/db-adapters';
import { validateStringLength, validateWalletType, validateCurrency } from '@/utils/validators';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

async function handleGetWallets(req: ExpoRequest) {
  try {
    // Get user ID from request (implement proper auth)
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Find actual user ID (handle UUID or external_id)
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Fetch wallets from Neon DB
    const wallets = await query<any>(
      `SELECT * FROM wallets 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [actualUserId]
    );

    // Transform database rows to API response format using adapter
    const formattedWallets = wallets.map(wallet => {
      const mapped = mapWalletRow(wallet);
      return {
        id: mapped.id,
        name: mapped.name,
        icon: mapped.icon || 'credit-card',
        type: mapped.type,
        balance: parseFloat(mapped.balance.toString()),
        currency: mapped.currency,
        purpose: mapped.purpose,
        cardDesign: mapped.card_design,
        cardNumber: mapped.card_number,
        cardholderName: mapped.cardholder_name,
        expiryDate: mapped.expiry_date,
        autoPayEnabled: mapped.auto_pay_enabled,
        autoPayMaxAmount: mapped.auto_pay_max_amount ? parseFloat(mapped.auto_pay_max_amount.toString()) : undefined,
        autoPaySettings: mapped.auto_pay_settings,
        autoPayFrequency: mapped.auto_pay_frequency,
        autoPayDeductDate: mapped.auto_pay_deduct_date,
        autoPayDeductTime: mapped.auto_pay_deduct_time,
        autoPayAmount: mapped.auto_pay_amount ? parseFloat(mapped.auto_pay_amount.toString()) : undefined,
        autoPayRepayments: mapped.auto_pay_repayments,
        autoPayPaymentMethod: mapped.auto_pay_payment_method,
        pinProtected: mapped.pin_protected,
        biometricEnabled: mapped.biometric_enabled,
        createdAt: mapped.created_at,
      };
    });

    return successResponse(formattedWallets);
  } catch (error) {
    log.error('Error fetching wallets:', error);
    return errorResponse('Failed to fetch wallets', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateWallet(req: ExpoRequest) {
  try {
    // Get user ID from request (implement proper auth)
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const walletData = await req.json();
    const {
      name,
      purpose,
      icon,
      type,
      currency,
      autoPayEnabled,
      autoPayMaxAmount,
      autoPaySettings,
      autoPayFrequency,
      autoPayDeductDate,
      autoPayDeductTime,
      autoPayAmount,
      autoPayRepayments,
      autoPayPaymentMethod,
      pinProtected,
      biometricEnabled,
    } = walletData;

    // Validate name if provided
    if (name) {
      const nameCheck = validateStringLength(name, {
        min: 1,
        max: 100,
        fieldName: 'Wallet name',
        allowEmpty: false
      });
      if (!nameCheck.valid) {
        return errorResponse(nameCheck.error || 'Invalid wallet name', HttpStatus.BAD_REQUEST);
      }
    }

    // Validate wallet type if provided
    if (type) {
      const typeCheck = validateWalletType(type);
      if (!typeCheck.valid) {
        return errorResponse(typeCheck.error || 'Invalid wallet type', HttpStatus.BAD_REQUEST);
      }
    }

    // Validate currency if provided
    if (currency) {
      const currencyCheck = validateCurrency(currency);
      if (!currencyCheck.valid) {
        return errorResponse(currencyCheck.error || 'Invalid currency', HttpStatus.BAD_REQUEST);
      }
    }

    // Find actual user ID
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Generate card details
    const cardNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryDate = (() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${month}/${year}`;
    })();

    // Prepare wallet data using adapter
    const walletDataToInsert = prepareWalletData({
      name,
      icon: icon || 'credit-card',
      type: type || 'personal',
      currency: currency || 'N$',
      purpose,
      cardDesign: 2,
      cardNumber,
      cardholderName: name || 'Cardholder',
      expiryDate,
      autoPayEnabled,
      autoPayMaxAmount,
      autoPaySettings,
      autoPayFrequency,
      autoPayDeductDate,
      autoPayDeductTime,
      autoPayAmount,
      autoPayRepayments,
      autoPayPaymentMethod,
      pinProtected,
      biometricEnabled,
    }, actualUserId);

    // Insert wallet into Neon DB
    const result = await query<any>(
      `INSERT INTO wallets (
        user_id, name, type, currency, balance, available_balance, status, is_default, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *`,
      [
        walletDataToInsert.user_id,
        walletDataToInsert.name,
        walletDataToInsert.type,
        walletDataToInsert.currency,
        walletDataToInsert.balance,
        walletDataToInsert.available_balance,
        walletDataToInsert.status,
        walletDataToInsert.is_default,
        walletDataToInsert.metadata ? JSON.stringify(walletDataToInsert.metadata) : null,
      ]
    );

    if (result.length === 0) {
      throw new Error('Failed to create wallet');
    }

    const wallet = result[0];
    const mapped = mapWalletRow(wallet);

    // Format response
    const newWallet = {
      id: mapped.id,
      name: mapped.name,
      icon: mapped.icon || 'credit-card',
      type: mapped.type,
      balance: 0,
      currency: mapped.currency,
      purpose: mapped.purpose,
      cardDesign: mapped.card_design,
      cardNumber: mapped.card_number,
      cardholderName: mapped.cardholder_name,
      expiryDate: mapped.expiry_date,
      autoPayEnabled: mapped.auto_pay_enabled,
      autoPayMaxAmount: mapped.auto_pay_max_amount ? parseFloat(mapped.auto_pay_max_amount.toString()) : undefined,
      autoPaySettings: mapped.auto_pay_settings,
      autoPayFrequency: mapped.auto_pay_frequency,
      autoPayDeductDate: mapped.auto_pay_deduct_date,
      autoPayDeductTime: mapped.auto_pay_deduct_time,
      autoPayAmount: mapped.auto_pay_amount ? parseFloat(mapped.auto_pay_amount.toString()) : undefined,
      autoPayRepayments: mapped.auto_pay_repayments,
      autoPayPaymentMethod: mapped.auto_pay_payment_method,
      pinProtected: mapped.pin_protected,
      biometricEnabled: mapped.biometric_enabled,
      createdAt: mapped.created_at,
    };

    return createdResponse(newWallet);
  } catch (error) {
    log.error('Error creating wallet:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers to all handlers
export const GET = secureAuthRoute(RATE_LIMITS.api, handleGetWallets);
export const POST = secureAuthRoute(RATE_LIMITS.api, handleCreateWallet);
