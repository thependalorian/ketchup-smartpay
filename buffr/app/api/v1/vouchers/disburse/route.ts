/**
 * Open Banking API: /api/v1/vouchers/disburse
 * 
 * Disburse vouchers (Open Banking format)
 * Supports both real-time SmartPay and admin batch modes
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, query } from '@/utils/db';
import { validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';
import { ketchupSmartPayService } from '@/services/ketchupSmartPayService';
import { generateVoucherNamQR } from '@/utils/voucherNamQR';
import { fineractService } from '@/services/fineractService';
import { sendPushNotification, sendVoucherSMS } from '@/utils/sendPushNotification';
import { randomUUID } from 'crypto';
import { isAdmin } from '@/utils/adminAuth';

async function handleDisburseVoucher(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Source, BeneficiaryId, Voucher, BatchId, Vouchers } = Data;

    // Determine mode: Real-Time SmartPay or Admin Batch
    const isSmartPayMode = Source === 'smartpay' && BeneficiaryId && Voucher;

    if (isSmartPayMode) {
      // Real-Time SmartPay Mode
      return await handleSmartPayDisbursement(req, Data, helpers, context);
    } else {
      // Admin Batch Mode - require admin auth
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return helpers.error(
          OpenBankingErrorCode.UNAUTHORIZED,
          'Authentication required',
          401
        );
      }

      const authorized = await isAdmin(userId);
      if (!authorized) {
        return helpers.error(
          OpenBankingErrorCode.FORBIDDEN,
          'Admin access required',
          403
        );
      }

      return await handleBatchDisbursement(req, Data, userId, helpers, context);
    }
  } catch (error) {
    log.error('Error disbursing vouchers:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while disbursing vouchers',
      500
    );
  }
}

async function handleSmartPayDisbursement(
  req: ExpoRequest,
  data: any,
  helpers: any,
  context: any
) {
  const { BeneficiaryId, Voucher } = data;

  // Validate beneficiary with SmartPay
  const beneficiary = await ketchupSmartPayService.getBeneficiary(BeneficiaryId);
  if (!beneficiary) {
    return helpers.error(
      OpenBankingErrorCode.RESOURCE_NOT_FOUND,
      'Beneficiary not found in SmartPay system',
      404
    );
  }

  // Create voucher
  const voucherId = randomUUID();
  const amount = parseFloat(Voucher.Amount.toString());
  const expiryDate = Voucher.ExpiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  // Generate NamQR
  const namqrCode = await generateVoucherNamQR(voucherId, {
    amount,
    purposeCode: 18, // G2P voucher
    merchantId: 'BUFFR',
  });

  // Save voucher
  await query(
    `INSERT INTO vouchers (
      id, user_id, type, title, description, amount, status,
      expiry_date, issuer, namqr_code, metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      voucherId,
      beneficiary.userId || beneficiary.phoneNumber,
      'government',
      Voucher.GrantType || 'Government Voucher',
      `Voucher from ${Voucher.Issuer || 'Ministry of Finance'}`,
      amount,
      'available',
      expiryDate,
      Voucher.Issuer || 'Ministry of Finance',
      namqrCode,
      JSON.stringify({
        grantType: Voucher.GrantType,
        batchId: Voucher.BatchId,
        verificationRequired: Voucher.VerificationRequired || false,
        smartPayBeneficiaryId: BeneficiaryId,
      }),
      new Date(),
    ]
  );

  // Send notification
  await sendPushNotification(
    beneficiary.userId || beneficiary.phoneNumber,
    'You have received a new voucher',
    `N$${amount.toFixed(2)} voucher available`,
    { type: 'voucher', voucherId }
  ).catch(err => log.error('Failed to send notification:', err));

  const response = {
    Data: {
      VoucherId: voucherId,
      BeneficiaryId,
      Amount: amount,
      Status: 'available',
      NamQRCode: namqrCode,
      ExpiryDate: expiryDate,
      CreatedDateTime: new Date().toISOString(),
    },
    Links: {
      Self: `/api/v1/vouchers/${voucherId}`,
    },
    Meta: {},
  };

  return helpers.created(
    response,
    `/api/v1/vouchers/${voucherId}`,
    context?.requestId
  );
}

async function handleBatchDisbursement(
  req: ExpoRequest,
  data: any,
  userId: string,
  helpers: any,
  context: any
) {
  const { BatchId, Vouchers } = data;

  if (!Vouchers || !Array.isArray(Vouchers) || Vouchers.length === 0) {
    return helpers.error(
      OpenBankingErrorCode.FIELD_MISSING,
      'Data.Vouchers array is required',
      400
    );
  }

  const createdVouchers = [];

  for (const voucherData of Vouchers) {
    const voucherId = randomUUID();
    const amount = parseFloat(voucherData.Amount.toString());
    const expiryDate = voucherData.ExpiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    // Generate NamQR
    const namqrCode = await generateVoucherNamQR(voucherId, {
      amount,
      purposeCode: 18,
      merchantId: 'BUFFR',
    });

    // Save voucher
    await query(
      `INSERT INTO vouchers (
        id, user_id, type, title, description, amount, status,
        expiry_date, issuer, namqr_code, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        voucherId,
        voucherData.UserId || voucherData.PhoneNumber,
        voucherData.Type || 'government',
        voucherData.Title || 'Voucher',
        voucherData.Description || null,
        amount,
        'available',
        expiryDate,
        voucherData.Issuer || 'Buffr',
        namqrCode,
        JSON.stringify({
          grantType: voucherData.GrantType,
          batchId: BatchId,
          verificationRequired: voucherData.VerificationRequired || false,
        }),
        new Date(),
      ]
    );

    createdVouchers.push({
      VoucherId: voucherId,
      UserId: voucherData.UserId,
      Amount: amount,
      Status: 'available',
      NamQRCode: namqrCode,
    });
  }

  const response = {
    Data: {
      BatchId: BatchId || randomUUID(),
      Vouchers: createdVouchers,
      TotalAmount: createdVouchers.reduce((sum, v) => sum + v.Amount, 0),
      Count: createdVouchers.length,
      CreatedDateTime: new Date().toISOString(),
    },
    Links: {
      Self: '/api/v1/vouchers/disburse',
    },
    Meta: {},
  };

  return helpers.created(
    response,
    `/api/v1/vouchers/batch/${response.Data.BatchId}`,
    context?.requestId
  );
}

export const POST = openBankingSecureRoute(
  handleDisburseVoucher,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: false, // SmartPay mode doesn't require auth
    trackResponseTime: true,
  }
);
