/**
 * Beneficiary Feedback Service
 * 
 * Location: services/beneficiaryFeedbackService.ts
 * Purpose: Collect structured feedback from beneficiaries to inform product decisions
 * 
 * Features:
 * - Post-transaction feedback
 * - Periodic surveys
 * - Feature interest surveys
 * - Link feedback to analytics for correlation
 */

import { query } from '@/utils/db';
import { sendSMS } from '@/utils/sendSMS';
import logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type FeedbackType = 'post_transaction' | 'periodic' | 'feature_interest' | 'general';

export interface PostTransactionFeedback {
  userId: string;
  transactionId: string;
  satisfactionScore: number; // 1-5
  feedbackText?: string;
  channel: 'app' | 'ussd' | 'sms';
}

export interface FeatureInterestSurvey {
  userId: string;
  featureName: 'Savings Account' | 'Micro-Loans' | 'Recurring Payments' | 'Emergency Funds' | 'Family Management';
  wouldUse: boolean;
  interestLevel?: 'very_interested' | 'interested' | 'neutral' | 'not_interested';
  concerns?: string;
  suggestions?: string;
  channel: 'app' | 'ussd' | 'sms';
}

export interface PeriodicSurvey {
  userId: string;
  surveyPeriod: 'monthly' | 'quarterly' | 'annual';
  periodStart: Date;
  periodEnd: Date;
  questions: Array<{
    question: string;
    answer: string;
    type: 'multiple_choice' | 'text' | 'rating';
  }>;
  channel: 'sms' | 'ussd' | 'app';
}

// ============================================================================
// BENEFICIARY FEEDBACK SERVICE
// ============================================================================

