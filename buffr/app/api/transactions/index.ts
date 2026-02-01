/**
 * API Route: /api/transactions
 *
 * - GET: Fetches transactions for the current user.
 * - POST: Creates a new transaction (e.g., sending money).
 */
import { ExpoRequest } from 'expo-router/server';

import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { mapTransactionRow, prepareTransactionData } from '@/utils/db-adapters';
import {
  validateAmount,
  validateCurrency,
  validateTransactionType,
  validateUUID
} from '@/utils/validators';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

/**
 * GET /api/transactions
 * Fetches a list of transactions.
 */
async function handleGetTransactions(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Find actual user ID (handle UUID or external_id)
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');

    // Build query for existing schema
    let queryText = `SELECT * FROM transactions WHERE user_id = $1`;
    const params: any[] = [actualUserId];

    if (type) {
      // Map API type to database transaction_type
      const typeMap: Record<string, string> = {
        'sent': 'debit',
        'received': 'credit',
        'payment': 'payment',
        'transfer_in': 'deposit',
        'transfer_out': 'transfer',
      };
      const dbType = typeMap[type] || type;
      queryText += ` AND transaction_type = $2`;
      params.push(dbType);
    }

    queryText += ` ORDER BY transaction_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    // Fetch transactions from Neon DB
    const transactions = await query<any>(queryText, params);

    // Format response using adapter
    const formattedTransactions = transactions.map(tx => {
      const mapped = mapTransactionRow(tx);
      return {
        id: mapped.id,
        walletId: mapped.wallet_id,
        type: mapped.type,
        amount: parseFloat(mapped.amount.toString()),
        currency: mapped.currency,
        description: mapped.description,
        category: mapped.category,
        recipient: mapped.recipient_id ? {
          id: mapped.recipient_id,
          name: mapped.recipient_name,
        } : undefined,
        status: mapped.status,
        date: mapped.date,
        createdAt: mapped.created_at,
      };
    });

    return successResponse(formattedTransactions);
  } catch (error) {
    log.error('Error fetching transactions:', error);
    return errorResponse('Failed to fetch transactions', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * POST /api/transactions
 * Creates a new transaction.
 */
async function handleCreateTransaction(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { walletId, type, amount, currency, description, category, recipientId, recipientName } = await req.json();

    // Validate required fields
    if (!type) {
      return errorResponse('Transaction type is required', HttpStatus.BAD_REQUEST);
    }

    // Validate wallet ID format if provided
    if (walletId) {
      const walletIdCheck = validateUUID(walletId);
      if (!walletIdCheck.valid) {
        return errorResponse(walletIdCheck.error!, HttpStatus.BAD_REQUEST);
      }
    }

    // Validate recipient ID format if provided
    if (recipientId) {
      const recipientIdCheck = validateUUID(recipientId);
      if (!recipientIdCheck.valid) {
        return errorResponse(recipientIdCheck.error!, HttpStatus.BAD_REQUEST);
      }
    }

    // Validate transaction type
    const typeCheck = validateTransactionType(type);
    if (!typeCheck.valid) {
      return errorResponse(typeCheck.error!, HttpStatus.BAD_REQUEST);
    }

    // Validate amount
    const amountCheck = validateAmount(amount, {
      min: 0.01,
      max: 1000000,
      maxDecimals: 2
    });
    if (!amountCheck.valid) {
      return errorResponse(amountCheck.error!, HttpStatus.BAD_REQUEST);
    }

    // Validate currency if provided
    if (currency) {
      const currencyCheck = validateCurrency(currency);
      if (!currencyCheck.valid) {
        return errorResponse(currencyCheck.error!, HttpStatus.BAD_REQUEST);
      }
    }

    // Find actual user ID
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Validate wallet balance if sending money
    if (type === 'sent' || type === 'payment') {
      const wallet = await query<{ balance: number; user_id: string }>(
        'SELECT balance, user_id FROM wallets WHERE id = $1',
        [walletId]
      );

      if (wallet.length === 0) {
        return errorResponse('Wallet not found', HttpStatus.NOT_FOUND);
      }

      // Check if wallet belongs to user (handle UUID comparison)
      const walletUserId = wallet[0].user_id;
      if (walletUserId !== actualUserId && walletUserId !== userId) {
        return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
      }

      if (parseFloat(wallet[0].balance.toString()) < amount) {
        return errorResponse('Insufficient balance', HttpStatus.BAD_REQUEST);
      }

      // Update wallet balance
      await query(
        'UPDATE wallets SET balance = balance - $1, available_balance = available_balance - $1 WHERE id = $2',
        [amount, walletId]
      );
    }

    // Prepare transaction data using adapter
    const txData = prepareTransactionData({
      walletId,
      type,
      amount,
      currency,
      description,
      category,
      recipientId,
      recipientName,
      status: 'completed',
      date: new Date(),
    }, actualUserId);

    // Create transaction record in Neon DB (existing schema)
    const result = await query<any>(
      `INSERT INTO transactions (
        external_id, user_id, amount, currency, transaction_type, description,
        status, transaction_time, merchant_name, merchant_category, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        txData.external_id,
        txData.user_id,
        txData.amount,
        txData.currency,
        txData.transaction_type,
        description,
        txData.status,
        txData.transaction_time,
        txData.merchant_name,
        txData.merchant_category,
        txData.metadata ? JSON.stringify(txData.metadata) : null,
      ]
    );

    if (result.length === 0) {
      throw new Error('Failed to create transaction');
    }

    const tx = result[0];
    const mapped = mapTransactionRow(tx);

    const newTransaction = {
      id: mapped.id,
      walletId: mapped.wallet_id,
      type: mapped.type,
      amount: parseFloat(mapped.amount.toString()),
      currency: mapped.currency,
      description: mapped.description,
      category: mapped.category,
      recipient: mapped.recipient_id ? {
        id: mapped.recipient_id,
        name: mapped.recipient_name,
      } : undefined,
      status: mapped.status,
      date: mapped.date,
      createdAt: mapped.created_at,
    };

    return createdResponse(newTransaction);
  } catch (error) {
    log.error('Error creating transaction:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create transaction',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, handleGetTransactions);
export const POST = secureAuthRoute(RATE_LIMITS.payment, handleCreateTransaction);
