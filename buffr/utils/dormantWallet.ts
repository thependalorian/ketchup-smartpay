/**
 * Dormant Wallet Management Utilities
 * 
 * Location: utils/dormantWallet.ts
 * Purpose: Implement PSD-3 §11.4 dormant wallet requirements
 * 
 * === BANK OF NAMIBIA PSD-3 REQUIREMENTS ===
 * 
 * §11.4.1: Wallet dormant after 6 months no transactions
 * §11.4.2: Customer notified 1 month before 6-month period
 * §11.4.3: No fees charged on dormant wallets
 * §11.4.4: Dormant funds not intermediated or treated as income
 * §11.4.5: Funds handling: return to customer, estate, sender, or hold for 3 years
 * §11.4.6: Monthly reporting of dormant/terminated wallets
 */

import { query, queryOne } from './db';
import { sendPushNotification } from './sendPushNotification';
import logger, { log } from '@/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Number of days for dormancy warning (5 months = ~152 days) */
export const DORMANCY_WARNING_DAYS = 152;

/** Number of days for dormancy (6 months = ~183 days) */
export const DORMANCY_THRESHOLD_DAYS = 183;

/** Number of days to hold dormant funds before release (3 years = ~1095 days) */
export const DORMANCY_HOLD_DAYS = 1095;

/** Dormancy statuses */
export type DormancyStatus = 'active' | 'warning' | 'dormant' | 'closed' | 'funds_released';

// ============================================================================
// TYPES
// ============================================================================

export interface DormantWallet {
  wallet_id: string;
  user_id: string;
  wallet_name: string;
  balance: number;
  currency: string;
  dormancy_status: DormancyStatus;
  last_transaction_at: Date;
  dormancy_warning_sent_at: Date | null;
  dormancy_started_at: Date | null;
  created_at: Date;
  user_email: string | null;
  user_phone: string | null;
  user_name: string | null;
  days_inactive: number;
  months_inactive: number;
  days_until_dormant: number | null;
  needs_warning: boolean;
}

export interface DormancyEvent {
  id: string;
  wallet_id: string;
  user_id: string;
  event_type: 'warning_sent' | 'marked_dormant' | 'reactivated' | 'funds_returned' | 'closed';
  previous_status: DormancyStatus | null;
  new_status: DormancyStatus;
  balance_at_event: number;
  notes: string | null;
  created_at: Date;
}

export interface DormancyReport {
  id: string;
  report_month: Date;
  report_type: 'monthly' | 'quarterly' | 'annual';
  total_wallets: number;
  active_wallets: number;
  warning_wallets: number;
  dormant_wallets: number;
  closed_wallets: number;
  total_dormant_balance: number;
  funds_released_this_period: number;
  new_dormant_wallets: number;
  reactivated_wallets: number;
  generated_at: Date;
}

export interface DormancyCheckResult {
  walletsNeedingWarning: DormantWallet[];
  walletsBecomingDormant: DormantWallet[];
  walletsForFundsRelease: DormantWallet[];
  summary: {
    totalActive: number;
    totalWarning: number;
    totalDormant: number;
    totalBalance: number;
  };
}

// ============================================================================
// DORMANCY DETECTION FUNCTIONS
// ============================================================================

/**
 * Get wallets that need dormancy warning (5+ months inactive)
 * Per PSD-3 §11.4.2: Customer notified 1 month before 6-month period
 */
