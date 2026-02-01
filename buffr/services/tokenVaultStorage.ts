/**
 * Token Vault Storage Service
 * 
 * Location: services/tokenVaultStorage.ts
 * Purpose: Store and retrieve NAMQR parameters in Token Vault database table
 * 
 * Compliance: NAMQR v5.0, Token Vault System
 * 
 * This service stores NAMQR parameters in the database when QR codes are generated,
 * and retrieves them during validation. This is required for NAMQR v5.0 compliance.
 */

import { query } from '@/utils/db';
import { log } from '@/utils/logger';
import type { NAMQRCode } from '@/types/namqr';

export interface TokenVaultStorageInput {
  /**
   * Token Vault Unique Identifier (Tag 65)
   * If not provided, will be generated
   */
  tokenVaultId?: string;

  /**
   * Complete NAMQR data structure
   */
  namqrData: NAMQRCode;

  /**
   * Optional: Voucher ID if this is a voucher QR
   */
  voucherId?: string;

  /**
   * Optional: Merchant ID if this is a merchant QR
   */
  merchantId?: string;

  /**
   * Purpose code (e.g., "18" for government vouchers, "19" for private corporate vouchers)
   */
  purposeCode?: string;

  /**
   * Transaction amount (if applicable)
   */
  amount?: number;

  /**
   * Currency code (default: NAD)
   */
  currency?: string;

  /**
   * Is this a static QR code? (false = dynamic)
   */
  isStatic?: boolean;

  /**
   * Expiry date/time for dynamic QR codes
   */
  expiresAt?: Date;
}

export interface TokenVaultStorageResult {
  success: boolean;
  tokenVaultId?: string;
  error?: string;
}

export interface TokenVaultRetrievalResult {
  success: boolean;
  data?: {
    tokenVaultId: string;
    namqrData: NAMQRCode;
    voucherId?: string;
    merchantId?: string;
    purposeCode?: string;
    amount?: number;
    currency?: string;
    isStatic: boolean;
    expiresAt?: Date;
    storedAt: Date;
  };
  error?: string;
}

/**
 * Generate a Token Vault Unique ID
 * Format: 8-digit NREF format (NamClear standard)
 */
function generateTokenVaultId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return timestamp + random;
}

/**
 * Store NAMQR parameters in Token Vault database table
 * 
 * This is called when generating a NAMQR code to store the parameters
 * for later validation during payment processing.
 */
export async function storeTokenVaultParameters(
  input: TokenVaultStorageInput
): Promise<TokenVaultStorageResult> {
  try {
    const tokenVaultId = input.tokenVaultId || generateTokenVaultId();

    log.info('Storing Token Vault parameters', {
      tokenVaultId,
      voucherId: input.voucherId,
      merchantId: input.merchantId,
      purposeCode: input.purposeCode,
    });

    // Store in database
    await query(
      `INSERT INTO token_vault_parameters (
        token_vault_id,
        voucher_id,
        merchant_id,
        namqr_data,
        purpose_code,
        amount,
        currency,
        is_static,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (token_vault_id) DO UPDATE SET
        namqr_data = EXCLUDED.namqr_data,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()`,
      [
        tokenVaultId,
        input.voucherId || null,
        input.merchantId || null,
        JSON.stringify(input.namqrData),
        input.purposeCode || null,
        input.amount || null,
        input.currency || 'NAD',
        input.isStatic ?? false,
        input.expiresAt || null,
      ]
    );

    log.info('Token Vault parameters stored successfully', { tokenVaultId });

    return {
      success: true,
      tokenVaultId,
    };
  } catch (error: any) {
    log.error('Failed to store Token Vault parameters', error);
    return {
      success: false,
      error: error.message || 'Failed to store Token Vault parameters',
    };
  }
}

/**
 * Retrieve NAMQR parameters from Token Vault database table
 * 
 * This is called during QR code validation to retrieve stored parameters
 * and compare them with the scanned QR code.
 */
export async function retrieveTokenVaultParameters(
  tokenVaultId: string
): Promise<TokenVaultRetrievalResult> {
  try {
    log.info('Retrieving Token Vault parameters', { tokenVaultId });

    const result = await query<{
      token_vault_id: string;
      voucher_id: string | null;
      merchant_id: string | null;
      namqr_data: string; // JSONB stored as string
      purpose_code: string | null;
      amount: number | null;
      currency: string;
      is_static: boolean;
      expires_at: Date | null;
      stored_at: Date;
    }>(
      `SELECT 
        token_vault_id,
        voucher_id,
        merchant_id,
        namqr_data,
        purpose_code,
        amount,
        currency,
        is_static,
        expires_at,
        stored_at
      FROM token_vault_parameters
      WHERE token_vault_id = $1`,
      [tokenVaultId]
    );

    if (result.length === 0) {
      return {
        success: false,
        error: 'Token Vault ID not found',
      };
    }

    const row = result[0];

    // Check expiry for dynamic QR codes
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Token Vault ID has expired',
      };
    }

    // Parse JSONB data
    const namqrData = typeof row.namqr_data === 'string'
      ? JSON.parse(row.namqr_data)
      : row.namqr_data;

    log.info('Token Vault parameters retrieved successfully', { tokenVaultId });

    return {
      success: true,
      data: {
        tokenVaultId: row.token_vault_id,
        namqrData: namqrData as NAMQRCode,
        voucherId: row.voucher_id || undefined,
        merchantId: row.merchant_id || undefined,
        purposeCode: row.purpose_code || undefined,
        amount: row.amount || undefined,
        currency: row.currency,
        isStatic: row.is_static,
        expiresAt: row.expires_at || undefined,
        storedAt: row.stored_at,
      },
    };
  } catch (error: any) {
    log.error('Failed to retrieve Token Vault parameters', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve Token Vault parameters',
    };
  }
}

/**
 * Validate Token Vault ID exists and is valid
 */
export async function validateTokenVaultId(tokenVaultId: string): Promise<boolean> {
  try {
    const result = await query<{ count: number }>(
      `SELECT COUNT(*) as count
      FROM token_vault_parameters
      WHERE token_vault_id = $1
      AND (expires_at IS NULL OR expires_at > NOW())`,
      [tokenVaultId]
    );

    return result[0]?.count > 0;
  } catch (error) {
    log.error('Failed to validate Token Vault ID', error);
    return false;
  }
}