class BeneficiaryFeedbackService {
  /**
   * Submit post-transaction feedback
   */
  async submitPostTransactionFeedback(feedback: PostTransactionFeedback): Promise<string> {
    try {
      const result = await query<{ id: string }>(
        `INSERT INTO beneficiary_feedback (
          user_id, feedback_type, transaction_id, satisfaction_score, feedback_text, channel
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          feedback.userId,
          'post_transaction',
          feedback.transactionId,
          feedback.satisfactionScore,
          feedback.feedbackText || null,
          feedback.channel,
        ]
      );

      if (result.length === 0) {
        throw new Error('Failed to save feedback');
      }

      logger.info(`Post-transaction feedback saved: ${result[0].id}`);
      return result[0].id;
    } catch (error: any) {
      logger.error('Error submitting post-transaction feedback:', error);
      throw error;
    }
  }

  /**
   * Submit feature interest survey
   */
  async submitFeatureInterestSurvey(survey: FeatureInterestSurvey): Promise<string> {
    try {
      // Get user persona and transaction patterns from analytics
      const userAnalytics = await query<{
        avg_balance: number;
        cash_out_ratio: number;
        digital_ratio: number;
      }>(
        `SELECT 
          AVG(average_balance) as avg_balance,
          AVG(cash_out_amount) / NULLIF(AVG(total_spent), 0) as cash_out_ratio,
          AVG(merchant_payment_amount + p2p_transfer_amount) / NULLIF(AVG(total_spent), 0) as digital_ratio
        FROM user_behavior_analytics
        WHERE user_id = $1
          AND date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY user_id`,
        [survey.userId]
      );

      const metadata: Record<string, any> = {};
      if (userAnalytics.length > 0) {
        metadata.wallet_balance = userAnalytics[0].avg_balance;
        metadata.cash_out_ratio = userAnalytics[0].cash_out_ratio;
        metadata.digital_ratio = userAnalytics[0].digital_ratio;
      }

      const result = await query<{ id: string }>(
        `INSERT INTO feature_interest_surveys (
          user_id, survey_type, feature_name, interest_level, would_use, concerns, suggestions, channel, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, feature_name) 
        DO UPDATE SET
          interest_level = EXCLUDED.interest_level,
          would_use = EXCLUDED.would_use,
          concerns = EXCLUDED.concerns,
          suggestions = EXCLUDED.suggestions,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        RETURNING id`,
        [
          survey.userId,
          this.getSurveyType(survey.featureName),
          survey.featureName,
          survey.interestLevel || null,
          survey.wouldUse,
          survey.concerns || null,
          survey.suggestions || null,
          survey.channel,
          JSON.stringify(metadata),
        ]
      );

      if (result.length === 0) {
        throw new Error('Failed to save feature interest survey');
      }

      logger.info(`Feature interest survey saved: ${result[0].id}`);
      return result[0].id;
    } catch (error: any) {
      logger.error('Error submitting feature interest survey:', error);
      throw error;
    }
  }

  /**
   * Submit periodic survey
   */
  async submitPeriodicSurvey(survey: PeriodicSurvey): Promise<string> {
    try {
      const result = await query<{ id: string }>(
        `INSERT INTO periodic_surveys (
          user_id, survey_period, period_start, period_end, questions, completed, completed_at, channel
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id, survey_period, period_start)
        DO UPDATE SET
          questions = EXCLUDED.questions,
          completed = EXCLUDED.completed,
          completed_at = EXCLUDED.completed_at,
          updated_at = NOW()
        RETURNING id`,
        [
          survey.userId,
          survey.surveyPeriod,
          survey.periodStart.toISOString().split('T')[0],
          survey.periodEnd.toISOString().split('T')[0],
          JSON.stringify(survey.questions),
          true,
          new Date().toISOString(),
          survey.channel,
        ]
      );

      if (result.length === 0) {
        throw new Error('Failed to save periodic survey');
      }

      // Credit incentive (N$5-10) if survey completed
      if (survey.channel === 'sms' || survey.channel === 'ussd') {
        await this.creditSurveyIncentive(survey.userId, 5); // N$5 for SMS/USSD
      } else {
        await this.creditSurveyIncentive(survey.userId, 10); // N$10 for app
      }

      logger.info(`Periodic survey saved: ${result[0].id}`);
      return result[0].id;
    } catch (error: any) {
      logger.error('Error submitting periodic survey:', error);
      throw error;
    }
  }

  /**
   * Credit survey incentive to user wallet
   */
  private async creditSurveyIncentive(userId: string, amount: number): Promise<void> {
    try {
      // Get user's main wallet
      const wallets = await query<{ id: string }>(
        `SELECT id FROM wallets WHERE user_id = $1 AND is_default = TRUE LIMIT 1`,
        [userId]
      );

      if (wallets.length === 0) {
        logger.warn(`No default wallet found for user ${userId}, cannot credit survey incentive`);
        return;
      }

      const walletId = wallets[0].id;

      // Credit to wallet
      await query(
        `UPDATE wallets 
         SET balance = balance + $1,
             available_balance = available_balance + $1,
             updated_at = NOW()
         WHERE id = $2`,
        [amount, walletId]
      );

      // Create transaction record
      await query(
        `INSERT INTO transactions (
          user_id, wallet_id, type, amount, status, description
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          walletId,
          'credit',
          amount,
          'completed',
          `Survey incentive - ${amount}`,
        ]
      );

      // Update survey incentive flag
      await query(
        `UPDATE periodic_surveys
         SET incentive_credited = TRUE,
             incentive_amount = $1,
             updated_at = NOW()
         WHERE user_id = $2
           AND completed = TRUE
           AND incentive_credited = FALSE
         ORDER BY completed_at DESC
         LIMIT 1`,
        [amount, userId]
      );

      logger.info(`Survey incentive credited: N$${amount} to user ${userId}`);
    } catch (error: any) {
      logger.error('Error crediting survey incentive:', error);
      // Don't throw - incentive failure shouldn't block survey submission
    }
  }

  /**
   * Get survey type from feature name
   */
  private getSurveyType(featureName: string): string {
    const mapping: Record<string, string> = {
      'Savings Account': 'savings',
      'Micro-Loans': 'credit',
      'Recurring Payments': 'recurring_payments',
      'Emergency Funds': 'emergency_funds',
      'Family Management': 'family_management',
    };
    return mapping[featureName] || 'general';
  }

  /**
   * Get feedback analytics for a date
   */
  async getFeedbackAnalytics(date: Date): Promise<{
    totalFeedback: number;
    averageSatisfaction: number;
    responseRate: number;
    featureInterest: Record<string, number>;
  }> {
    const dateStr = date.toISOString().split('T')[0];

    // Get feedback stats
    const feedbackStats = await query<{
      total: number;
      avg_score: number;
    }>(
      `SELECT 
        COUNT(*)::INTEGER as total,
        AVG(satisfaction_score) as avg_score
      FROM beneficiary_feedback
      WHERE DATE(created_at) = $1`,
      [dateStr]
    );

    // Get feature interest stats
    const featureInterest = await query<{
      feature_name: string;
      would_use_count: number;
      total_count: number;
    }>(
      `SELECT 
        feature_name,
        COUNT(*) FILTER (WHERE would_use = TRUE)::INTEGER as would_use_count,
        COUNT(*)::INTEGER as total_count
      FROM feature_interest_surveys
      WHERE DATE(created_at) = $1
      GROUP BY feature_name`,
      [dateStr]
    );

    // Calculate response rate (users who provided feedback / total active users)
    const activeUsers = await query<{ count: number }>(
      `SELECT COUNT(DISTINCT user_id)::INTEGER as count
       FROM transactions
       WHERE DATE(created_at) = $1`,
      [dateStr]
    );

    const totalFeedback = feedbackStats[0]?.total || 0;
    const totalActiveUsers = activeUsers[0]?.count || 0;
    const responseRate = totalActiveUsers > 0 ? (totalFeedback / totalActiveUsers) * 100 : 0;

    const featureInterestMap: Record<string, number> = {};
    for (const item of featureInterest) {
      const interestRate = item.total_count > 0 
        ? (item.would_use_count / item.total_count) * 100 
        : 0;
      featureInterestMap[item.feature_name] = interestRate;
    }

    return {
      totalFeedback,
      averageSatisfaction: parseFloat(feedbackStats[0]?.avg_score?.toString() || '0'),
      responseRate,
      featureInterest: featureInterestMap,
    };
  }