export async function getWalletsNeedingWarning(): Promise<DormantWallet[]> {
  const results = await query<DormantWallet>(`
    SELECT
      w.id AS wallet_id,
      w.user_id,
      w.name AS wallet_name,
      w.balance,
      w.currency,
      w.dormancy_status,
      w.last_transaction_at,
      w.dormancy_warning_sent_at,
      w.dormancy_started_at,
      w.created_at,
      u.email AS user_email,
      u.phone_number AS user_phone,
      COALESCE(u.full_name, u.first_name || ' ' || u.last_name, 'User') AS user_name,
      EXTRACT(DAY FROM NOW() - w.last_transaction_at)::INTEGER AS days_inactive,
      EXTRACT(MONTH FROM AGE(NOW(), w.last_transaction_at))::INTEGER AS months_inactive,
      (${DORMANCY_THRESHOLD_DAYS} - EXTRACT(DAY FROM NOW() - w.last_transaction_at))::INTEGER AS days_until_dormant,
      TRUE AS needs_warning
    FROM wallets w
    LEFT JOIN users u ON w.user_id = u.id
    WHERE w.dormancy_status = 'active'
      AND w.dormancy_warning_sent_at IS NULL
      AND w.last_transaction_at <= NOW() - INTERVAL '${DORMANCY_WARNING_DAYS} days'
      AND w.last_transaction_at > NOW() - INTERVAL '${DORMANCY_THRESHOLD_DAYS} days'
      AND w.balance > 0
    ORDER BY w.last_transaction_at ASC
  `);

  return results;
}

/**
 * Get wallets that should be marked as dormant (6+ months inactive)
 * Per PSD-3 §11.4.1: Wallet dormant after 6 months no transactions
 */
export async function getWalletsBecomingDormant(): Promise<DormantWallet[]> {
  const results = await query<DormantWallet>(`
    SELECT
      w.id AS wallet_id,
      w.user_id,
      w.name AS wallet_name,
      w.balance,
      w.currency,
      w.dormancy_status,
      w.last_transaction_at,
      w.dormancy_warning_sent_at,
      w.dormancy_started_at,
      w.created_at,
      u.email AS user_email,
      u.phone_number AS user_phone,
      COALESCE(u.full_name, u.first_name || ' ' || u.last_name, 'User') AS user_name,
      EXTRACT(DAY FROM NOW() - w.last_transaction_at)::INTEGER AS days_inactive,
      EXTRACT(MONTH FROM AGE(NOW(), w.last_transaction_at))::INTEGER AS months_inactive,
      0 AS days_until_dormant,
      FALSE AS needs_warning
    FROM wallets w
    LEFT JOIN users u ON w.user_id = u.id
    WHERE w.dormancy_status IN ('active', 'warning')
      AND w.last_transaction_at <= NOW() - INTERVAL '${DORMANCY_THRESHOLD_DAYS} days'
    ORDER BY w.last_transaction_at ASC
  `);

  return results;
}

/**
 * Get wallets eligible for funds release (3+ years dormant)
 * Per PSD-3 §11.4.5: Hold funds for 3 years before release
 */
export async function getWalletsForFundsRelease(): Promise<DormantWallet[]> {
  const results = await query<DormantWallet>(`
    SELECT
      w.id AS wallet_id,
      w.user_id,
      w.name AS wallet_name,
      w.balance,
      w.currency,
      w.dormancy_status,
      w.last_transaction_at,
      w.dormancy_warning_sent_at,
      w.dormancy_started_at,
      w.created_at,
      u.email AS user_email,
      u.phone_number AS user_phone,
      COALESCE(u.full_name, u.first_name || ' ' || u.last_name, 'User') AS user_name,
      EXTRACT(DAY FROM NOW() - w.last_transaction_at)::INTEGER AS days_inactive,
      EXTRACT(MONTH FROM AGE(NOW(), w.last_transaction_at))::INTEGER AS months_inactive,
      NULL AS days_until_dormant,
      FALSE AS needs_warning
    FROM wallets w
    LEFT JOIN users u ON w.user_id = u.id
    WHERE w.dormancy_status = 'dormant'
      AND w.dormancy_started_at <= NOW() - INTERVAL '${DORMANCY_HOLD_DAYS} days'
      AND w.balance > 0
    ORDER BY w.dormancy_started_at ASC
  `);

  return results;
}

/**
 * Run full dormancy check and return all wallets needing attention
 */
