/**
 * Cashback Service
 * 
 * Location: services/cashbackService.ts
 * Purpose: Complete cashback calculation, crediting, and management
 * 
 * Features:
 * - Calculate cashback based on merchant, category, or global rates
 * - Apply caps (per transaction, daily, monthly)
 * - Credit cashback to user balances
 * - Handle cashback redemptions
 * - Query cashback history and balances
 * 
 * Database Tables:
 * - cashback_config: Rate configuration
 * - cashback_transactions: Individual cashback events
 * - cashback_balances: User balance tracking
 * - cashback_redemptions: Redemption history
 */

import { query } from '@/utils/db';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CashbackConfig {
  id: string;
  config_type: 'merchant' | 'category' | 'global';
  merchant_id?: string;
  category_code?: string;
  cashback_percentage: number;
  cashback_cap_per_transaction?: number;
  cashback_cap_per_day?: number;
  cashback_cap_per_month?: number;
  min_transaction_amount?: number;
  max_transaction_amount?: number;
  is_active: boolean;
  valid_from: Date;
  valid_until?: Date;
}

export interface CashbackTransaction {
  id: string;
  user_id: string;
  transaction_id: string;
  merchant_id?: string;
  config_id?: string;
  transaction_amount: number;
  cashback_percentage: number;
  cashback_amount: number;
  currency: string;
  status: 'pending' | 'credited' | 'expired' | 'cancelled';
  earned_at: Date;
  credited_at?: Date;
  expires_at?: Date;
}

export interface CashbackBalance {
  user_id: string;
  total_earned: number;
  available_balance: number;
  pending_balance: number;
  redeemed_amount: number;
  expired_amount: number;
  currency: string;
  last_earned_at?: Date;
  last_redeemed_at?: Date;
  total_transactions: number;
}

export interface CashbackCalculationResult {
  eligible: boolean;
  cashback_amount: number;
  cashback_percentage: number;
  config_applied?: CashbackConfig;
  reason?: string;
}

export interface CashbackRedemption {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  redemption_type: 'wallet_credit' | 'payment_discount' | 'transfer';
  wallet_id?: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  redeemed_at: Date;
  completed_at?: Date;
}

// ============================================================================
// CORE CASHBACK CALCULATION
// ============================================================================

/**
 * Calculate cashback for a transaction
 * Hierarchy: Merchant-specific > Category-specific > Global
 */
