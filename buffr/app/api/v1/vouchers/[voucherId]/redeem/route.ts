/**
 * Open Banking API: /api/v1/vouchers/{voucherId}/redeem
 * 
 * Redeem voucher (Open Banking format)
 * 
 * Request Body (Open Banking format):
 * {
 *   "Data": {
 *     "ConsentId": "string",
 *     "Initiation": {
 *       "RedemptionMethod": "wallet" | "cash_out" | "bank_transfer" | "merchant_payment",
 *       "RedemptionPoint": "string" (optional),
 *       "CreditorAccount": {
 *         "SchemeName": "BuffrAccount" | "BankAccount",
 *         "Identification": "wallet-id or bank-account"
 *       },
 *       "RemittanceInformation": {
 *         "Unstructured": "Redemption description"
 *       }
 *     }
 *   },
 *   "Risk": {}
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';
import { fineractService } from '@/services/fineractService';
import { nampayService } from '@/services/nampayService';
import { twoFactorTokens } from '@/utils/redisClient';
import { randomUUID } from 'crypto';

/**
 * POST /api/v1/vouchers/{voucherId}/redeem
 * Redeem a voucher (Open Banking format)
 */
async function handleRedeemVoucher(
  req: ExpoRequest,
  { params }: { params: { voucherId: string } }
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
    const { voucherId } = params;

    // Parse Open Banking request body
    const body = await req.json();
    const { Data, verificationToken } = body;

    // PSD-12 Compliance: Require 2FA verification
    if (!verificationToken) {
      return helpers.error(
        OpenBankingErrorCode.SCA_REQUIRED,
        '2FA verification required. Please verify your PIN or biometric before redeeming.',
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.SCA_REQUIRED,
            'Strong Customer Authentication (SCA) is required for voucher redemption',
            'verificationToken'
          ),
        ]
      );
    }

    // Verify 2FA token
    const tokenData = await twoFactorTokens.verify(userId, verificationToken);
    if (!tokenData) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Invalid or expired 2FA verification token. Please verify your PIN or biometric again.',
        401
      );
    }

    if (!Data || !Data.Initiation) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Initiation is required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field Data.Initiation is missing',
            'Data.Initiation'
          ),
        ]
      );
    }

    const { Initiation } = Data;
    const { RedemptionMethod, RedemptionPoint, CreditorAccount, RemittanceInformation } = Initiation;

    // Validate required fields
    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!RedemptionMethod) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field RedemptionMethod is missing',
          'Data.Initiation.RedemptionMethod'
        )
      );
    }

    // Validate redemption method
    const validMethods = ['wallet', 'cash_out', 'bank_transfer', 'merchant_payment'];
    if (RedemptionMethod && !validMethods.includes(RedemptionMethod)) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_INVALID,
          `Invalid redemption method. Must be one of: ${validMethods.join(', ')}`,
          'Data.Initiation.RedemptionMethod'
        )
      );
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing or invalid',
        400,
        errors
      );
    }

    // Get voucher
    const voucher = await queryOne<{
      id: string;
      user_id: string;
      amount: number;
      status: string;
      expiry_date: Date | null;
      type: string;
    }>(
      'SELECT id, user_id, amount, status, expiry_date, type FROM vouchers WHERE id = $1',
      [voucherId]
    );

    if (!voucher) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Voucher with ID '${voucherId}' not found`,
        404
      );
    }

    // Verify ownership
    if (voucher.user_id !== actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'This voucher does not belong to you',
        403
      );
    }

    // Check status
    if (voucher.status !== 'available') {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID,
        `Voucher is ${voucher.status} and cannot be redeemed`,
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_INVALID,
            `Voucher status is '${voucher.status}' but must be 'available'`,
            'Data.Initiation'
          ),
        ]
      );
    }

    // Check expiry
    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      await query(
        'UPDATE vouchers SET status = $1 WHERE id = $2',
        ['expired', voucherId]
      );
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID,
        'Voucher has expired',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_INVALID,
            'The voucher has passed its expiry date',
            'Data.Initiation'
          ),
        ]
      );
    }

    // Process redemption based on method
    const redemptionId = randomUUID();
    const redemptionReference = `VCH-RED-${Date.now()}-${voucherId.substring(0, 8).toUpperCase()}`;

    try {
      // For wallet redemption (most common)
      if (RedemptionMethod === 'wallet') {
        // Get or create Fineract wallet
        let fineractWallet = await fineractService.getWalletByExternalId(userId, { userId });
        
        if (!fineractWallet) {
          const fineractClient = await fineractService.getClientByExternalId(userId, { userId });
          if (fineractClient) {
            fineractWallet = await fineractService.createWallet({
              clientId: fineractClient.id,
              externalId: userId,
              ussdEnabled: true,
            }, { userId });
          }
        }

        if (fineractWallet) {
          // Deposit to wallet
          const transactionDate = new Date().toISOString().split('T')[0];
          await fineractService.depositToWallet(
            fineractWallet.id,
            {
              amount: parseFloat(voucher.amount.toString()),
              transactionDate,
              reference: redemptionReference,
              description: RemittanceInformation?.Unstructured || 'Voucher redemption',
              channel: 'mobile_app',
            },
            { requestId: context?.requestId, userId: actualUserId }
          );
        }

        // Update voucher status
        await query(
          'UPDATE vouchers SET status = $1, redeemed_at = NOW() WHERE id = $2',
          ['redeemed', voucherId]
        );
      } else {
        // For other redemption methods, use existing redeem endpoint logic
        // This is a simplified version - full implementation would call the existing redeem service
        return helpers.error(
          OpenBankingErrorCode.PAYMENT_FAILED,
          `Redemption method '${RedemptionMethod}' is not yet fully supported in Open Banking format. Please use the legacy endpoint.`,
          501,
          [
            createErrorDetail(
              OpenBankingErrorCode.PAYMENT_FAILED,
              `The redemption method '${RedemptionMethod}' requires additional processing`,
              'Data.Initiation.RedemptionMethod'
            ),
          ]
        );
      }

      // Return Open Banking redemption response
      const redemptionResponse = {
        Data: {
          VoucherRedemptionId: redemptionId,
          VoucherId: voucherId,
          ConsentId: Data.ConsentId || redemptionId,
          Initiation: Initiation,
          CreationDateTime: new Date().toISOString(),
          Status: 'AcceptedSettlementCompleted',
          StatusUpdateDateTime: new Date().toISOString(),
          Amount: {
            Amount: parseFloat(voucher.amount.toString()),
            Currency: 'NAD',
          },
        },
        Links: {
          Self: `/api/v1/vouchers/${voucherId}/redeem/${redemptionId}`,
        },
        Meta: {},
      };

      const location = `/api/v1/vouchers/${voucherId}`;
      return helpers.created(
        redemptionResponse,
        location,
        context?.requestId
      );
    } catch (error: any) {
      log.error('Voucher redemption processing error:', error);
      return helpers.error(
        OpenBankingErrorCode.PAYMENT_FAILED,
        'Voucher redemption processing failed',
        500,
        [
          createErrorDetail(
            OpenBankingErrorCode.PAYMENT_FAILED,
            error instanceof Error ? error.message : 'An error occurred during voucher redemption',
            'Data.Initiation'
          ),
        ]
      );
    }
  } catch (error) {
    log.error('Error redeeming voucher:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the voucher redemption request',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleRedeemVoucher,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
