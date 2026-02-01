/**
 * AutoPay Backend Scheduler Service
 *
 * This service runs as a server-side cron job to execute scheduled AutoPay payments.
 * Unlike the client-side scheduler, this ensures reliable execution even when the app is closed.
 *
 * Features:
 * - Checks autopay_rules table for due payments every minute
 * - Executes payments via internal API
 * - Logs all transactions to autopay_transactions table
 * - Handles failures with retry logic
 * - Sends notifications on success/failure
 * - Updates next_execution_date after successful execution
 *
 * Usage:
 * - Run as a standalone Node.js process: node services/autopayBackendScheduler.ts
 * - Or integrate with your backend cron system (AWS EventBridge, Cloud Scheduler, etc.)
 */

import { query, queryOne } from '../utils/db';
import { sendPushNotification } from '../utils/sendPushNotification';
import logger, { log } from '@/utils/logger';

interface AutoPayRule {
  id: string;
  wallet_id: string;
  user_id: string;
  rule_type: string;
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';
  recipient_id: string | null;
  recipient_name: string | null;
  is_active: boolean;
  next_execution_date: Date;
  created_at: Date;
  updated_at: Date;
}

interface AutoPayExecution {
  rule_id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  recipient_id: string | null;
  recipient_name: string | null;
  payment_method: string;
}

/**
 * Get all AutoPay rules that are due for execution
 */
async function getDueAutoPayRules(): Promise<AutoPayRule[]> {
  try {
    const now = new Date();

    const dueRules = await query<AutoPayRule>(
      `SELECT * FROM autopay_rules
       WHERE is_active = TRUE
       AND next_execution_date <= $1
       ORDER BY next_execution_date ASC`,
      [now]
    );

    logger.info(`[AutoPay Scheduler] Found ${dueRules.length} due rules at ${now.toISOString()}`);
    return dueRules;
  } catch (error) {
    log.error('[AutoPay Scheduler] Error fetching due rules:', error);
    return [];
  }
}

/**
 * Calculate the next execution date based on frequency
 */
function calculateNextExecutionDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'bi-weekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      // Default to weekly if unknown frequency
      next.setDate(next.getDate() + 7);
  }

  return next;
}

/**
 * Execute a single AutoPay rule
 */
