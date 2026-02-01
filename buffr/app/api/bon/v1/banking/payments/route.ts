/**
 * Namibian Open Banking API: /bon/v1/banking/payments
 * 
 * Payment Initiation Service (PIS) - Make Payment
 * 
 * Purpose: Initiate a payment on behalf of Account Holder
 * 
 * POST /bon/v1/banking/payments
 * 
 * Headers:
 * - ParticipantId: API123456 (TPP Participant ID)
 * - x-v: 1 (API version)
 * - Authorization: Bearer {access_token}
 * 
 * Request Body:
 * {
 *   "Data": {
 *     "AccountId": "wallet-123",
 *     "Amount": "50.00",
 *     "Currency": "NAD",
 *     "BeneficiaryAccountId": "wallet-456",
 *     "BeneficiaryName": "Jane Doe",
 *     "Reference": "Payment reference",
 *     "PaymentType": "Domestic On-us"
 *   }
 * }
 * 
 * Response:
 * {
 *   "Data": {
 *     "PaymentId": "payment-123",
 *     "Status": "Accepted",
 *     "InitiationDateTime": "2026-01-26T10:00:00Z"
 *   }
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { NamibianOpenBankingErrorCode } from '@/utils/namibianOpenBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibianOpenBankingHeaders } from '@/utils/namibianOpenBanking';
import { verifyAccessToken, isConsentValid } from '@/utils/oauth2Consent';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { recordServiceLevelMetric } from '@/utils/namibianOpenBankingMiddleware';

/**
 * POST /bon/v1/banking/payments
 * Initiate payment (PIS)
 */
