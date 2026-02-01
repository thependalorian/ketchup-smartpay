/**
 * Savings Wallet Service
 * 
 * Location: services/savingsWalletService.ts
 * Purpose: Manage interest-bearing savings wallets with savings goals
 * 
 * Features:
 * - Create savings wallets
 * - Calculate and credit interest (2-3% annual)
 * - Manage savings goals
 * - Auto-transfer rules
 * - Round-up savings
 */

import { query } from '@/utils/db';
import logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface SavingsWallet {
  id: string;
  user_id: string;
  wallet_id: string;
  name: string;
  balance: number;
  available_balance: number;
  locked_balance: number;
  interest_rate: number;
  interest_earned: number;
  lock_period_days?: number;
  lock_until_date?: Date;
  status: 'active' | 'locked' | 'closed';
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  savings_wallet_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: Date;
  status: 'active' | 'completed' | 'cancelled';
  auto_transfer_enabled: boolean;
  auto_transfer_amount?: number;
  auto_transfer_frequency?: 'on_voucher_receipt' | 'daily' | 'weekly' | 'monthly';
  round_up_enabled: boolean;
  round_up_multiple?: number;
}

export interface InterestCalculation {
  savings_wallet_id: string;
  calculation_date: Date;
  balance_at_calculation: number;
  interest_rate: number;
  interest_earned: number;
  days_in_period: number;
}

// ============================================================================
// SAVINGS WALLET SERVICE
// ============================================================================

class SavingsWalletService {
  /**
   * Create savings wallet for user
   */
  async createSavingsWallet(
    userId: string,
    options?: {
      name?: string;
      interestRate?: number;
      lockPeriodDays?: number;
    }
  ): Promise<SavingsWallet> {
    try {
      // Get user's main wallet
      const wallets = await query<{ id: string }>(
        `SELECT id FROM wallets WHERE user_id = $1 AND is_default = TRUE LIMIT 1`,
        [userId]
      );

      if (wallets.length === 0) {
        throw new Error('User has no default wallet');
      }

      const mainWalletId = wallets[0].id;

      // Create savings wallet
      const result = await query<SavingsWallet>(
        `INSERT INTO savings_wallets (
          user_id, wallet_id, name, interest_rate, lock_period_days, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          status = 'active',
          updated_at = NOW()
        RETURNING *`,
        [
          userId,
          mainWalletId,
          options?.name || 'Savings',
          options?.interestRate || 2.5, // 2.5% default
          options?.lockPeriodDays || null,
          'active',
        ]
      );

      if (result.length === 0) {
        throw new Error('Failed to create savings wallet');
      }

      logger.info(`Savings wallet created for user ${userId}: ${result[0].id}`);
      return result[0];
    } catch (error: any) {
      logger.error('Error creating savings wallet:', error);
      throw error;
    }
  }