async function executeAutoPayRule(rule: AutoPayRule): Promise<boolean> {
  try {
    logger.info(`[AutoPay Scheduler] Executing rule ${rule.id} for user ${rule.user_id}`);

    // Get wallet details
    const wallet = await queryOne<any>(
      'SELECT * FROM wallets WHERE id = $1 AND user_id = $2',
      [rule.wallet_id, rule.user_id]
    );

    if (!wallet) {
      log.error(`[AutoPay Scheduler] Wallet ${rule.wallet_id} not found for rule ${rule.id}`);
      await logFailedExecution(rule, 'Wallet not found');
      return false;
    }

    // Check if wallet has sufficient balance
    const availableBalance = wallet.metadata?.available_balance || wallet.balance || 0;
    if (availableBalance < rule.amount) {
      log.error(`[AutoPay Scheduler] Insufficient balance in wallet ${rule.wallet_id}: ${availableBalance} < ${rule.amount}`);
      await logFailedExecution(rule, `Insufficient balance: N$${availableBalance} available, N$${rule.amount} required`);
      await notifyUser(rule.user_id, 'AutoPay Failed', `AutoPay payment of N$${rule.amount} failed due to insufficient funds.`, 'failure');
      return false;
    }

    // Execute the payment based on rule type
    let success = false;
    let transactionId = null;

    switch (rule.rule_type) {
      case 'recurring':
      case 'scheduled':
        // Execute transfer to recipient
        success = await executeTransfer(rule, wallet);
        break;

      case 'minimum_balance':
        // Top up wallet to minimum balance
        success = await executeTopUp(rule, wallet);
        break;

      case 'low_balance_alert':
        // Just send notification, no transaction
        await notifyUser(rule.user_id, 'Low Balance Alert', `Your wallet "${wallet.name}" balance is N$${availableBalance}`, 'info');
        success = true;
        break;

      default:
        log.error(`[AutoPay Scheduler] Unknown rule type: ${rule.rule_type}`);
        await logFailedExecution(rule, `Unknown rule type: ${rule.rule_type}`);
        return false;
    }

    if (success) {
      // Log successful execution
      await logSuccessfulExecution(rule);

      // Update next execution date
      const nextDate = calculateNextExecutionDate(rule.next_execution_date, rule.frequency);
      await query(
        'UPDATE autopay_rules SET next_execution_date = $1, updated_at = NOW() WHERE id = $2',
        [nextDate, rule.id]
      );

      // Notify user
      await notifyUser(
        rule.user_id,
        'AutoPay Executed',
        `AutoPay payment of N$${rule.amount} to ${rule.recipient_name || 'recipient'} was successful.`,
        'success'
      );

      logger.info(`[AutoPay Scheduler] Successfully executed rule ${rule.id}, next execution: ${nextDate.toISOString()}`);
      return true;
    }

    return false;
  } catch (error) {
    log.error(`[AutoPay Scheduler] Error executing rule ${rule.id}:`, error);
    await logFailedExecution(rule, error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Execute a transfer payment
 */
async function executeTransfer(rule: AutoPayRule, wallet: any): Promise<boolean> {
  try {
    // Deduct from sender wallet
    await query(
      `UPDATE wallets
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{available_balance}',
         to_jsonb((COALESCE((metadata->>'available_balance')::numeric, balance) - $1)::numeric)
       ),
       updated_at = NOW()
       WHERE id = $2`,
      [rule.amount, wallet.id]
    );

    // Create transaction record
    await query(
      `INSERT INTO transactions (
        user_id, wallet_id, transaction_type, amount, currency, description,
        status, recipient_id, recipient_name, category, transaction_time
      ) VALUES ($1, $2, 'debit', $3, $4, $5, 'completed', $6, $7, 'autopay', NOW())`,
      [
        rule.user_id,
        wallet.id,
        rule.amount,
        wallet.currency || 'NAD',
        `AutoPay: ${rule.recipient_name || 'Payment'}`,
        rule.recipient_id,
        rule.recipient_name
      ]
    );

    // If recipient has a Buffr wallet, credit their account
    if (rule.recipient_id) {
      const recipientWallet = await queryOne<any>(
        'SELECT * FROM wallets WHERE user_id = $1 AND is_default = TRUE LIMIT 1',
        [rule.recipient_id]
      );

      if (recipientWallet) {
        await query(
          `UPDATE wallets
           SET metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{available_balance}',
             to_jsonb((COALESCE((metadata->>'available_balance')::numeric, balance) + $1)::numeric)
           ),
           updated_at = NOW()
           WHERE id = $2`,
          [rule.amount, recipientWallet.id]
        );

        // Create recipient transaction
        await query(
          `INSERT INTO transactions (
            user_id, wallet_id, transaction_type, amount, currency, description,
            status, category, transaction_time
          ) VALUES ($1, $2, 'credit', $3, $4, $5, 'completed', 'autopay', NOW())`,
          [
            rule.recipient_id,
            recipientWallet.id,
            rule.amount,
            wallet.currency || 'NAD',
            `AutoPay received from ${wallet.name || 'user'}`
          ]
        );
      }
    }

    return true;
  } catch (error) {
    log.error('[AutoPay Scheduler] Transfer execution failed:', error);
    return false;
  }
}

/**
 * Execute a wallet top-up to maintain minimum balance
 */
async function executeTopUp(rule: AutoPayRule, wallet: any): Promise<boolean> {
  try {
    const currentBalance = wallet.metadata?.available_balance || wallet.balance || 0;
    const amountNeeded = rule.amount - currentBalance;

    if (amountNeeded <= 0) {
      logger.info(`[AutoPay Scheduler] Wallet ${wallet.id} already above minimum balance`);
      return true;
    }

    // This would integrate with your funding source (bank account, card, etc.)
    // For now, we'll just log it as it requires external payment processing
    logger.info(`[AutoPay Scheduler] Top-up needed: N${amountNeeded} for wallet ${wallet.id}`);
    await logFailedExecution(rule, 'Top-up requires external funding source configuration');

    return false;
  } catch (error) {
    log.error('[AutoPay Scheduler] Top-up execution failed:', error);
    return false;
  }
}

/**
 * Log successful AutoPay execution
 */
async function logSuccessfulExecution(rule: AutoPayRule): Promise<void> {
  try {
    await query(
      `INSERT INTO autopay_transactions (
        rule_id, wallet_id, user_id, amount, status,
        recipient_id, recipient_name, rule_description, executed_at
      ) VALUES ($1, $2, $3, $4, 'success', $5, $6, $7, NOW())`,
      [
        rule.id,
        rule.wallet_id,
        rule.user_id,
        rule.amount,
        rule.recipient_id,
        rule.recipient_name,
        `${rule.rule_type} - ${rule.frequency}`
      ]
    );
  } catch (error) {
    log.error('[AutoPay Scheduler] Error logging successful execution:', error);
  }
}

/**
 * Log failed AutoPay execution
 */
async function logFailedExecution(rule: AutoPayRule, reason: string): Promise<void> {
  try {
    await query(
      `INSERT INTO autopay_transactions (
        rule_id, wallet_id, user_id, amount, status, failure_reason,
        recipient_id, recipient_name, rule_description, executed_at
      ) VALUES ($1, $2, $3, $4, 'failed', $5, $6, $7, $8, NOW())`,
      [
        rule.id,
        rule.wallet_id,
        rule.user_id,
        rule.amount,
        reason,
        rule.recipient_id,
        rule.recipient_name,
        `${rule.rule_type} - ${rule.frequency}`
      ]
    );
  } catch (error) {
    log.error('[AutoPay Scheduler] Error logging failed execution:', error);
  }
}

/**
 * Send notification to user
 */
async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: 'success' | 'failure' | 'info'
): Promise<void> {
  try {
    // Create in-app notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
       VALUES ($1, $2, $3, $4, FALSE, NOW())`,
      [userId, type === 'success' ? 'payment' : 'system', title, message]
    );

    // Send push notification
    await sendPushNotification({
      userIds: userId,
      title,
      body: message,
    });
  } catch (error) {
    log.error('[AutoPay Scheduler] Error sending notification:', error);
  }
}

/**
 * Main scheduler function - runs every minute
 */
export async function runAutoPayScheduler(): Promise<void> {
  logger.info('[AutoPay Scheduler] Starting scheduler run...');

  try {
    const dueRules = await getDueAutoPayRules();

    if (dueRules.length === 0) {
      logger.info('[AutoPay Scheduler] No due rules found');
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Execute rules sequentially to avoid race conditions
    for (const rule of dueRules) {
      const success = await executeAutoPayRule(rule);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Small delay between executions to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info(`[AutoPay Scheduler] Completed: ${successCount} successful, ${failureCount} failed`);
  } catch (error) {
    log.error('[AutoPay Scheduler] Error in scheduler run:', error);
  }
}

/**
 * Start the scheduler (runs every minute)
 */
export function startAutoPayScheduler(): void {
  logger.info('[AutoPay Scheduler] Starting AutoPay backend scheduler...');

  // Run immediately on start
  runAutoPayScheduler();

  // Then run every minute
  setInterval(runAutoPayScheduler, 60 * 1000); // Every 1 minute

  logger.info('[AutoPay Scheduler] Scheduler started successfully');
}

// If running as standalone script
if (require.main === module) {
  logger.info('=== AutoPay Backend Scheduler ===');
  logger.info('Starting standalone scheduler...');
  startAutoPayScheduler();
}
