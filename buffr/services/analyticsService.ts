/**
 * Analytics Service
 * 
 * Location: services/analyticsService.ts
 * Purpose: Aggregate transaction data for analytics and product development insights
 * 
 * Priority: 11 (Product Development)
 * Deadline: Q2 2026
 * 
 * This service:
 * - Aggregates transaction data into analytics tables
 * - Calculates metrics for product development
 * - Generates insights and recommendations
 * - Supports daily, weekly, and monthly aggregation
 */

import { query } from '@/utils/db';
import logger, { log } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface TransactionAnalyticsInput {
  date: Date;
  transactionType: string;
  paymentMethod?: string;
  merchantCategory?: string;
  hourOfDay?: number;
  dayOfWeek?: number;
}

export interface UserBehaviorAnalyticsInput {
  userId: string;
  date: Date;
  walletBalance: number;
  averageBalance: number;
  transactionCount: number;
  totalSpent: number;
  totalReceived: number;
  preferredPaymentMethod?: string;
  cashOutCount: number;
  cashOutAmount: number;
  merchantPaymentCount: number;
  merchantPaymentAmount: number;
  p2pTransferCount: number;
  p2pTransferAmount: number;
  billPaymentCount: number;
  billPaymentAmount: number;
  spendingVelocity?: number;
}

export interface MerchantAnalyticsInput {
  merchantId?: string;
  merchantName?: string;
  date: Date;
  transactionCount: number;
  totalVolume: number;
  averageTransactionAmount: number;
  uniqueCustomers: number;
  paymentMethodBreakdown: Record<string, number>;
  peakHours: Record<string, number>;
}

export interface GeographicAnalyticsInput {
  region?: string;
  date: Date;
  transactionCount: number;
  totalVolume: number;
  uniqueUsers: number;
  cashOutRatio?: number;
  digitalPaymentRatio?: number;
}

export interface PaymentMethodAnalyticsInput {
  paymentMethod: string;
  date: Date;
  transactionCount: number;
  totalVolume: number;
  averageTransactionAmount: number;
  uniqueUsers: number;
  successRate?: number;
  averageProcessingTimeMs?: number;
}

export interface ChannelAnalyticsInput {
  channel: 'mobile_app' | 'ussd';
  date: Date;
  transactionCount: number;
  totalVolume: number;
  uniqueUsers: number;
  averageTransactionAmount: number;
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class AnalyticsService {
  /**
   * Aggregate daily transaction analytics
   * Runs at 00:00 daily
   */
  async aggregateDailyTransactions(targetDate: Date = new Date()): Promise<void> {
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get all transactions for the day
      const transactions = await query<{
        id: string;
        type: string;
        amount: number;
        currency: string;
        payment_method: string;
        user_id: string;
        recipient_id: string | null;
        status: string;
        created_at: Date;
        metadata: any;
      }>(
        `SELECT 
          id, type, amount, currency, payment_method, user_id, recipient_id, 
          status, created_at, metadata
        FROM transactions
        WHERE created_at >= $1 AND created_at <= $2
        AND status = 'completed'`,
        [startOfDay.toISOString(), endOfDay.toISOString()]
      );

      // Group by transaction type, payment method, merchant category
      const groups = new Map<string, {
        transactionType: string;
        paymentMethod?: string;
        merchantCategory?: string;
        amounts: number[];
        userIds: Set<string>;
        merchantIds: Set<string>;
      }>();

      for (const tx of transactions) {
        const merchantCategory = tx.metadata?.merchantCategory || null;
        const key = `${tx.type}|${tx.payment_method || 'unknown'}|${merchantCategory || 'none'}`;

        if (!groups.has(key)) {
          groups.set(key, {
            transactionType: tx.type,
            paymentMethod: tx.payment_method || undefined,
            merchantCategory: merchantCategory || undefined,
            amounts: [],
            userIds: new Set(),
            merchantIds: new Set(),
          });
        }

        const group = groups.get(key)!;
        group.amounts.push(parseFloat(tx.amount.toString()));
        group.userIds.add(tx.user_id);
        if (tx.recipient_id && tx.type === 'merchant_payment') {
          group.merchantIds.add(tx.recipient_id);
        }
      }

      // Calculate statistics and upsert
      for (const [key, group] of groups.entries()) {
        const amounts = group.amounts.sort((a, b) => a - b);
        const totalVolume = amounts.reduce((sum, a) => sum + a, 0);
        const avgAmount = amounts.length > 0 ? totalVolume / amounts.length : 0;
        const medianAmount = amounts.length > 0
          ? amounts[Math.floor(amounts.length / 2)]
          : 0;
        const minAmount = amounts.length > 0 ? amounts[0] : 0;
        const maxAmount = amounts.length > 0 ? amounts[amounts.length - 1] : 0;

        await query(
          `INSERT INTO transaction_analytics (
            date, transaction_type, payment_method, merchant_category,
            total_transactions, total_volume, average_transaction_amount,
            median_transaction_amount, min_transaction_amount, max_transaction_amount,
            unique_users, unique_merchants, hour_of_day, day_of_week
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (date, transaction_type, payment_method, merchant_category, hour_of_day)
          DO UPDATE SET
            total_transactions = EXCLUDED.total_transactions,
            total_volume = EXCLUDED.total_volume,
            average_transaction_amount = EXCLUDED.average_transaction_amount,
            median_transaction_amount = EXCLUDED.median_transaction_amount,
            min_transaction_amount = EXCLUDED.min_transaction_amount,
            max_transaction_amount = EXCLUDED.max_transaction_amount,
            unique_users = EXCLUDED.unique_users,
            unique_merchants = EXCLUDED.unique_merchants,
            updated_at = NOW()`,
          [
            dateStr,
            group.transactionType,
            group.paymentMethod || null,
            group.merchantCategory || null,
            amounts.length,
            totalVolume,
            avgAmount,
            medianAmount,
            minAmount,
            maxAmount,
            group.userIds.size,
            group.merchantIds.size > 0 ? group.merchantIds.size : null,
            null, // hour_of_day (for daily aggregates)
            targetDate.getDay(), // day_of_week
          ]
        );
      }

      logger.info(`[Analytics] Daily transaction analytics aggregated for ${dateStr}`);
    } catch (error) {
      log.error('[Analytics] Error aggregating daily transactions:', error);
      throw error;
    }
  }

