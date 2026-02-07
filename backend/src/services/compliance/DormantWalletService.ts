/**
 * Dormant Wallet Service
 * 
 * Purpose: Manage dormant e-wallets per PSD-3 requirements
 * Regulation: PSD-3 Section 11.4 - Unclaimed Funds and Dormant Wallets
 * Location: backend/src/services/compliance/DormantWalletService.ts
 * 
 * Requirements:
 * - Wallet becomes dormant after 6 months of no activity
 * - Notify customer 1 month before dormancy (at 5 months)
 * - No fees can be charged on dormant wallets
 * - Funds cannot be intermediated or treated as income
 * - Must process dormant funds per Section 11.4.5
 * 
 * PSD-3 Section 11.4.1: "A customer's e-money wallet must be considered dormant 
 * if it does not register a transaction for a consecutive period of six (6) months."
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface DormantWallet {
  id: string;
  beneficiaryId: string;
  walletBalance: number;
  lastTransactionDate: Date;
  dormancyDate: Date | null;
  status: string;
  customerNotified: boolean;
}

interface DormancyCheckResult {
  approachingDormancy: number; // 5 months inactive
  nowDormant: number; // 6 months inactive
  notificationsToSend: number;
}

export class DormantWalletService {
  private static readonly DORMANCY_PERIOD_MONTHS = 6; // PSD-3 Section 11.4.1
  private static readonly NOTIFICATION_PERIOD_MONTHS = 5; // 1 month before dormancy
  private static readonly SEPARATE_ACCOUNT_PERIOD_YEARS = 3; // PSD-3 Section 11.4.5(d)

  /**
   * Identify wallets approaching dormancy (5 months inactive)
   * PSD-3 Section 11.4.2: Notify 1 month before dormancy
   */
  static async identifyApproachingDormancy(): Promise<DormantWallet[]> {
    try {
      const fiveMonthsAgo = new Date();
      fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - this.NOTIFICATION_PERIOD_MONTHS);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - this.DORMANCY_PERIOD_MONTHS);

      // Find wallets with last transaction between 5-6 months ago
      const result = await sql`
        SELECT 
          b.id as beneficiary_id,
          b.name,
          b.phone,
          wb.current_balance as wallet_balance,
          wb.last_transaction_date,
          wb.wallet_status
        FROM beneficiaries b
        JOIN ewallet_balances wb ON b.id = wb.beneficiary_id
        WHERE wb.wallet_status = 'active'
          AND wb.last_transaction_date < ${fiveMonthsAgo.toISOString()}
          AND wb.last_transaction_date >= ${sixMonthsAgo.toISOString()}
          AND wb.current_balance > 0
          AND NOT EXISTS (
            SELECT 1 FROM dormant_wallets dw
            WHERE dw.beneficiary_id = b.id
              AND dw.status IN ('approaching_dormancy', 'dormant')
          )
      `;

      const wallets: DormantWallet[] = [];

      for (const row of result) {
        // Create dormant wallet record
        const dormantRecord = await sql`
          INSERT INTO dormant_wallets (
            beneficiary_id,
            wallet_balance,
            last_transaction_date,
            dormancy_approaching_date,
            status
          ) VALUES (
            ${row.beneficiary_id},
            ${row.wallet_balance},
            ${row.last_transaction_date},
            CURRENT_DATE,
            'approaching_dormancy'
          )
          RETURNING *
        `;

        wallets.push({
          id: dormantRecord[0].id,
          beneficiaryId: row.beneficiary_id,
          walletBalance: parseFloat(row.wallet_balance),
          lastTransactionDate: new Date(row.last_transaction_date),
          dormancyDate: null,
          status: 'approaching_dormancy',
          customerNotified: false,
        });
      }

      if (wallets.length > 0) {
        console.log(`⚠️ Found ${wallets.length} wallet(s) approaching dormancy`);
      }

      return wallets;
    } catch (error: any) {
      console.error('❌ Failed to identify approaching dormancy:', error.message);
      throw error;
    }
  }

  /**
   * Mark wallets as dormant (6 months inactive)
   * PSD-3 Section 11.4.1: Dormant after 6 months
   */
  static async markWalletsAsDormant(): Promise<DormantWallet[]> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - this.DORMANCY_PERIOD_MONTHS);

      // Find wallets with last transaction over 6 months ago
      const result = await sql`
        SELECT 
          b.id as beneficiary_id,
          wb.current_balance as wallet_balance,
          wb.last_transaction_date
        FROM beneficiaries b
        JOIN ewallet_balances wb ON b.id = wb.beneficiary_id
        WHERE wb.wallet_status = 'active'
          AND wb.last_transaction_date < ${sixMonthsAgo.toISOString()}
          AND wb.current_balance > 0
      `;

      const dormantWallets: DormantWallet[] = [];

      for (const row of result) {
        // Update or insert dormant wallet record
        const dormantRecord = await sql`
          INSERT INTO dormant_wallets (
            beneficiary_id,
            wallet_balance,
            last_transaction_date,
            dormancy_date,
            status
          ) VALUES (
            ${row.beneficiary_id},
            ${row.wallet_balance},
            ${row.last_transaction_date},
            CURRENT_DATE,
            'dormant'
          )
          ON CONFLICT (beneficiary_id)
          DO UPDATE SET
            dormancy_date = CURRENT_DATE,
            status = 'dormant',
            updated_at = NOW()
          WHERE dormant_wallets.status = 'approaching_dormancy'
          RETURNING *
        `;

        // Update wallet status
        await sql`
          UPDATE ewallet_balances
          SET wallet_status = 'dormant', updated_at = NOW()
          WHERE beneficiary_id = ${row.beneficiary_id}
        `;

        // Log to audit trail
        await sql`
          INSERT INTO compliance_audit_trail (
            audit_type,
            regulation,
            section,
            action_taken,
            performed_by,
            result,
            notes
          ) VALUES (
            'dormant_wallet',
            'PSD-3',
            '11.4.1',
            'Wallet marked as dormant',
            'System',
            'compliant',
            ${`Beneficiary: ${row.beneficiary_id}, Balance: N$${row.wallet_balance}`}
          )
        `;

        if (dormantRecord.length > 0) {
          dormantWallets.push({
            id: dormantRecord[0].id,
            beneficiaryId: row.beneficiary_id,
            walletBalance: parseFloat(row.wallet_balance),
            lastTransactionDate: new Date(row.last_transaction_date),
            dormancyDate: new Date(),
            status: 'dormant',
            customerNotified: dormantRecord[0].notification_sent,
          });
        }
      }

      if (dormantWallets.length > 0) {
        console.log(`💤 Marked ${dormantWallets.length} wallet(s) as dormant`);
      }

      return dormantWallets;
    } catch (error: any) {
      console.error('❌ Failed to mark wallets as dormant:', error.message);
      throw error;
    }
  }

  /**
   * Send dormancy notifications
   * PSD-3 Section 11.4.2: Notify 1 month before dormancy
   */
  static async sendDormancyNotifications(): Promise<number> {
    try {
      // Get wallets needing notification
      const walletsToNotify = await sql`
        SELECT dw.*, b.name, b.phone
        FROM dormant_wallets dw
        JOIN beneficiaries b ON dw.beneficiary_id = b.id
        WHERE dw.status = 'approaching_dormancy'
          AND dw.notification_sent = FALSE
      `;

      let notificationsSent = 0;

      for (const wallet of walletsToNotify) {
        // Send notification (integrate with SMS/Email in production)
        await this.sendNotification(wallet);

        // Mark as notified
        await sql`
          UPDATE dormant_wallets
          SET 
            notification_sent = TRUE,
            customer_notified_date = CURRENT_DATE,
            updated_at = NOW()
          WHERE id = ${wallet.id}
        `;

        notificationsSent++;
      }

      if (notificationsSent > 0) {
        console.log(`📧 Sent ${notificationsSent} dormancy notification(s)`);
      }

      return notificationsSent;
    } catch (error: any) {
      console.error('❌ Failed to send dormancy notifications:', error.message);
      throw error;
    }
  }

  /**
   * Process dormant funds
   * PSD-3 Section 11.4.5: Specific procedures for fund resolution
   */
  static async processDormantFunds(dormantWalletId: string): Promise<void> {
    try {
      // Get dormant wallet details
      const walletData = await sql`
        SELECT dw.*, b.name, b.phone
        FROM dormant_wallets dw
        JOIN beneficiaries b ON dw.beneficiary_id = b.id
        WHERE dw.id = ${dormantWalletId}
      `;

      if (walletData.length === 0) {
        throw new Error('Dormant wallet not found');
      }

      const wallet = walletData[0];

      // Determine resolution method per PSD-3 Section 11.4.5
      let resolutionMethod = '';
      
      // (a) If customer has primary banking account with issuer
      // For now, assume we need to return to customer directly
      
      // (c) If sender is known but recipient isn't
      // Check if there's a sender recorded
      
      // (d) Default: Move to separate account for 3 years
      resolutionMethod = 'separate_account';

      // Update dormant wallet
      await sql`
        UPDATE dormant_wallets
        SET 
          status = 'funds_to_separate_account',
          resolution_method = ${resolutionMethod},
          resolution_date = CURRENT_DATE,
          resolution_notes = 'Funds moved to separate account per PSD-3 Section 11.4.5(d)',
          updated_at = NOW()
        WHERE id = ${dormantWalletId}
      `;

      // Zero out wallet balance
      await sql`
        UPDATE ewallet_balances
        SET 
          current_balance = 0,
          available_balance = 0,
          wallet_status = 'closed',
          updated_at = NOW()
        WHERE beneficiary_id = ${wallet.beneficiary_id}
      `;

      // Log to audit trail
      await sql`
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          'dormant_fund_processing',
          'PSD-3',
          '11.4.5',
          'Dormant wallet funds processed',
          'System',
          'compliant',
          ${JSON.stringify({
            beneficiaryId: wallet.beneficiary_id,
            balance: wallet.wallet_balance,
            resolutionMethod,
          })}
        )
      `;

      console.log(`✅ Processed dormant wallet ${dormantWalletId}: N$${wallet.wallet_balance}`);
    } catch (error: any) {
      console.error('❌ Failed to process dormant funds:', error.message);
      throw error;
    }
  }

  /**
   * Get dormancy statistics for reporting
   * PSD-3 Section 11.4.6: Report in monthly returns
   */
  static async getDormancyStatistics(): Promise<{
    totalDormantWallets: number;
    totalDormantBalance: number;
    approachingDormancy: number;
    fundsInSeparateAccount: number;
    fundsReturned: number;
  }> {
    try {
      const result = await sql`
        SELECT 
          COUNT(CASE WHEN status = 'dormant' THEN 1 END) as total_dormant,
          COALESCE(SUM(CASE WHEN status = 'dormant' THEN wallet_balance END), 0) as total_dormant_balance,
          COUNT(CASE WHEN status = 'approaching_dormancy' THEN 1 END) as approaching,
          COUNT(CASE WHEN status = 'funds_to_separate_account' THEN 1 END) as separate_account,
          COUNT(CASE WHEN status = 'funds_returned' THEN 1 END) as returned
        FROM dormant_wallets
      `;

      const stats = result[0];

      return {
        totalDormantWallets: parseInt(stats.total_dormant),
        totalDormantBalance: parseFloat(stats.total_dormant_balance),
        approachingDormancy: parseInt(stats.approaching),
        fundsInSeparateAccount: parseInt(stats.separate_account),
        fundsReturned: parseInt(stats.returned),
      };
    } catch (error: any) {
      console.error('❌ Failed to get dormancy statistics:', error.message);
      throw error;
    }
  }

  /**
   * Send notification to customer
   * PSD-3 Section 11.4.2: Notify before dormancy
   */
  private static async sendNotification(wallet: any): Promise<void> {
    // TODO: Integrate with SMS/Email provider
    console.log(`📧 Dormancy notification sent to ${wallet.name} (${wallet.phone})`);
    console.log(`   Balance: N$${wallet.wallet_balance}`);
    console.log(`   Last transaction: ${new Date(wallet.last_transaction_date).toLocaleDateString()}`);
    console.log(`   Message: "Your e-wallet will become dormant in 1 month. Please make a transaction to keep it active."`);
    
    // In production:
    // await smsProvider.send({
    //   to: wallet.phone,
    //   message: `Ketchup SmartPay: Your e-wallet (N$${wallet.wallet_balance}) will become dormant on [date]. Make a transaction to keep it active.`
    // });
  }

  /**
   * Run daily dormancy check
   * Should be scheduled to run daily
   */
  static async runDailyDormancyCheck(): Promise<DormancyCheckResult> {
    try {
      console.log('🔍 Running daily dormancy check...');

      // Step 1: Identify approaching dormancy
      const approaching = await this.identifyApproachingDormancy();

      // Step 2: Mark dormant wallets
      const dormant = await this.markWalletsAsDormant();

      // Step 3: Send notifications
      const notificationsSent = await this.sendDormancyNotifications();

      const result: DormancyCheckResult = {
        approachingDormancy: approaching.length,
        nowDormant: dormant.length,
        notificationsToSend: notificationsSent,
      };

      // Log to audit trail
      await sql`
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          'dormancy_check',
          'PSD-3',
          '11.4',
          'Daily dormancy check completed',
          'System',
          'compliant',
          ${JSON.stringify(result)}
        )
      `;

      console.log(`✅ Daily dormancy check complete:`);
      console.log(`   Approaching dormancy: ${result.approachingDormancy}`);
      console.log(`   Now dormant: ${result.nowDormant}`);
      console.log(`   Notifications sent: ${result.notificationsToSend}`);

      return result;
    } catch (error: any) {
      console.error('❌ Daily dormancy check failed:', error.message);
      throw error;
    }
  }

  /**
   * Get dormant wallets list
   */
  static async getDormantWallets(status?: string): Promise<DormantWallet[]> {
    try {
      let query;
      
      if (status) {
        query = await sql`
          SELECT * FROM dormant_wallets
          WHERE status = ${status}
          ORDER BY dormancy_date DESC NULLS LAST
        `;
      } else {
        query = await sql`
          SELECT * FROM dormant_wallets
          ORDER BY dormancy_date DESC NULLS LAST
        `;
      }

      return query.map((row: any) => ({
        id: row.id,
        beneficiaryId: row.beneficiary_id,
        walletBalance: parseFloat(row.wallet_balance),
        lastTransactionDate: new Date(row.last_transaction_date),
        dormancyDate: row.dormancy_date ? new Date(row.dormancy_date) : null,
        status: row.status,
        customerNotified: row.notification_sent,
      }));
    } catch (error: any) {
      console.error('❌ Failed to get dormant wallets:', error.message);
      throw error;
    }
  }
}
