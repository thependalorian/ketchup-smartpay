/**
 * Open Banking API: /api/v1/agents/cash-out
 * 
 * Process cash-out at agent (Open Banking format)
 * 
 * Compliance: PSD-12 (2FA required), Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';
import { logVoucherOperation, generateRequestId } from '@/utils/auditLogger';
import { randomBytes } from 'crypto';

async function handleCashOut(req: ExpoRequest) {
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

    // Parse Open Banking request body
    const body = await req.json();
    const { Data, verificationToken } = body;

    // PSD-12 Compliance: Require 2FA verification
    if (!verificationToken) {
      return helpers.error(
        OpenBankingErrorCode.SCA_REQUIRED,
        '2FA verification required. Please verify your PIN or biometric before cash-out.',
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.SCA_REQUIRED,
            'Strong Customer Authentication (SCA) is required for cash-out',
            'verificationToken'
          ),
        ]
      );
    }

    // Verify 2FA token
    const { twoFactorTokens } = await import('@/utils/redisClient');
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
    const { AgentId, Amount, WalletId } = Initiation;

    // Validate required fields
    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!AgentId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field AgentId is missing',
          'Data.Initiation.AgentId'
        )
      );
    }

    if (!Amount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Amount is missing',
          'Data.Initiation.Amount'
        )
      );
    }

    if (!WalletId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field WalletId is missing',
          'Data.Initiation.WalletId'
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

    // Validate amount
    const amount = parseFloat(Amount.toString());
    if (isNaN(amount) || amount <= 0) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        'Amount must be greater than 0',
        400
      );
    }

    // Get agent
    const agents = await query<any>(
      `SELECT id, name, location, max_daily_cashout, commission_rate, 
              liquidity_balance, status
       FROM agents
       WHERE id = $1 AND status = 'active'`,
      [AgentId]
    );

    if (agents.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Agent not found or unavailable',
        404
      );
    }

    const agent = agents[0];

    // Check agent limits
    if (agent.max_daily_cashout && amount > parseFloat(agent.max_daily_cashout.toString())) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        `Amount exceeds maximum daily cash-out limit (${agent.max_daily_cashout})`,
        400
      );
    }

    // Check agent liquidity
    if (parseFloat(agent.liquidity_balance.toString()) < amount) {
      return helpers.error(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Agent has insufficient liquidity for this cash-out',
        400
      );
    }

    // Get wallet
    const wallets = await query<any>(
      `SELECT id, balance, currency, user_id
       FROM wallets
       WHERE id = $1 AND user_id = $2`,
      [WalletId, actualUserId]
    );

    if (wallets.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Wallet not found',
        404
      );
    }

    const wallet = wallets[0];

    // Calculate commission
    const commissionRate = parseFloat(agent.commission_rate.toString());
    const commission = (amount * commissionRate) / 100;
    const totalDeduction = amount + commission;

    // Check wallet balance
    if (parseFloat(wallet.balance.toString()) < totalDeduction) {
      return helpers.error(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient funds in wallet (including commission)',
        400
      );
    }

    const requestId = generateRequestId();

    // Generate cash-out code (QR code data)
    const cashOutCode = `BUFFR_CASHOUT_${randomBytes(8).toString('hex').toUpperCase()}_${Date.now()}`;

    // Start transaction
    await query('BEGIN');

    try {
      // Deduct from wallet (amount + commission)
      await query(
        `UPDATE wallets 
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2`,
        [totalDeduction, WalletId]
      );

      // Create cash-out transaction (pending until agent confirms)
      const transactionResult = await query<{ id: string }>(
        `INSERT INTO transactions (
          user_id, wallet_id, transaction_type, amount, currency,
          description, category, status, transaction_time
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
        RETURNING id`,
        [
          actualUserId,
          WalletId,
          'transfer_out',
          totalDeduction,
          wallet.currency || 'N$',
          `Cash-out at ${agent.name}`,
          'cash_out',
        ]
      );

      const transactionId = transactionResult[0]?.id;

      // Create agent transaction record
      await query(
        `INSERT INTO agent_transactions (
          agent_id, beneficiary_id, amount, transaction_type, status, metadata
        )
        VALUES ($1, $2, $3, 'cash_out', 'pending', $4)`,
        [
          AgentId,
          actualUserId,
          amount,
          JSON.stringify({
            transactionId,
            cashOutCode,
            commission,
            walletId: WalletId,
          }),
        ]
      );

      await query('COMMIT');

      // Log operation
      await logVoucherOperation({
        operation: 'agent_cash_out',
        userId: actualUserId,
        requestId,
        metadata: {
          agentId: AgentId,
          amount,
          commission,
          cashOutCode,
          transactionId,
        },
      });

      const response = {
        Data: {
          CashOutId: transactionId,
          AgentId: AgentId,
          Amount: amount,
          Commission: commission,
          TotalDeduction: totalDeduction,
          CashOutCode: cashOutCode,
          QRCode: cashOutCode, // Same code for QR display
          Status: 'Pending',
          Instructions: `Visit ${agent.name} at ${agent.location} and show this code to receive cash. Code expires in 1 hour.`,
          ExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        },
        Links: {
          Self: '/api/v1/agents/cash-out',
        },
        Meta: {},
      };

      return helpers.created(
        response,
        undefined,
        context?.requestId
      );
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    log.error('Error processing cash-out:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      error.message || 'An error occurred while processing cash-out',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleCashOut,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