  /**
   * Transfer funds from main wallet to savings wallet
   */
  async transferToSavings(
    userId: string,
    amount: number,
    goalId?: string
  ): Promise<void> {
    try {
      // Get savings wallet
      const savingsWallets = await query<SavingsWallet>(
        `SELECT * FROM savings_wallets WHERE user_id = $1 AND status = 'active' LIMIT 1`,
        [userId]
      );

      if (savingsWallets.length === 0) {
        throw new Error('User has no active savings wallet');
      }

      const savingsWallet = savingsWallets[0];

      // Get main wallet
      const mainWallets = await query<{ id: string; balance: number }>(
        `SELECT id, balance FROM wallets WHERE user_id = $1 AND is_default = TRUE LIMIT 1`,
        [userId]
      );

      if (mainWallets.length === 0) {
        throw new Error('User has no default wallet');
      }

      const mainWallet = mainWallets[0];

      // Check balance
      if (parseFloat(mainWallet.balance.toString()) < amount) {
        throw new Error('Insufficient balance in main wallet');
      }

      // Start transaction
      await query('BEGIN');

      try {
        // Deduct from main wallet
        await query(
          `UPDATE wallets 
           SET balance = balance - $1,
               available_balance = available_balance - $1,
               updated_at = NOW()
           WHERE id = $2`,
          [amount, mainWallet.id]
        );

        // Add to savings wallet
        await query(
          `UPDATE savings_wallets
           SET balance = balance + $1,
               available_balance = available_balance + $1,
               updated_at = NOW()
           WHERE id = $2`,
          [amount, savingsWallet.id]
        );

        // Record transaction
        await query(
          `INSERT INTO savings_transactions (
            savings_wallet_id, transaction_type, amount, balance_after, goal_id, description
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            savingsWallet.id,
            'deposit',
            amount,
            parseFloat(savingsWallet.balance.toString()) + amount,
            goalId || null,
            goalId ? 'Transfer to savings goal' : 'Transfer to savings wallet',
          ]
        );

        // Update goal if specified
        if (goalId) {
          await query(
            `UPDATE savings_goals
             SET current_amount = current_amount + $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [amount, goalId]
          );

          // Check if goal completed
          const goals = await query<{ target_amount: number; current_amount: number }>(
            `SELECT target_amount, current_amount FROM savings_goals WHERE id = $1`,
            [goalId]
          );

          if (goals.length > 0 && goals[0].current_amount >= goals[0].target_amount) {
            await query(
              `UPDATE savings_goals
               SET status = 'completed',
                   completed_at = NOW(),
                   updated_at = NOW()
               WHERE id = $1`,
              [goalId]
            );
          }
        }

        // Create main transaction record
        await query(
          `INSERT INTO transactions (
            user_id, wallet_id, type, amount, status, description
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            mainWallet.id,
            'transfer',
            -amount,
            'completed',
            'Transfer to savings wallet',
          ]
        );

        await query('COMMIT');
        logger.info(`Transferred N$${amount} to savings wallet for user ${userId}`);
      } catch (error: any) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error: any) {
      logger.error('Error transferring to savings:', error);
      throw error;
    }
  }

  /**
   * Calculate and credit interest for all savings wallets
   * Should be run daily
   */
  async calculateAndCreditInterest(): Promise<{
    walletsProcessed: number;
    totalInterestCredited: number;
  }> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get all active savings wallets
      const wallets = await query<SavingsWallet>(
        `SELECT * FROM savings_wallets 
         WHERE status = 'active'
           AND balance > 0
           AND (
             last_interest_calculation_date IS NULL
             OR last_interest_calculation_date < $1::DATE
           )`,
        [todayStr]
      );

      let walletsProcessed = 0;
      let totalInterestCredited = 0;

      for (const wallet of wallets) {
        try {
          const lastCalcDate = wallet.last_interest_calculation_date 
            ? new Date(wallet.last_interest_calculation_date)
            : new Date(wallet.created_at);
          
          const daysSinceLastCalc = Math.floor(
            (today.getTime() - lastCalcDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastCalc < 1) continue;

          // Calculate interest (simple daily interest)
          const annualRate = parseFloat(wallet.interest_rate.toString()) / 100;
          const dailyRate = annualRate / 365;
          const balance = parseFloat(wallet.balance.toString());
          const interestEarned = balance * dailyRate * daysSinceLastCalc;

          if (interestEarned < 0.01) continue; // Skip tiny amounts

          // Credit interest
          await query(
            `UPDATE savings_wallets
             SET balance = balance + $1,
                 available_balance = available_balance + $1,
                 interest_earned = interest_earned + $1,
                 last_interest_calculation_date = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [interestEarned, todayStr, wallet.id]
          );

          // Record interest transaction
          await query(
            `INSERT INTO savings_transactions (
              savings_wallet_id, transaction_type, amount, balance_after, description
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
              wallet.id,
              'interest',
              interestEarned,
              balance + interestEarned,
              `Interest earned (${daysSinceLastCalc} days)`,
            ]
          );

          // Record interest calculation
          await query(
            `INSERT INTO savings_interest_calculations (
              savings_wallet_id, calculation_date, balance_at_calculation, interest_rate,
              interest_earned, days_in_period
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (savings_wallet_id, calculation_date) DO NOTHING`,
            [
              wallet.id,
              todayStr,
              balance,
              wallet.interest_rate,
              interestEarned,
              daysSinceLastCalc,
            ]
          );

          walletsProcessed++;
          totalInterestCredited += interestEarned;
        } catch (error: any) {
          logger.error(`Error calculating interest for wallet ${wallet.id}:`, error);
        }
      }

      logger.info(
        `Interest calculation completed: ${walletsProcessed} wallets, N$${totalInterestCredited.toFixed(2)} total interest`
      );

      return {
        walletsProcessed,
        totalInterestCredited,
      };
    } catch (error: any) {
      logger.error('Error calculating interest:', error);
      throw error;
    }
  }

  /**
   * Create savings goal
   */
  async createSavingsGoal(
    userId: string,
    goalData: {
      name: string;
      targetAmount: number;
      targetDate?: Date;
      autoTransferEnabled?: boolean;
      autoTransferAmount?: number;
      autoTransferFrequency?: 'on_voucher_receipt' | 'daily' | 'weekly' | 'monthly';
      roundUpEnabled?: boolean;
      roundUpMultiple?: number;
    }
  ): Promise<SavingsGoal> {
    try {
      // Get or create savings wallet
      let savingsWallet = await this.getSavingsWallet(userId);
      if (!savingsWallet) {
        savingsWallet = await this.createSavingsWallet(userId);
      }

      const result = await query<SavingsGoal>(
        `INSERT INTO savings_goals (
          user_id, savings_wallet_id, name, target_amount, target_date,
          auto_transfer_enabled, auto_transfer_amount, auto_transfer_frequency,
          round_up_enabled, round_up_multiple, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          userId,
          savingsWallet.id,
          goalData.name,
          goalData.targetAmount,
          goalData.targetDate?.toISOString().split('T')[0] || null,
          goalData.autoTransferEnabled || false,
          goalData.autoTransferAmount || null,
          goalData.autoTransferFrequency || null,
          goalData.roundUpEnabled || false,
          goalData.roundUpMultiple || 10,
          'active',
        ]
      );

      if (result.length === 0) {
        throw new Error('Failed to create savings goal');
      }

      logger.info(`Savings goal created: ${result[0].id}`);
      return result[0];
    } catch (error: any) {
      logger.error('Error creating savings goal:', error);
      throw error;
    }
  }

  /**
   * Get savings wallet for user
   */
  async getSavingsWallet(userId: string): Promise<SavingsWallet | null> {
    const result = await query<SavingsWallet>(
      `SELECT * FROM savings_wallets WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get savings goals for user
   */
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    return await query<SavingsGoal>(
      `SELECT * FROM savings_goals 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [userId]
    );
  }

  /**
   * Process auto-transfer on voucher receipt
   */
  async processAutoTransferOnVoucherReceipt(userId: string, voucherAmount: number): Promise<void> {
    try {
      // Get active goals with auto-transfer enabled
      const goals = await query<SavingsGoal>(
        `SELECT * FROM savings_goals
         WHERE user_id = $1
           AND status = 'active'
           AND auto_transfer_enabled = TRUE
           AND auto_transfer_frequency = 'on_voucher_receipt'
           AND auto_transfer_amount IS NOT NULL`,
        [userId]
      );

      for (const goal of goals) {
        const transferAmount = parseFloat(goal.auto_transfer_amount?.toString() || '0');
        
        if (transferAmount > 0 && transferAmount <= voucherAmount) {
          await this.transferToSavings(userId, transferAmount, goal.id);
        }
      }
    } catch (error: any) {
      logger.error('Error processing auto-transfer on voucher receipt:', error);
      // Don't throw - auto-transfer failure shouldn't block voucher receipt
    }
  }

  /**
   * Process round-up savings
   */
  async processRoundUpSavings(
    userId: string,
    transactionAmount: number
  ): Promise<void> {
    try {
      // Get active goals with round-up enabled
      const goals = await query<SavingsGoal>(
        `SELECT * FROM savings_goals
         WHERE user_id = $1
           AND status = 'active'
           AND round_up_enabled = TRUE
           AND round_up_multiple IS NOT NULL`,
        [userId]
      );

      for (const goal of goals) {
        const multiple = parseFloat(goal.round_up_multiple?.toString() || '10');
        const roundedAmount = Math.ceil(transactionAmount / multiple) * multiple;
        const roundUpAmount = roundedAmount - transactionAmount;

        if (roundUpAmount > 0 && roundUpAmount <= transactionAmount) {
          await this.transferToSavings(userId, roundUpAmount, goal.id);
        }
      }
    } catch (error: any) {
      logger.error('Error processing round-up savings:', error);
      // Don't throw - round-up failure shouldn't block transaction
    }
  }

  /**
   * Aggregate daily savings analytics
   */
  async aggregateDailySavingsAnalytics(date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];

    const metrics = await query<{
      total_wallets: number;
      total_balance: number;
      avg_balance: number;
      total_interest: number;
      active_goals: number;
      completed_goals: number;
      total_deposits: number;
      total_withdrawals: number;
    }>(
      `SELECT 
        COUNT(DISTINCT sw.id)::INTEGER as total_wallets,
        COALESCE(SUM(sw.balance), 0) as total_balance,
        COALESCE(AVG(sw.balance), 0) as avg_balance,
        COALESCE(SUM(sw.interest_earned), 0) as total_interest,
        COUNT(DISTINCT sg.id) FILTER (WHERE sg.status = 'active')::INTEGER as active_goals,
        COUNT(DISTINCT sg.id) FILTER (WHERE sg.status = 'completed')::INTEGER as completed_goals,
        COALESCE(SUM(st.amount) FILTER (WHERE st.transaction_type = 'deposit'), 0) as total_deposits,
        COALESCE(ABS(SUM(st.amount)) FILTER (WHERE st.transaction_type = 'withdrawal'), 0) as total_withdrawals
      FROM savings_wallets sw
      LEFT JOIN savings_goals sg ON sg.savings_wallet_id = sw.id
      LEFT JOIN savings_transactions st ON st.savings_wallet_id = sw.id AND DATE(st.created_at) = $1
      WHERE sw.status = 'active'`,
      [dateStr]
    );

    if (metrics.length === 0) return;

    const m = metrics[0];
    const totalWallets = m.total_wallets || 0;

    // Calculate adoption rate (eligible users = users with balance >= 500)
    const eligibleUsers = await query<{ count: number }>(
      `SELECT COUNT(DISTINCT user_id)::INTEGER as count
       FROM user_behavior_analytics
       WHERE date >= $1 - INTERVAL '90 days'
         AND average_balance >= 500`,
      [dateStr]
    );

    const eligibleCount = eligibleUsers[0]?.count || 0;
    const adoptionRate = eligibleCount > 0 ? (totalWallets / eligibleCount) * 100 : 0;

    // Insert or update analytics
    await query(
      `INSERT INTO savings_analytics (
        date, total_savings_wallets, total_savings_balance, average_savings_balance,
        total_interest_earned, active_savings_goals, completed_savings_goals,
        total_deposits, total_withdrawals, adoption_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (date) DO UPDATE SET
        total_savings_wallets = EXCLUDED.total_savings_wallets,
        total_savings_balance = EXCLUDED.total_savings_balance,
        average_savings_balance = EXCLUDED.average_savings_balance,
        total_interest_earned = EXCLUDED.total_interest_earned,
        active_savings_goals = EXCLUDED.active_savings_goals,
        completed_savings_goals = EXCLUDED.completed_savings_goals,
        total_deposits = EXCLUDED.total_deposits,
        total_withdrawals = EXCLUDED.total_withdrawals,
        adoption_rate = EXCLUDED.adoption_rate,
        updated_at = NOW()`,
      [
        dateStr,
        totalWallets,
        m.total_balance || 0,
        m.avg_balance || 0,
        m.total_interest || 0,
        m.active_goals || 0,
        m.completed_goals || 0,
        m.total_deposits || 0,
        m.total_withdrawals || 0,
        adoptionRate,
      ]
    );
  }
}

export const savingsWalletService = new SavingsWalletService();