async function handleMakePayment(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const startTime = Date.now();
  
  try {
    // Validate Namibian Open Banking headers
    const headerValidation = validateNamibianOpenBankingHeaders(req.headers);
    if (!headerValidation.valid) {
      const responseTime = Date.now() - startTime;
      if (headerValidation.participantId) {
        await recordServiceLevelMetric('/bon/v1/banking/payments', headerValidation.participantId, false, responseTime);
      }
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_REQUEST,
        'Invalid request headers',
        400,
        headerValidation.errors.map(err => ({
          ErrorCode: NamibianOpenBankingErrorCode.FIELD_INVALID,
          Message: err,
          Path: 'Headers',
        }))
      );
    }
    
    const tppId = headerValidation.participantId!;
    
    // Verify access token
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    
    if (!accessToken) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Authorization header with Bearer token is required',
        401
      );
    }
    
    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Invalid or expired access token',
        401
      );
    }
    
    // Verify consent is valid
    const consentValid = await isConsentValid(tokenPayload.consent_id);
    if (!consentValid) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.CONSENT_INVALID,
        'Consent is invalid, expired, or revoked',
        403
      );
    }
    
    // Verify consent has required scope
    const scopes = tokenPayload.scope.split(' ').filter(Boolean);
    if (!scopes.includes('banking:payments.write')) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_SCOPE,
        'Consent does not include required scope: banking:payments.write',
        403
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { Data } = body;
    
    if (!Data) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400,
        [{
          ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
          Message: 'The field Data is missing',
          Path: 'Data',
        }]
      );
    }
    
    const {
      AccountId,
      Amount,
      Currency,
      BeneficiaryAccountId,
      BeneficiaryName,
      Reference,
      PaymentType,
    } = Data;
    
    // Validate required fields
    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];
    
    if (!AccountId) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
        Message: 'The field AccountId is missing',
        Path: 'Data.AccountId',
      });
    }
    
    if (!Amount) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
        Message: 'The field Amount is missing',
        Path: 'Data.Amount',
      });
    } else {
      const amountNum = parseFloat(Amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        errors.push({
          ErrorCode: NamibianOpenBankingErrorCode.AMOUNT_INVALID,
          Message: 'Amount must be a positive number',
          Path: 'Data.Amount',
        });
      }
    }
    
    if (!Currency) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
        Message: 'The field Currency is missing',
        Path: 'Data.Currency',
      });
    }
    
    if (!BeneficiaryAccountId) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
        Message: 'The field BeneficiaryAccountId is missing',
        Path: 'Data.BeneficiaryAccountId',
      });
    }
    
    if (errors.length > 0) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_REQUEST,
        'One or more fields are invalid',
        400,
        errors
      );
    }
    
    // Get account holder ID from token
    const accountHolderId = tokenPayload.sub;
    
    // Verify account belongs to account holder
    const wallets = await query<{ id: string; balance: number; currency: string }>(
      `SELECT id, balance, currency FROM wallets WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [AccountId, accountHolderId]
    );
    
    if (wallets.length === 0) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.ACCOUNT_NOT_FOUND,
        'Account not found or access denied',
        404
      );
    }
    
    const wallet = wallets[0];
    
    // Check sufficient funds
    const amountCents = Math.round(parseFloat(Amount) * 100);
    if (wallet.balance < amountCents) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient funds',
        400,
        [{
          ErrorCode: NamibianOpenBankingErrorCode.INSUFFICIENT_FUNDS,
          Message: `Account balance is insufficient. Available: ${(wallet.balance / 100).toFixed(2)} ${wallet.currency || 'NAD'}`,
          Path: 'Data.Amount',
        }]
      );
    }
    
    // Verify beneficiary account exists
    const beneficiaryWallets = await query<{ id: string }>(
      `SELECT id FROM wallets WHERE id = $1 AND status = 'active'`,
      [BeneficiaryAccountId]
    );
    
    if (beneficiaryWallets.length === 0) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.ACCOUNT_NOT_FOUND,
        'Beneficiary account not found',
        404,
        [{
          ErrorCode: NamibianOpenBankingErrorCode.ACCOUNT_NOT_FOUND,
          Message: 'Beneficiary account does not exist or is not active',
          Path: 'Data.BeneficiaryAccountId',
        }]
      );
    }
    
    // Create payment transaction
    const paymentId = uuidv4();
    const now = new Date();
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Deduct from payer wallet
      await query(
        `UPDATE wallets SET balance = balance - $1 WHERE id = $2`,
        [amountCents, AccountId]
      );
      
      // Add to beneficiary wallet
      await query(
        `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
        [amountCents, BeneficiaryAccountId]
      );
      
      // Create transaction records
      await query(
        `INSERT INTO transactions (id, wallet_id, amount, currency, type, status, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(),
          AccountId,
          -amountCents,
          Currency || wallet.currency,
          'payment',
          'completed',
          Reference || `Payment to ${BeneficiaryName || BeneficiaryAccountId}`,
          now,
        ]
      );
      
      await query(
        `INSERT INTO transactions (id, wallet_id, amount, currency, type, status, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(),
          BeneficiaryAccountId,
          amountCents,
          Currency || wallet.currency,
          'payment',
          'completed',
          Reference || `Payment from ${AccountId}`,
          now,
        ]
      );
      
      // Create payment record
      await query(
        `INSERT INTO payments (id, payer_account_id, beneficiary_account_id, amount, currency, 
         payment_type, status, reference, created_at, tpp_id, consent_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          paymentId,
          AccountId,
          BeneficiaryAccountId,
          amountCents,
          Currency || wallet.currency,
          PaymentType || 'Domestic On-us',
          'Accepted',
          Reference || '',
          now,
          tokenPayload.aud,
          tokenPayload.consent_id,
        ]
      );
      
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
    const responseTime = Date.now() - startTime;
    await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, true, responseTime);
    
    log.info('Payment initiated', {
      payment_id: paymentId,
      account_id: AccountId,
      beneficiary_account_id: BeneficiaryAccountId,
      amount: Amount,
      tpp_id: tokenPayload.aud,
      response_time_ms: responseTime,
    });
    
    return helpers.success(
      {
        PaymentId: paymentId,
        Status: 'Accepted',
        InitiationDateTime: now.toISOString(),
      },
      201,
      {
        Self: `/bon/v1/banking/payments/${paymentId}`,
      },
      {
        request_time_ms: responseTime,
      }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const tppId = validateNamibianOpenBankingHeaders(req.headers).participantId;
    if (tppId) {
      await recordServiceLevelMetric('/bon/v1/banking/payments', tppId, false, responseTime);
    }
    log.error('Make payment error', {
      error: error.message,
      response_time_ms: responseTime,
    });
    
    return helpers.error(
      NamibianOpenBankingErrorCode.PAYMENT_FAILED,
      error instanceof Error ? error.message : 'Payment initiation failed',
      500
    );
  }
}

export const POST = openBankingSecureRoute(handleMakePayment, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false,
  forceOpenBanking: true,
});
