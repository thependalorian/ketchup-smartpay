/**
 * API Route: /api/wallets/[id]
 * 
 * - GET: Fetches a specific wallet by ID.
 * - PUT: Updates wallet settings including AutoPay configuration.
 * - DELETE: Deletes a wallet.
 */
import { ExpoRequest } from 'expo-router/server';

import { query, queryOne, getUserIdFromRequest, checkUserAuthorization, findUserId } from '@/utils/db';
import { mapWalletRow, prepareWalletData } from '@/utils/db-adapters';
import { validateUUID } from '@/utils/validators';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, noContentResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

// WalletRow interface removed - using adapters instead

async function getHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate wallet ID format
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error || 'Invalid wallet ID', HttpStatus.BAD_REQUEST);
    }
    
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Check authorization
    const isAuthorized = await checkUserAuthorization(userId, 'wallet', id);
    if (!isAuthorized) {
      return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
    }

    // Fetch wallet from Neon DB
    const wallet = await queryOne<any>(
      'SELECT * FROM wallets WHERE id = $1',
      [id]
    );

    if (!wallet) {
      return errorResponse('Wallet not found', HttpStatus.NOT_FOUND);
    }

    // Map wallet using adapter
    const mapped = mapWalletRow(wallet);

    // Format response
    const formattedWallet = {
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

    return successResponse(formattedWallet);
  } catch (error) {
    log.error('Error fetching wallet:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function putHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return jsonResponse(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check authorization
    const isAuthorized = await checkUserAuthorization(userId, 'wallet', id);
    if (!isAuthorized) {
      return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
    }

    const updates = await req.json();
    
    const {
      name,
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
    } = updates;

    // Get current wallet to merge metadata
    const currentWallet = await queryOne<any>(
      'SELECT * FROM wallets WHERE id = $1',
      [id]
    );

    if (!currentWallet) {
      return errorResponse('Wallet not found', HttpStatus.NOT_FOUND);
    }

    // Merge updates into metadata
    const currentMetadata = currentWallet.metadata || {};
    const updatedMetadata = { ...currentMetadata };

    if (name !== undefined) {
      // Name is a direct column, not in metadata
    }
    if (autoPayEnabled !== undefined) updatedMetadata.auto_pay_enabled = autoPayEnabled;
    if (autoPayMaxAmount !== undefined) updatedMetadata.auto_pay_max_amount = autoPayMaxAmount;
    if (autoPaySettings !== undefined) updatedMetadata.auto_pay_settings = autoPaySettings;
    if (autoPayFrequency !== undefined) updatedMetadata.auto_pay_frequency = autoPayFrequency;
    if (autoPayDeductDate !== undefined) updatedMetadata.auto_pay_deduct_date = autoPayDeductDate;
    if (autoPayDeductTime !== undefined) updatedMetadata.auto_pay_deduct_time = autoPayDeductTime;
    if (autoPayAmount !== undefined) updatedMetadata.auto_pay_amount = autoPayAmount;
    if (autoPayRepayments !== undefined) updatedMetadata.auto_pay_repayments = autoPayRepayments;
    if (autoPayPaymentMethod !== undefined) updatedMetadata.auto_pay_payment_method = autoPayPaymentMethod;
    if (pinProtected !== undefined) updatedMetadata.pin_protected = pinProtected;
    if (biometricEnabled !== undefined) updatedMetadata.biometric_enabled = biometricEnabled;
    if (updates.icon !== undefined) updatedMetadata.icon = updates.icon;
    if (updates.purpose !== undefined) updatedMetadata.purpose = updates.purpose;
    if (updates.cardDesign !== undefined) updatedMetadata.card_design = updates.cardDesign;
    if (updates.cardNumber !== undefined) updatedMetadata.card_number = updates.cardNumber;
    if (updates.cardholderName !== undefined) updatedMetadata.cardholder_name = updates.cardholderName;
    if (updates.expiryDate !== undefined) updatedMetadata.expiry_date = updates.expiryDate;

    // Build update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }

    // Always update metadata
    updateFields.push(`metadata = $${paramIndex++}`);
    updateValues.push(JSON.stringify(updatedMetadata));

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', HttpStatus.BAD_REQUEST);
    }

    // Add wallet ID to params
    updateValues.push(id);
    const whereParam = `$${paramIndex}`;

    // Update wallet in Neon DB
    const result = await query<any>(
      `UPDATE wallets 
       SET ${updateFields.join(', ')} 
       WHERE id = ${whereParam}
       RETURNING *`,
      updateValues
    );

    if (result.length === 0) {
      return errorResponse('Wallet not found', HttpStatus.NOT_FOUND);
    }

    const wallet = result[0];
    const mapped = mapWalletRow(wallet);

    // Format response
    const updatedWallet = {
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

    return successResponse(updatedWallet, 'Wallet updated');
  } catch (error) {
    log.error('Error updating wallet:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function deleteHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate wallet ID format
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error || 'Invalid wallet ID', HttpStatus.BAD_REQUEST);
    }
    
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Check authorization
    const isAuthorized = await checkUserAuthorization(userId, 'wallet', id);
    if (!isAuthorized) {
      return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
    }

    // Delete wallet from Neon DB
    const result = await query(
      'DELETE FROM wallets WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.length === 0) {
      return errorResponse('Wallet not found', HttpStatus.NOT_FOUND);
    }

    return successResponse(null, 'Wallet deleted');
  } catch (error) {
    log.error('Error deleting wallet:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to delete wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);