  /**
   * Aggregate daily feedback analytics
   */
  async aggregateDailyFeedbackAnalytics(date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];

    const analytics = await this.getFeedbackAnalytics(date);

    // Get active users count for response rate
    const activeUsers = await query<{ count: number }>(
      `SELECT COUNT(DISTINCT user_id)::INTEGER as count
       FROM transactions
       WHERE DATE(created_at) = $1`,
      [dateStr]
    );

    const totalActiveUsers = activeUsers[0]?.count || 0;

    // Get top pain points and suggestions
    const painPoints = await query<{ text: string; count: number }>(
      `SELECT 
        feedback_text as text,
        COUNT(*)::INTEGER as count
      FROM beneficiary_feedback
      WHERE DATE(created_at) = $1
        AND feedback_text IS NOT NULL
        AND LENGTH(feedback_text) > 10
      GROUP BY feedback_text
      ORDER BY count DESC
      LIMIT 5`,
      [dateStr]
    );

    const suggestions = await query<{ text: string; count: number }>(
      `SELECT 
        suggestions as text,
        COUNT(*)::INTEGER as count
      FROM feature_interest_surveys
      WHERE DATE(created_at) = $1
        AND suggestions IS NOT NULL
        AND LENGTH(suggestions) > 10
      GROUP BY suggestions
      ORDER BY count DESC
      LIMIT 5`,
      [dateStr]
    );

    // Insert or update analytics
    await query(
      `INSERT INTO feedback_analytics (
        date, total_feedback_received, average_satisfaction_score, feedback_response_rate,
        feature_interest_savings, feature_interest_credit, feature_interest_recurring,
        top_pain_points, top_suggestions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (date) DO UPDATE SET
        total_feedback_received = EXCLUDED.total_feedback_received,
        average_satisfaction_score = EXCLUDED.average_satisfaction_score,
        feedback_response_rate = EXCLUDED.feedback_response_rate,
        feature_interest_savings = EXCLUDED.feature_interest_savings,
        feature_interest_credit = EXCLUDED.feature_interest_credit,
        feature_interest_recurring = EXCLUDED.feature_interest_recurring,
        top_pain_points = EXCLUDED.top_pain_points,
        top_suggestions = EXCLUDED.top_suggestions,
        updated_at = NOW()`,
      [
        dateStr,
        analytics.totalFeedback,
        analytics.averageSatisfaction,
        analytics.responseRate,
        analytics.featureInterest['Savings Account'] || 0,
        analytics.featureInterest['Micro-Loans'] || 0,
        analytics.featureInterest['Recurring Payments'] || 0,
        JSON.stringify(painPoints.map(p => ({ text: p.text, count: p.count }))),
        JSON.stringify(suggestions.map(s => ({ text: s.text, count: s.count }))),
      ]
    );
  }

  /**
   * Send periodic survey via SMS/USSD
   */
  async sendPeriodicSurveySMS(userId: string, surveyPeriod: 'monthly' | 'quarterly'): Promise<void> {
    // Get user phone
    const users = await query<{ phone: string }>(
      'SELECT phone FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) return;

    const phone = users[0].phone;
    const periodText = surveyPeriod === 'monthly' ? 'month' : 'quarter';

    const message = `BUFFR: Quick ${periodText}ly survey (3 questions). Reply with 1-5 stars for satisfaction. Earn N$5! Dial *123# → Surveys.`;

    await sendSMS({
      phoneNumber: phone,
      message,
      priority: 'normal',
    });
  }
}

export const beneficiaryFeedbackService = new BeneficiaryFeedbackService();