export async function runDormancyCheck(): Promise<DormancyCheckResult> {
  const [walletsNeedingWarning, walletsBecomingDormant, walletsForFundsRelease] = await Promise.all([
    getWalletsNeedingWarning(),
    getWalletsBecomingDormant(),
    getWalletsForFundsRelease(),
  ]);

  // Get summary counts
  const summary = await queryOne<{
    total_active: number;
    total_warning: number;
    total_dormant: number;
    total_dormant_balance: number;
  }>(`
    SELECT
      COUNT(*) FILTER (WHERE dormancy_status = 'active')::INTEGER AS total_active,
      COUNT(*) FILTER (WHERE dormancy_status = 'warning')::INTEGER AS total_warning,
      COUNT(*) FILTER (WHERE dormancy_status = 'dormant')::INTEGER AS total_dormant,
      COALESCE(SUM(balance) FILTER (WHERE dormancy_status = 'dormant'), 0) AS total_dormant_balance
    FROM wallets
  `);

  return {
    walletsNeedingWarning,
    walletsBecomingDormant,
    walletsForFundsRelease,
    summary: {
      totalActive: summary?.total_active || 0,
      totalWarning: summary?.total_warning || 0,
      totalDormant: summary?.total_dormant || 0,
      totalBalance: Number(summary?.total_dormant_balance || 0),
    },
  };
}

// ============================================================================
// DORMANCY ACTION FUNCTIONS
// ============================================================================

/**
 * Send dormancy warning for a wallet
 * Per PSD-3 §11.4.2: Customer notified 1 month before 6-month period
 */
export async function sendDormancyWarning(walletId: string): Promise<boolean> {
  try {
    // Get wallet details
    const wallet = await queryOne<{ user_id: string; balance: number; dormancy_status: string }>(
      'SELECT user_id, balance, dormancy_status FROM wallets WHERE id = $1',
      [walletId]
    );

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Update wallet status
    await query(
      `UPDATE wallets 
       SET dormancy_status = 'warning',
           dormancy_warning_sent_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [walletId]
    );

    // Log event
    await query(
      `INSERT INTO wallet_dormancy_events (wallet_id, user_id, event_type, previous_status, new_status, balance_at_event, notes)
       VALUES ($1, $2, 'warning_sent', $3, 'warning', $4, 'Dormancy warning sent to customer per PSD-3 §11.4.2')`,
      [walletId, wallet.user_id, wallet.dormancy_status, wallet.balance]
    );

    // Send push notification
    await sendPushNotification({
      userIds: wallet.user_id,
      title: '⚠️ Wallet Dormancy Warning',
      body: 'Your wallet has been inactive for 5 months. It will be marked as dormant in 30 days to comply with PSD-3 regulations.',
      data: { type: 'security', walletId },
      categoryId: 'security',
      priority: 'high'
    }).catch(err => log.error('Failed to send dormancy warning notification:', err));

    return true;
  } catch (error) {
    log.error('Error sending dormancy warning:', error);
    return false;
  }
}

/**
 * Mark wallet as dormant
 * Per PSD-3 §11.4.1: Wallet dormant after 6 months no transactions
 */
export async function markWalletDormant(walletId: string): Promise<boolean> {
  try {
    // Get wallet details
    const wallet = await queryOne<{ user_id: string; balance: number; dormancy_status: string }>(
      'SELECT user_id, balance, dormancy_status FROM wallets WHERE id = $1',
      [walletId]
    );

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Update wallet status
    await query(
      `UPDATE wallets 
       SET dormancy_status = 'dormant',
           dormancy_started_at = NOW(),
           dormancy_scheduled_release_at = NOW() + INTERVAL '${DORMANCY_HOLD_DAYS} days',
           updated_at = NOW()
       WHERE id = $1`,
      [walletId]
    );

    // Log event
    await query(
      `INSERT INTO wallet_dormancy_events (wallet_id, user_id, event_type, previous_status, new_status, balance_at_event, notes)
       VALUES ($1, $2, 'marked_dormant', $3, 'dormant', $4, 'Wallet marked dormant after 6 months inactivity per PSD-3 §11.4.1')`,
      [walletId, wallet.user_id, wallet.dormancy_status, wallet.balance]
    );

    // Send push notification
    await sendPushNotification({
      userIds: wallet.user_id,
      title: '💤 Wallet Marked Dormant',
      body: 'Your wallet has been marked as dormant due to 6 months of inactivity. Your funds are safe but require reactivation.',
      data: { type: 'security', walletId },
      categoryId: 'security',
      priority: 'high'
    }).catch(err => log.error('Failed to send dormancy notification:', err));

    return true;
  } catch (error) {
    log.error('Error marking wallet dormant:', error);
    return false;
  }
}

/**
 * Reactivate a dormant wallet
 * This is typically called automatically when a transaction occurs
 */
export async function reactivateWallet(walletId: string): Promise<boolean> {
  try {
    // Get wallet details
    const wallet = await queryOne<{ user_id: string; balance: number; dormancy_status: string }>(
      'SELECT user_id, balance, dormancy_status FROM wallets WHERE id = $1',
      [walletId]
    );

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.dormancy_status === 'active') {
      return true; // Already active
    }

    // Update wallet status
    await query(
      `UPDATE wallets 
       SET dormancy_status = 'active',
           dormancy_warning_sent_at = NULL,
           dormancy_started_at = NULL,
           dormancy_scheduled_release_at = NULL,
           last_transaction_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [walletId]
    );

    // Log event
    await query(
      `INSERT INTO wallet_dormancy_events (wallet_id, user_id, event_type, previous_status, new_status, balance_at_event, notes)
       VALUES ($1, $2, 'reactivated', $3, 'active', $4, 'Wallet reactivated due to user activity')`,
      [walletId, wallet.user_id, wallet.dormancy_status, wallet.balance]
    );

    return true;
  } catch (error) {
    log.error('Error reactivating wallet:', error);
    return false;
  }
}

