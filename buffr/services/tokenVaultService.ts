/**
 * Token Vault Service
 * 
 * Location: services/tokenVaultService.ts
 * Purpose: Interface with the NamClear/Bank of Namibia Token Vault for QR validation.
 * 
 * Compliance: NAMQR v5.0, Payment System Management Act
 */

import { log } from '@/utils/logger';

export interface TokenVaultValidationRequest {
  tokenVaultId: string;
  merchantId?: string;
  amount?: number;
  currency?: string;
}

export interface TokenVaultResponse {
  isValid: boolean;
  data?: any;
  error?: string;
}

export interface TokenVaultGenerateRequest {
  merchantId?: string | null;
  merchantName: string;
  amount?: number | null;
  currency: string;
  purposeCode: string;
  isStatic: boolean;
}

export interface TokenVaultGenerateResponse {
  success: boolean;
  tokenVaultId?: string;
  error?: string;
}

class TokenVaultService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.TOKEN_VAULT_URL || 'https://api.namclear.com.na/vault/v1';
  }

  /**
   * Validate a Token Vault ID against stored parameters
   * 
   * This now uses the database-backed Token Vault storage (token_vault_parameters table)
   * for NAMQR v5.0 compliance. All NAMQR parameters are stored in the database.
   * 
   * If external Token Vault API is available, it can be used as a secondary validation.
   */
  async validateToken(request: TokenVaultValidationRequest): Promise<TokenVaultResponse> {
    try {
      log.info('Validating with Token Vault', { tokenVaultId: request.tokenVaultId });

      // Primary: Validate against database storage (NAMQR v5.0 compliance)
      const { retrieveTokenVaultParameters } = await import('./tokenVaultStorage');
      const dbResult = await retrieveTokenVaultParameters(request.tokenVaultId);

      if (dbResult.success && dbResult.data) {
        // Validate against request parameters if provided
        if (request.merchantId && dbResult.data.merchantId !== request.merchantId) {
          return {
            isValid: false,
            error: 'Merchant ID mismatch',
          };
        }

        if (request.amount && dbResult.data.amount && Math.abs(dbResult.data.amount - request.amount) > 0.01) {
          return {
            isValid: false,
            error: 'Amount mismatch',
          };
        }

        if (request.currency && dbResult.data.currency !== request.currency) {
          return {
            isValid: false,
            error: 'Currency mismatch',
          };
        }

        log.info('Token Vault validation successful (database)', { tokenVaultId: request.tokenVaultId });
        return {
          isValid: true,
          data: dbResult.data,
        };
      }

      // Fallback: Try external API if available (optional)
      if (process.env.TOKEN_VAULT_API_KEY) {
        try {
          const response = await fetch(`${this.baseUrl}/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TOKEN_VAULT_API_KEY}`,
            },
            body: JSON.stringify(request),
          });

          if (response.ok) {
            const data = await response.json();
            log.info('Token Vault validation successful (external API)', { tokenVaultId: request.tokenVaultId });
            return {
              isValid: data.isValid || data.valid || false,
              data: data.data || data,
            };
          }
        } catch (apiError) {
          log.warn('External Token Vault API validation failed (non-critical)', { error: apiError });
        }
      }

      // If database lookup failed and no external API, return invalid
      return {
        isValid: false,
        error: dbResult.error || 'Token Vault ID not found',
      };
    } catch (error: any) {
      log.error('Token Vault validation failed', error);
      return {
        isValid: false,
        error: error.message || 'Token Vault validation error',
      };
    }
  }

  /**
   * Generate a Token Vault ID for a QR code
   * 
   * This now uses the database-backed Token Vault storage (token_vault_parameters table)
   * for NAMQR v5.0 compliance. The database stores all NAMQR parameters securely.
   * 
   * If external Token Vault API becomes available, this can be extended to also
   * register with the external service while maintaining database storage.
   */
  async generateToken(request: TokenVaultGenerateRequest): Promise<TokenVaultGenerateResponse> {
    try {
      log.info('Generating Token Vault ID', { merchantName: request.merchantName });

      // Use database-backed Token Vault storage (NAMQR v5.0 compliance)
      // All NAMQR parameters are stored in token_vault_parameters table
      const { storeTokenVaultParameters } = await import('./tokenVaultStorage');
      
      // Generate Token Vault ID (8-digit NREF format)
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const tokenVaultId = timestamp + random;

      // Build NAMQR data structure for storage
      // Note: This is a simplified structure - full NAMQR data should be passed from caller
      const namqrData = {
        payloadFormatIndicator: '01' as const,
        pointOfInitiationMethod: request.isStatic ? '11' : '12',
        merchantCategoryCode: '0000',
        countryCode: 'NA',
        payeeName: request.merchantName.substring(0, 25),
        payeeCity: 'Namibia', // Default, should be passed from caller
        tokenVaultUniqueId: tokenVaultId,
        transactionCurrency: request.currency || '516',
        ...(request.amount && { transactionAmount: request.amount }),
      };

      // Store in database (NAMQR v5.0 compliance requirement)
      const storageResult = await storeTokenVaultParameters({
        tokenVaultId,
        namqrData: namqrData as any,
        merchantId: request.merchantId || undefined,
        purposeCode: request.purposeCode,
        amount: request.amount || undefined,
        currency: request.currency || 'NAD',
        isStatic: request.isStatic,
      });

      if (!storageResult.success) {
        throw new Error(storageResult.error || 'Failed to store Token Vault parameters');
      }

      log.info('Token Vault ID generated and stored', { tokenVaultId });

      // Optional: If external Token Vault API is available, also register there
      // This maintains backward compatibility if external API becomes available
      if (process.env.TOKEN_VAULT_API_KEY) {
        try {
          const response = await fetch(`${this.baseUrl}/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TOKEN_VAULT_API_KEY}`,
            },
            body: JSON.stringify({
              tokenVaultId,
              ...request,
            }),
          });

          if (response.ok) {
            log.info('Token Vault ID also registered with external API', { tokenVaultId });
          }
        } catch (apiError) {
          // Non-critical: Database storage succeeded, external API is optional
          log.warn('External Token Vault API registration failed (non-critical)', { error: apiError });
        }
      }

      return {
        success: true,
        tokenVaultId,
      };
    } catch (error: any) {
      log.error('Token Vault generation failed', error);
      return {
        success: false,
        error: error.message || 'Failed to generate Token Vault ID',
      };
    }
  }
}

export const tokenVaultService = new TokenVaultService();