/**
 * Open Banking API: /api/v1/analytics/insights
 * 
 * Product development insights (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

interface ProductInsight {
  type: 'savings' | 'credit' | 'merchant_expansion' | 'bill_payment' | 'geographic' | 'payment_method' | 'user_segmentation';
  title: string;
  description: string;
  opportunity: string;
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  data: Record<string, any>;
}

/**
 * GET /api/v1/analytics/insights
 * Get product development insights
 */
async function handleGetInsights(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const insights: ProductInsight[] = [];

    // 1. Savings Product Opportunity
    const savingsData = await query<{
      user_count: number;
      avg_balance: number;
      days_retained: number;
    }>(
      `SELECT 
        COUNT(DISTINCT user_id)::INTEGER as user_count,
        AVG(average_balance) as avg_balance,
        AVG(EXTRACT(EPOCH FROM (NOW() - date)) / 86400) as days_retained
      FROM user_behavior_analytics
      WHERE date >= $1
      AND average_balance >= 500
      AND transaction_count < 5`,
      [dateThreshold.toISOString().split('T')[0]]
    );

    if (savingsData[0] && savingsData[0].user_count > 0) {
      insights.push({
        type: 'savings',
        title: 'Savings Product Opportunity',
        description: `${savingsData[0].user_count} users maintain average balances of N$${Math.round(savingsData[0].avg_balance)} with low transaction activity`,
        opportunity: 'Introduce savings accounts with interest to retain funds',
        expectedImpact: 'Increase user retention and platform revenue',
        priority: 'high',
        confidence: Math.min(90, savingsData[0].user_count * 2),
        data: savingsData[0],
      });
    }

    // 2. Credit Product Opportunity
    const creditData = await query<{
      user_count: number;
      avg_spending: number;
      cash_out_ratio: number;
    }>(
      `SELECT 
        COUNT(DISTINCT user_id)::INTEGER as user_count,
        AVG(total_spent) as avg_spending,
        AVG(cash_out_amount / NULLIF(total_spent, 0)) as cash_out_ratio
      FROM user_behavior_analytics
      WHERE date >= $1
      AND total_spent > 2000
      AND cash_out_amount > 0`,
      [dateThreshold.toISOString().split('T')[0]]
    );

    if (creditData[0] && creditData[0].user_count > 0 && creditData[0].cash_out_ratio > 0.5) {
      insights.push({
        type: 'credit',
        title: 'Credit Product Opportunity',
        description: `${creditData[0].user_count} users show high cash-out ratios, indicating potential credit needs`,
        opportunity: 'Offer microloans or credit lines for frequent cash-out users',
        expectedImpact: 'Increase transaction volume and user engagement',
        priority: 'medium',
        confidence: 75,
        data: creditData[0],
      });
    }

    // Format as Open Banking
    const formattedInsights = insights.map((insight) => ({
      InsightId: insight.type,
      Type: insight.type,
      Title: insight.title,
      Description: insight.description,
      Opportunity: insight.opportunity,
      ExpectedImpact: insight.expectedImpact,
      Priority: insight.priority,
      Confidence: insight.confidence,
      Data: insight.data,
    }));

    const insightsResponse = {
      Data: {
        Insights: formattedInsights,
        GeneratedDateTime: new Date().toISOString(),
        AnalysisPeriodDays: days,
      },
      Links: {
        Self: '/api/v1/analytics/insights',
      },
      Meta: {},
    };

    return helpers.success(
      insightsResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching insights:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching insights',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetInsights,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