/**
 * Process dormant funds release (after 3 years)
 * Per PSD-3 §11.4.5: Return to customer, estate, sender, or use for scheme development
 */
export async function processFundsRelease(
  walletId: string,
  releaseType: 'return_customer' | 'return_estate' | 'return_sender' | 'scheme_development'
): Promise<boolean> {
  try {
    // Get wallet details
    const wallet = await queryOne<{ user_id: string; balance: number; dormancy_status: string }>(
      'SELECT user_id, balance, dormancy_status FROM wallets WHERE id = $1',
      [walletId]
    );

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.dormancy_status !== 'dormant') {
      throw new Error('Wallet must be dormant to release funds');
    }

    // Record the funds release
    await query(
      `UPDATE wallets 
       SET dormancy_status = 'funds_released',
           balance = 0,
           updated_at = NOW()
       WHERE id = $1`,
      [walletId]
    );

    // Log event
    await query(
      `INSERT INTO wallet_dormancy_events (wallet_id, user_id, event_type, previous_status, new_status, balance_at_event, notes)
       VALUES ($1, $2, 'funds_returned', 'dormant', 'funds_released', $3, $4)`,
      [walletId, wallet.user_id, wallet.balance, `Funds released via ${releaseType} per PSD-3 §11.4.5`]
    );

    return true;
  } catch (error) {
    log.error('Error processing funds release:', error);
    return false;
  }
}

// ============================================================================
// REPORTING FUNCTIONS
// ============================================================================

/**
 * Generate monthly dormancy report
 * Per PSD-3 §11.4.6: Monthly reporting of dormant/terminated wallets
 */