  /**
   * Aggregate daily user behavior analytics
   */
  async aggregateDailyUserBehavior(targetDate: Date = new Date()): Promise<void> {
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get all users who had transactions on this day
      const userTransactions = await query<{
        user_id: string;
        type: string;
        amount: number;
        payment_method: string;
        created_at: Date;
      }>(
        `SELECT user_id, type, amount, payment_method, created_at
        FROM transactions
        WHERE created_at >= $1 AND created_at <= $2
        AND status = 'completed'`,
        [startOfDay.toISOString(), endOfDay.toISOString()]
      );

      // Get wallet balances for users
      const userBalances = await query<{
        user_id: string;
        balance: number;
      }>(
        `SELECT DISTINCT w.user_id, w.balance
        FROM wallets w
        INNER JOIN transactions t ON t.from_wallet_id = w.id OR t.to_wallet_id = w.id
        WHERE t.created_at >= $1 AND t.created_at <= $2`,
        [startOfDay.toISOString(), endOfDay.toISOString()]
      );

      const balanceMap = new Map<string, number>();
      for (const ub of userBalances) {
        balanceMap.set(ub.user_id, parseFloat(ub.balance.toString()));
      }

      // Group by user
      const userGroups = new Map<string, {
        userId: string;
        transactions: typeof userTransactions;
        totalSpent: number;
        totalReceived: number;
        paymentMethods: Map<string, number>;
        cashOutCount: number;
        cashOutAmount: number;
        merchantPaymentCount: number;
        merchantPaymentAmount: number;
        p2pTransferCount: number;
        p2pTransferAmount: number;
        billPaymentCount: number;
        billPaymentAmount: number;
      }>();

      for (const tx of userTransactions) {
        if (!userGroups.has(tx.user_id)) {
          userGroups.set(tx.user_id, {
            userId: tx.user_id,
            transactions: [],
            totalSpent: 0,
            totalReceived: 0,
            paymentMethods: new Map(),
            cashOutCount: 0,
            cashOutAmount: 0,
            merchantPaymentCount: 0,
            merchantPaymentAmount: 0,
            p2pTransferCount: 0,
            p2pTransferAmount: 0,
            billPaymentCount: 0,
            billPaymentAmount: 0,
          });
        }

        const group = userGroups.get(tx.user_id)!;
        group.transactions.push(tx);

        const amount = parseFloat(tx.amount.toString());

        // Determine if spent or received (simplified - in production, check from_wallet_id/to_wallet_id)
        if (tx.type === 'cash_out' || tx.type === 'merchant_payment' || tx.type === 'bill_payment') {
          group.totalSpent += amount;
        } else if (tx.type === 'credit' || tx.type === 'voucher_redemption') {
          group.totalReceived += amount;
        }

        // Track payment methods
        const method = tx.payment_method || 'unknown';
        group.paymentMethods.set(method, (group.paymentMethods.get(method) || 0) + 1);

        // Track transaction types
        if (tx.type === 'cash_out') {
          group.cashOutCount++;
          group.cashOutAmount += amount;
        } else if (tx.type === 'merchant_payment') {
          group.merchantPaymentCount++;
          group.merchantPaymentAmount += amount;
        } else if (tx.type === 'p2p' || tx.type === 'send_money') {
          group.p2pTransferCount++;
          group.p2pTransferAmount += amount;
        } else if (tx.type === 'bill_payment') {
          group.billPaymentCount++;
          group.billPaymentAmount += amount;
        }
      }

      // Calculate preferred payment method and upsert
      for (const [userId, group] of userGroups.entries()) {
        let preferredPaymentMethod: string | null = null;
        let maxCount = 0;
        for (const [method, count] of group.paymentMethods.entries()) {
          if (count > maxCount) {
            maxCount = count;
            preferredPaymentMethod = method;
          }
        }

        const balance = balanceMap.get(userId) || 0;
        const avgBalance = balance; // Simplified - in production, calculate average throughout day

        await query(
          `INSERT INTO user_behavior_analytics (
            user_id, date, wallet_balance, average_balance, transaction_count,
            total_spent, total_received, preferred_payment_method,
            cash_out_count, cash_out_amount, merchant_payment_count, merchant_payment_amount,
            p2p_transfer_count, p2p_transfer_amount, bill_payment_count, bill_payment_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (user_id, date)
          DO UPDATE SET
            wallet_balance = EXCLUDED.wallet_balance,
            average_balance = EXCLUDED.average_balance,
            transaction_count = EXCLUDED.transaction_count,
            total_spent = EXCLUDED.total_spent,
            total_received = EXCLUDED.total_received,
            preferred_payment_method = EXCLUDED.preferred_payment_method,
            cash_out_count = EXCLUDED.cash_out_count,
            cash_out_amount = EXCLUDED.cash_out_amount,
            merchant_payment_count = EXCLUDED.merchant_payment_count,
            merchant_payment_amount = EXCLUDED.merchant_payment_amount,
            p2p_transfer_count = EXCLUDED.p2p_transfer_count,
            p2p_transfer_amount = EXCLUDED.p2p_transfer_amount,
            bill_payment_count = EXCLUDED.bill_payment_count,
            bill_payment_amount = EXCLUDED.bill_payment_amount,
            updated_at = NOW()`,
          [
            userId,
            dateStr,
            balance,
            avgBalance,
            group.transactions.length,
            group.totalSpent,
            group.totalReceived,
            preferredPaymentMethod,
            group.cashOutCount,
            group.cashOutAmount,
            group.merchantPaymentCount,
            group.merchantPaymentAmount,
            group.p2pTransferCount,
            group.p2pTransferAmount,
            group.billPaymentCount,
            group.billPaymentAmount,
          ]
        );
      }

      logger.info(`[Analytics] Daily user behavior analytics aggregated for ${dateStr}`);
    } catch (error) {
      log.error('[Analytics] Error aggregating daily user behavior:', error);
      throw error;
    }
  }

  /**
   * Aggregate daily payment method analytics
   */
  async aggregateDailyPaymentMethods(targetDate: Date = new Date()): Promise<void> {
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const paymentMethods = await query<{
        payment_method: string;
        amount: number;
        user_id: string;
        status: string;
        created_at: Date;
      }>(
        `SELECT payment_method, amount, user_id, status, created_at
        FROM transactions
        WHERE created_at >= $1 AND created_at <= $2
        AND payment_method IS NOT NULL`,
        [startOfDay.toISOString(), endOfDay.toISOString()]
      );

      const methodGroups = new Map<string, {
        paymentMethod: string;
        amounts: number[];
        userIds: Set<string>;
        successCount: number;
        totalCount: number;
      }>();

      for (const tx of paymentMethods) {
        const method = tx.payment_method;
        if (!methodGroups.has(method)) {
          methodGroups.set(method, {
            paymentMethod: method,
            amounts: [],
            userIds: new Set(),
            successCount: 0,
            totalCount: 0,
          });
        }

        const group = methodGroups.get(method)!;
        group.amounts.push(parseFloat(tx.amount.toString()));
        group.userIds.add(tx.user_id);
        group.totalCount++;
        if (tx.status === 'completed') {
          group.successCount++;
        }
      }

      for (const [method, group] of methodGroups.entries()) {
        const totalVolume = group.amounts.reduce((sum, a) => sum + a, 0);
        const avgAmount = group.amounts.length > 0 ? totalVolume / group.amounts.length : 0;
        const successRate = group.totalCount > 0
          ? (group.successCount / group.totalCount) * 100
          : 0;

        await query(
          `INSERT INTO payment_method_analytics (
            payment_method, date, transaction_count, total_volume,
            average_transaction_amount, unique_users, success_rate
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (payment_method, date)
          DO UPDATE SET
            transaction_count = EXCLUDED.transaction_count,
            total_volume = EXCLUDED.total_volume,
            average_transaction_amount = EXCLUDED.average_transaction_amount,
            unique_users = EXCLUDED.unique_users,
            success_rate = EXCLUDED.success_rate,
            updated_at = NOW()`,
          [
            method,
            dateStr,
            group.totalCount,
            totalVolume,
            avgAmount,
            group.userIds.size,
            successRate,
          ]
        );
      }

      logger.info(`[Analytics] Daily payment method analytics aggregated for ${dateStr}`);
    } catch (error) {
      log.error('[Analytics] Error aggregating daily payment methods:', error);
      throw error;
    }
  }

  /**
   * Aggregate daily channel analytics (mobile app vs USSD)
   */
  async aggregateDailyChannels(targetDate: Date = new Date()): Promise<void> {
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Determine channel from payment method or metadata
      const transactions = await query<{
        payment_method: string;
        amount: number;
        user_id: string;
        metadata: any;
      }>(
        `SELECT payment_method, amount, user_id, metadata
        FROM transactions
        WHERE created_at >= $1 AND created_at <= $2
        AND status = 'completed'`,
        [startOfDay.toISOString(), endOfDay.toISOString()]
      );

      const channelGroups = new Map<'mobile_app' | 'ussd', {
        channel: 'mobile_app' | 'ussd';
        amounts: number[];
        userIds: Set<string>;
      }>();

      for (const tx of transactions) {
        // Determine channel: USSD if payment_method is 'ussd', otherwise mobile_app
        const channel: 'mobile_app' | 'ussd' = tx.payment_method === 'ussd' ? 'ussd' : 'mobile_app';

        if (!channelGroups.has(channel)) {
          channelGroups.set(channel, {
            channel,
            amounts: [],
            userIds: new Set(),
          });
        }

        const group = channelGroups.get(channel)!;
        group.amounts.push(parseFloat(tx.amount.toString()));
        group.userIds.add(tx.user_id);
      }

      for (const [channel, group] of channelGroups.entries()) {
        const totalVolume = group.amounts.reduce((sum, a) => sum + a, 0);
        const avgAmount = group.amounts.length > 0 ? totalVolume / group.amounts.length : 0;

        await query(
          `INSERT INTO channel_analytics (
            channel, date, transaction_count, total_volume,
            unique_users, average_transaction_amount
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (channel, date)
          DO UPDATE SET
            transaction_count = EXCLUDED.transaction_count,
            total_volume = EXCLUDED.total_volume,
            unique_users = EXCLUDED.unique_users,
            average_transaction_amount = EXCLUDED.average_transaction_amount,
            updated_at = NOW()`,
          [
            channel,
            dateStr,
            group.amounts.length,
            totalVolume,
            group.userIds.size,
            avgAmount,
          ]
        );
      }

      logger.info(`[Analytics] Daily channel analytics aggregated for ${dateStr}`);
    } catch (error) {
      log.error('[Analytics] Error aggregating daily channels:', error);
      throw error;
    }
  }

  /**
   * Aggregate hourly transaction analytics for real-time current day metrics
   * Runs every hour for the current day
   */
  async aggregateHourlyTransactions(targetDate: Date, hour: number): Promise<void> {
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfHour = new Date(targetDate);
    startOfHour.setHours(hour, 0, 0, 0);
    const endOfHour = new Date(targetDate);
    endOfHour.setHours(hour, 59, 59, 999);

    try {
      // Get all transactions for this hour
      const transactions = await query<{
        id: string;
        type: string;
        amount: number;
        currency: string;
        payment_method: string;
        user_id: string;
        recipient_id: string | null;
        status: string;
        created_at: Date;
        metadata: any;
      }>(
        `SELECT 
          id, type, amount, currency, payment_method, user_id, recipient_id, 
          status, created_at, metadata
        FROM transactions
        WHERE created_at >= $1 AND created_at <= $2
        AND status = 'completed'`,
        [startOfHour.toISOString(), endOfHour.toISOString()]
      );

      // Group by transaction type, payment method, merchant category
      const groups = new Map<string, {
        transactionType: string;
        paymentMethod?: string;
        merchantCategory?: string;
        amounts: number[];
        userIds: Set<string>;
        merchantIds: Set<string>;
      }>();

      for (const tx of transactions) {
        const merchantCategory = tx.metadata?.merchantCategory || null;
        const key = `${tx.type}|${tx.payment_method || 'unknown'}|${merchantCategory || 'none'}`;

        if (!groups.has(key)) {
          groups.set(key, {
            transactionType: tx.type,
            paymentMethod: tx.payment_method || undefined,
            merchantCategory: merchantCategory || undefined,
            amounts: [],
            userIds: new Set(),
            merchantIds: new Set(),
          });
        }

        const group = groups.get(key)!;
        group.amounts.push(parseFloat(tx.amount.toString()));
        group.userIds.add(tx.user_id);
        if (tx.recipient_id && tx.type === 'merchant_payment') {
          group.merchantIds.add(tx.recipient_id);
        }
      }

      // Calculate statistics and upsert with hour_of_day
      for (const [key, group] of groups.entries()) {
        const amounts = group.amounts.sort((a, b) => a - b);
        const totalVolume = amounts.reduce((sum, a) => sum + a, 0);
        const avgAmount = amounts.length > 0 ? totalVolume / amounts.length : 0;
        const medianAmount = amounts.length > 0
          ? amounts[Math.floor(amounts.length / 2)]
          : 0;
        const minAmount = amounts.length > 0 ? amounts[0] : 0;
        const maxAmount = amounts.length > 0 ? amounts[amounts.length - 1] : 0;

        await query(
          `INSERT INTO transaction_analytics (
            date, transaction_type, payment_method, merchant_category,
            total_transactions, total_volume, average_transaction_amount,
            median_transaction_amount, min_transaction_amount, max_transaction_amount,
            unique_users, unique_merchants, hour_of_day, day_of_week
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (date, transaction_type, payment_method, merchant_category, hour_of_day)
          DO UPDATE SET
            total_transactions = EXCLUDED.total_transactions,
            total_volume = EXCLUDED.total_volume,
            average_transaction_amount = EXCLUDED.average_transaction_amount,
            median_transaction_amount = EXCLUDED.median_transaction_amount,
            min_transaction_amount = EXCLUDED.min_transaction_amount,
            max_transaction_amount = EXCLUDED.max_transaction_amount,
            unique_users = EXCLUDED.unique_users,
            unique_merchants = EXCLUDED.unique_merchants,
            updated_at = NOW()`,
          [
            dateStr,
            group.transactionType,
            group.paymentMethod || null,
            group.merchantCategory || null,
            amounts.length,
            totalVolume,
            avgAmount,
            medianAmount,
            minAmount,
            maxAmount,
            group.userIds.size,
            group.merchantIds.size > 0 ? group.merchantIds.size : null,
            hour, // hour_of_day
            targetDate.getDay(), // day_of_week
          ]
        );
      }

      logger.info(`[Analytics] Hourly transaction analytics aggregated for ${dateStr} hour ${hour}`);
    } catch (error) {
      log.error('[Analytics] Error aggregating hourly transactions:', error);
      throw error;
    }
  }

  /**
   * Run all daily aggregations
   */
  async aggregateDaily(targetDate: Date = new Date()): Promise<void> {
    try {
      await Promise.all([
        this.aggregateDailyTransactions(targetDate),
        this.aggregateDailyUserBehavior(targetDate),
        this.aggregateDailyPaymentMethods(targetDate),
        this.aggregateDailyChannels(targetDate),
      ]);
      logger.info(`[Analytics] All daily aggregations completed for ${targetDate.toISOString().split('T')[0]}`);
    } catch (error) {
      log.error('[Analytics] Error in daily aggregation:', error);
      throw error;
    }
  }

  /**
   * Aggregate weekly analytics (runs on Monday)
   */
  async aggregateWeekly(targetWeekStart: Date): Promise<void> {
    // Aggregate each day of the week
    const weekStart = new Date(targetWeekStart);
    weekStart.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      await this.aggregateDaily(day);
    }

    logger.info(`[Analytics] Weekly aggregation completed for week starting ${weekStart.toISOString().split('T')[0]}`);
  }

  /**
   * Aggregate monthly analytics (runs on 1st of month)
   */
  async aggregateMonthly(targetMonth: Date): Promise<void> {
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

    // Aggregate each day of the month
    const currentDate = new Date(monthStart);
    while (currentDate <= monthEnd) {
      await this.aggregateDaily(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    logger.info(`[Analytics] Monthly aggregation completed for ${monthStart.toISOString().split('T')[0]}`);
  }
}

export const analyticsService = new AnalyticsService();