export async function calculateCashback(params: {
  user_id: string;
  transaction_id: string;
  merchant_id?: string;
  merchant_category?: string;
  amount: number;
  currency?: string;
}): Promise<CashbackCalculationResult> {
  try {
    const { user_id, transaction_id, merchant_id, merchant_category, amount, currency = 'NAD' } = params;

    // Step 1: Find applicable cashback config (priority order)
    let config: CashbackConfig | null = null;

    // Try merchant-specific config first
    if (merchant_id) {
      const merchantConfigs = await query<CashbackConfig>(
        `SELECT * FROM cashback_config 
         WHERE config_type = 'merchant' 
           AND merchant_id = $1 
           AND is_active = TRUE
           AND valid_from <= NOW()
           AND (valid_until IS NULL OR valid_until > NOW())
         ORDER BY cashback_percentage DESC
         LIMIT 1`,
        [merchant_id]
      );
      if (merchantConfigs.length > 0) {
        config = merchantConfigs[0];
      }
    }

    // Try category-specific config
    if (!config && merchant_category) {
      const categoryConfigs = await query<CashbackConfig>(
        `SELECT * FROM cashback_config 
         WHERE config_type = 'category' 
           AND category_code = $1 
           AND is_active = TRUE
           AND valid_from <= NOW()
           AND (valid_until IS NULL OR valid_until > NOW())
         ORDER BY cashback_percentage DESC
         LIMIT 1`,
        [merchant_category]
      );
      if (categoryConfigs.length > 0) {
        config = categoryConfigs[0];
      }
    }

    // Fallback to global config
    if (!config) {
      const globalConfigs = await query<CashbackConfig>(
        `SELECT * FROM cashback_config 
         WHERE config_type = 'global' 
           AND is_active = TRUE
           AND valid_from <= NOW()
           AND (valid_until IS NULL OR valid_until > NOW())
         ORDER BY cashback_percentage DESC
         LIMIT 1`
      );
      if (globalConfigs.length > 0) {
        config = globalConfigs[0];
      }
    }

    // No config found
    if (!config) {
      return {
        eligible: false,
        cashback_amount: 0,
        cashback_percentage: 0,
        reason: 'No cashback configuration available',
      };
    }

    // Step 2: Check minimum/maximum transaction amount
    if (config.min_transaction_amount && amount < config.min_transaction_amount) {
      return {
        eligible: false,
        cashback_amount: 0,
        cashback_percentage: config.cashback_percentage,
        config_applied: config,
        reason: `Transaction amount below minimum (${config.min_transaction_amount})`,
      };
    }

    if (config.max_transaction_amount && amount > config.max_transaction_amount) {
      return {
        eligible: false,
        cashback_amount: 0,
        cashback_percentage: config.cashback_percentage,
        config_applied: config,
        reason: `Transaction amount above maximum (${config.max_transaction_amount})`,
      };
    }

    // Step 3: Calculate base cashback
    let cashback_amount = (amount * config.cashback_percentage) / 100;

    // Step 4: Apply transaction cap
    if (config.cashback_cap_per_transaction && cashback_amount > config.cashback_cap_per_transaction) {
      cashback_amount = config.cashback_cap_per_transaction;
    }

    // Step 5: Check daily cap
    if (config.cashback_cap_per_day) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const dailyTotal = await query<{ total: number }>(
        `SELECT COALESCE(SUM(cashback_amount), 0) as total
         FROM cashback_transactions
         WHERE user_id = $1
           AND earned_at >= $2
           AND status IN ('pending', 'credited')`,
        [user_id, todayStart]
      );

      const dailyEarned = Number(dailyTotal[0]?.total || 0);
      const remaining = config.cashback_cap_per_day - dailyEarned;

      if (remaining <= 0) {
        return {
          eligible: false,
          cashback_amount: 0,
          cashback_percentage: config.cashback_percentage,
          config_applied: config,
          reason: `Daily cashback limit reached (${config.cashback_cap_per_day})`,
        };
      }

      if (cashback_amount > remaining) {
        cashback_amount = remaining;
      }
    }

    // Step 6: Check monthly cap
    if (config.cashback_cap_per_month) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyTotal = await query<{ total: number }>(
        `SELECT COALESCE(SUM(cashback_amount), 0) as total
         FROM cashback_transactions
         WHERE user_id = $1
           AND earned_at >= $2
           AND status IN ('pending', 'credited')`,
        [user_id, monthStart]
      );

      const monthlyEarned = Number(monthlyTotal[0]?.total || 0);
      const remaining = config.cashback_cap_per_month - monthlyEarned;

      if (remaining <= 0) {
        return {
          eligible: false,
          cashback_amount: 0,
          cashback_percentage: config.cashback_percentage,
          config_applied: config,
          reason: `Monthly cashback limit reached (${config.cashback_cap_per_month})`,
        };
      }

      if (cashback_amount > remaining) {
        cashback_amount = remaining;
      }
    }

    // Round to 2 decimal places
    cashback_amount = Math.round(cashback_amount * 100) / 100;

    return {
      eligible: true,
      cashback_amount,
      cashback_percentage: config.cashback_percentage,
      config_applied: config,
    };
  } catch (error) {
    log.error('Error calculating cashback:', error);
    return {
      eligible: false,
      cashback_amount: 0,
      cashback_percentage: 0,
      reason: 'Error calculating cashback',
    };
  }
}

// ============================================================================
// CASHBACK TRANSACTION MANAGEMENT
// ============================================================================

/**
 * Create a cashback transaction (pending state)
 */