export async function generateMonthlyReport(reportMonth?: Date): Promise<DormancyReport | null> {
  try {
    const month = reportMonth || new Date();
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Get wallet counts and balances
    const counts = await queryOne<{
      total_wallets: number;
      active_wallets: number;
      warning_wallets: number;
      dormant_wallets: number;
      closed_wallets: number;
      total_dormant_balance: number;
    }>(`
      SELECT
        COUNT(*)::INTEGER AS total_wallets,
        COUNT(*) FILTER (WHERE dormancy_status = 'active')::INTEGER AS active_wallets,
        COUNT(*) FILTER (WHERE dormancy_status = 'warning')::INTEGER AS warning_wallets,
        COUNT(*) FILTER (WHERE dormancy_status = 'dormant')::INTEGER AS dormant_wallets,
        COUNT(*) FILTER (WHERE dormancy_status = 'closed')::INTEGER AS closed_wallets,
        COALESCE(SUM(balance) FILTER (WHERE dormancy_status = 'dormant'), 0) AS total_dormant_balance
      FROM wallets
    `);

    // Get new dormant and reactivated counts for the period
    const periodCounts = await queryOne<{
      new_dormant_wallets: number;
      reactivated_wallets: number;
      funds_released_this_period: number;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'marked_dormant')::INTEGER AS new_dormant_wallets,
        COUNT(*) FILTER (WHERE event_type = 'reactivated')::INTEGER AS reactivated_wallets,
        COALESCE(SUM(balance_at_event) FILTER (WHERE event_type = 'funds_returned'), 0) AS funds_released_this_period
      FROM wallet_dormancy_events
      WHERE created_at >= $1 AND created_at <= $2
    `, [monthStart.toISOString(), monthEnd.toISOString()]);

    // Insert or update report
    const report = await queryOne<DormancyReport>(`
      INSERT INTO wallet_dormancy_reports (
        report_month, report_type, total_wallets, active_wallets, warning_wallets,
        dormant_wallets, closed_wallets, total_dormant_balance, funds_released_this_period,
        new_dormant_wallets, reactivated_wallets, generated_at, report_data
      ) VALUES ($1, 'monthly', $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
      ON CONFLICT (report_month, report_type) 
      DO UPDATE SET
        total_wallets = EXCLUDED.total_wallets,
        active_wallets = EXCLUDED.active_wallets,
        warning_wallets = EXCLUDED.warning_wallets,
        dormant_wallets = EXCLUDED.dormant_wallets,
        closed_wallets = EXCLUDED.closed_wallets,
        total_dormant_balance = EXCLUDED.total_dormant_balance,
        funds_released_this_period = EXCLUDED.funds_released_this_period,
        new_dormant_wallets = EXCLUDED.new_dormant_wallets,
        reactivated_wallets = EXCLUDED.reactivated_wallets,
        generated_at = NOW(),
        report_data = EXCLUDED.report_data
      RETURNING *
    `, [
      monthStart.toISOString(),
      counts?.total_wallets || 0,
      counts?.active_wallets || 0,
      counts?.warning_wallets || 0,
      counts?.dormant_wallets || 0,
      counts?.closed_wallets || 0,
      counts?.total_dormant_balance || 0,
      periodCounts?.funds_released_this_period || 0,
      periodCounts?.new_dormant_wallets || 0,
      periodCounts?.reactivated_wallets || 0,
      JSON.stringify({ counts, periodCounts, generatedAt: new Date().toISOString() }),
    ]);

    return report;
  } catch (error) {
    log.error('Error generating monthly report:', error);
    return null;
  }
}

/**
 * Get dormancy report for a specific month
 */
export async function getDormancyReport(reportMonth: Date, reportType: string = 'monthly'): Promise<DormancyReport | null> {
  const monthStart = new Date(reportMonth.getFullYear(), reportMonth.getMonth(), 1);
  
  return queryOne<DormancyReport>(
    'SELECT * FROM wallet_dormancy_reports WHERE report_month = $1 AND report_type = $2',
    [monthStart.toISOString(), reportType]
  );
}

/**
 * Get all dormancy reports for a year
 */
export async function getDormancyReportsForYear(year: number): Promise<DormancyReport[]> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  return query<DormancyReport>(
    `SELECT * FROM wallet_dormancy_reports 
     WHERE report_month >= $1 AND report_month <= $2
     ORDER BY report_month ASC`,
    [startDate.toISOString(), endDate.toISOString()]
  );
}

// ============================================================================
// SCHEDULED JOB FUNCTIONS
// ============================================================================

/**
 * Run daily dormancy processing job
 * Should be called by a scheduled job/cron
 */
export async function runDailyDormancyProcessing(): Promise<{
  warningsSent: number;
  walletsMarkedDormant: number;
  errors: string[];
}> {
  const result = {
    warningsSent: 0,
    walletsMarkedDormant: 0,
    errors: [] as string[],
  };

  try {
    // 1. Send warnings to wallets approaching dormancy
    const walletsNeedingWarning = await getWalletsNeedingWarning();
    for (const wallet of walletsNeedingWarning) {
      const success = await sendDormancyWarning(wallet.wallet_id);
      if (success) {
        result.warningsSent++;
      } else {
        result.errors.push(`Failed to send warning for wallet ${wallet.wallet_id}`);
      }
    }

    // 2. Mark dormant wallets that have passed 6 months
    const walletsBecomingDormant = await getWalletsBecomingDormant();
    for (const wallet of walletsBecomingDormant) {
      const success = await markWalletDormant(wallet.wallet_id);
      if (success) {
        result.walletsMarkedDormant++;
      } else {
        result.errors.push(`Failed to mark dormant wallet ${wallet.wallet_id}`);
      }
    }

    logger.info(`Dormancy processing complete: ${result.warningsSent} warnings sent, ${result.walletsMarkedDormant} wallets marked dormant`);
  } catch (error) {
    log.error('Error in daily dormancy processing:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Run monthly reporting job
 * Should be called on the first day of each month
 */
export async function runMonthlyDormancyReporting(): Promise<DormancyReport | null> {
  // Generate report for previous month
  const today = new Date();
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  
  return generateMonthlyReport(previousMonth);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get dormancy status for a specific wallet
 */
export async function getWalletDormancyStatus(walletId: string): Promise<{
  status: DormancyStatus;
  daysInactive: number;
  daysUntilDormant: number | null;
  balance: number;
  lastTransactionAt: Date | null;
  warningsentAt: Date | null;
  dormantSinceAt: Date | null;
} | null> {
  const result = await queryOne<any>(`
    SELECT
      dormancy_status AS status,
      EXTRACT(DAY FROM NOW() - last_transaction_at)::INTEGER AS days_inactive,
      CASE
        WHEN dormancy_status = 'active' THEN
          (${DORMANCY_THRESHOLD_DAYS} - EXTRACT(DAY FROM NOW() - last_transaction_at))::INTEGER
        ELSE NULL
      END AS days_until_dormant,
      balance,
      last_transaction_at,
      dormancy_warning_sent_at AS warning_sent_at,
      dormancy_started_at AS dormant_since_at
    FROM wallets
    WHERE id = $1
  `, [walletId]);

  if (!result) return null;

  return {
    status: result.status,
    daysInactive: result.days_inactive,
    daysUntilDormant: result.days_until_dormant,
    balance: Number(result.balance),
    lastTransactionAt: result.last_transaction_at ? new Date(result.last_transaction_at) : null,
    warningsentAt: result.warning_sent_at ? new Date(result.warning_sent_at) : null,
    dormantSinceAt: result.dormant_since_at ? new Date(result.dormant_since_at) : null,
  };
}

/**
 * Check if a wallet can perform transactions
 * Per PSD-3 §11.4.3: No fees charged on dormant wallets
 * Per PSD-3 §11.4.4: Dormant funds not intermediated
 */
export function canWalletTransact(dormancyStatus: DormancyStatus): boolean {
  // Only active and warning status wallets can transact
  // Dormant wallets are frozen until reactivated
  return dormancyStatus === 'active' || dormancyStatus === 'warning';
}