export async function createCashbackTransaction(params: {
  user_id: string;
  transaction_id: string;
  merchant_id?: string;
  config_id?: string;
  transaction_amount: number;
  cashback_percentage: number;
  cashback_amount: number;
  currency?: string;
  auto_credit?: boolean;
}): Promise<CashbackTransaction | null> {
  try {
    const {
      user_id,
      transaction_id,
      merchant_id,
      config_id,
      transaction_amount,
      cashback_percentage,
      cashback_amount,
      currency = 'NAD',
      auto_credit = true,
    } = params;

    const id = randomUUID();
    const status = auto_credit ? 'credited' : 'pending';
    const credited_at = auto_credit ? new Date() : null;
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 90); // 90 days expiry

    await query(
      `INSERT INTO cashback_transactions (
        id, user_id, transaction_id, merchant_id, config_id,
        transaction_amount, cashback_percentage, cashback_amount,
        currency, status, earned_at, credited_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)`,
      [
        id,
        user_id,
        transaction_id,
        merchant_id,
        config_id,
        transaction_amount,
        cashback_percentage,
        cashback_amount,
        currency,
        status,
        credited_at,
        expires_at,
      ]
    );

    const created = await query<CashbackTransaction>(
      'SELECT * FROM cashback_transactions WHERE id = $1',
      [id]
    );

    log.info(`Cashback transaction created: ${id} - ${cashback_amount} ${currency} for user ${user_id}`);

    return created[0] || null;
  } catch (error) {
    log.error('Error creating cashback transaction:', error);
    return null;
  }
}

/**
 * Credit pending cashback to user (change status to 'credited')
 */
export async function creditCashback(cashback_transaction_id: string): Promise<boolean> {
  try {
    await query(
      `UPDATE cashback_transactions
       SET status = 'credited', credited_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'pending'`,
      [cashback_transaction_id]
    );

    log.info(`Cashback credited: ${cashback_transaction_id}`);
    return true;
  } catch (error) {
    log.error('Error crediting cashback:', error);
    return false;
  }
}

// ============================================================================
// CASHBACK BALANCE QUERIES
// ============================================================================

/**
 * Get user's cashback balance
 */
export async function getCashbackBalance(user_id: string): Promise<CashbackBalance | null> {
  try {
    const balances = await query<CashbackBalance>(
      'SELECT * FROM cashback_balances WHERE user_id = $1',
      [user_id]
    );

    if (balances.length === 0) {
      // Return zero balance if user has no cashback yet
      return {
        user_id,
        total_earned: 0,
        available_balance: 0,
        pending_balance: 0,
        redeemed_amount: 0,
        expired_amount: 0,
        currency: 'NAD',
        total_transactions: 0,
      };
    }

    return balances[0];
  } catch (error) {
    log.error('Error getting cashback balance:', error);
    return null;
  }
}

/**
 * Get cashback transaction history
 */
export async function getCashbackHistory(params: {
  user_id: string;
  limit?: number;
  offset?: number;
  from_date?: Date;
  to_date?: Date;
  status?: 'pending' | 'credited' | 'expired' | 'cancelled';
}): Promise<{ transactions: CashbackTransaction[]; total: number }> {
  try {
    const { user_id, limit = 25, offset = 0, from_date, to_date, status } = params;

    let whereClause = 'WHERE user_id = $1';
    const queryParams: any[] = [user_id];
    let paramIndex = 2;

    if (from_date) {
      whereClause += ` AND earned_at >= $${paramIndex}`;
      queryParams.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      whereClause += ` AND earned_at <= $${paramIndex}`;
      queryParams.push(to_date);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Get total count
    const countResult = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM cashback_transactions ${whereClause}`,
      queryParams
    );
    const total = Number(countResult[0]?.count || 0);

    // Get transactions
    const transactions = await query<CashbackTransaction>(
      `SELECT * FROM cashback_transactions ${whereClause}
       ORDER BY earned_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    return { transactions, total };
  } catch (error) {
    log.error('Error getting cashback history:', error);
    return { transactions: [], total: 0 };
  }
}

// ============================================================================
// CASHBACK REDEMPTION
// ============================================================================

/**
 * Redeem cashback (convert to wallet credit)
 */
export async function redeemCashback(params: {
  user_id: string;
  amount: number;
  wallet_id?: string;
  redemption_type?: 'wallet_credit' | 'payment_discount' | 'transfer';
}): Promise<{ success: boolean; redemption?: CashbackRedemption; error?: string }> {
  try {
    const { user_id, amount, wallet_id, redemption_type = 'wallet_credit' } = params;

    // Check balance
    const balance = await getCashbackBalance(user_id);
    if (!balance || balance.available_balance < amount) {
      return {
        success: false,
        error: 'Insufficient cashback balance',
      };
    }

    // Create redemption record
    const redemption_id = randomUUID();
    await query(
      `INSERT INTO cashback_redemptions (
        id, user_id, amount, currency, redemption_type,
        wallet_id, status, redeemed_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW(), NOW())`,
      [redemption_id, user_id, amount, balance.currency, redemption_type, wallet_id]
    );

    // Update balance (deduct from available)
    await query(
      `UPDATE cashback_balances
       SET available_balance = available_balance - $1,
           redeemed_amount = redeemed_amount + $1,
           last_redeemed_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $2`,
      [amount, user_id]
    );

    const redemption = await query<CashbackRedemption>(
      'SELECT * FROM cashback_redemptions WHERE id = $1',
      [redemption_id]
    );

    log.info(`Cashback redeemed: ${amount} for user ${user_id}`);

    return {
      success: true,
      redemption: redemption[0],
    };
  } catch (error) {
    log.error('Error redeeming cashback:', error);
    return {
      success: false,
      error: 'Failed to redeem cashback',
    };
  }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all active cashback configurations
 */
export async function getActiveCashbackConfigs(): Promise<CashbackConfig[]> {
  try {
    const configs = await query<CashbackConfig>(
      `SELECT * FROM cashback_config
       WHERE is_active = TRUE
         AND valid_from <= NOW()
         AND (valid_until IS NULL OR valid_until > NOW())
       ORDER BY config_type, cashback_percentage DESC`
    );
    return configs;
  } catch (error) {
    log.error('Error getting active cashback configs:', error);
    return [];
  }
}

/**
 * Create or update cashback configuration
 */
export async function upsertCashbackConfig(config: Partial<CashbackConfig>): Promise<CashbackConfig | null> {
  try {
    const id = config.id || randomUUID();

    await query(
      `INSERT INTO cashback_config (
        id, config_type, merchant_id, category_code,
        cashback_percentage, cashback_cap_per_transaction,
        cashback_cap_per_day, cashback_cap_per_month,
        min_transaction_amount, max_transaction_amount,
        is_active, valid_from, valid_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        cashback_percentage = EXCLUDED.cashback_percentage,
        cashback_cap_per_transaction = EXCLUDED.cashback_cap_per_transaction,
        cashback_cap_per_day = EXCLUDED.cashback_cap_per_day,
        cashback_cap_per_month = EXCLUDED.cashback_cap_per_month,
        min_transaction_amount = EXCLUDED.min_transaction_amount,
        max_transaction_amount = EXCLUDED.max_transaction_amount,
        is_active = EXCLUDED.is_active,
        valid_until = EXCLUDED.valid_until,
        updated_at = NOW()`,
      [
        id,
        config.config_type,
        config.merchant_id,
        config.category_code,
        config.cashback_percentage,
        config.cashback_cap_per_transaction,
        config.cashback_cap_per_day,
        config.cashback_cap_per_month,
        config.min_transaction_amount,
        config.max_transaction_amount,
        config.is_active !== false,
        config.valid_from || new Date(),
        config.valid_until,
      ]
    );

    const created = await query<CashbackConfig>('SELECT * FROM cashback_config WHERE id = $1', [id]);
    return created[0] || null;
  } catch (error) {
    log.error('Error upserting cashback config:', error);
    return null;
  }
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

export const cashbackService = {
  calculateCashback,
  createCashbackTransaction,
  creditCashback,
  getCashbackBalance,
  getCashbackHistory,
  redeemCashback,
  getActiveCashbackConfigs,
  upsertCashbackConfig,
};
