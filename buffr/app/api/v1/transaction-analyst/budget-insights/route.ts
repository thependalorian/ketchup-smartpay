/**
 * Open Banking API: /api/v1/transaction-analyst/budget-insights
 * 
 * AI-powered budget analysis and recommendations (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

const DEFAULT_MONTHLY_BUDGETS: Record<string, number> = {
  'food': 3000,
  'transport': 2000,
  'shopping': 2000,
  'entertainment': 1500,
  'utilities': 2500,
  'health': 1500,
  'groceries': 3500,
  'dining': 2000,
  'subscriptions': 500,
  'rent': 8000,
  'education': 1500,
  'other': 2000
};

/**
 * POST /api/v1/transaction-analyst/budget-insights
 * Generate budget insights
 */
async function handleBudgetInsights(req: ExpoRequest) {
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

    const body = await req.json();
    const { Data } = body;
    const period = Data?.Period || 'month';

    const daysInPeriod = period === 'week' ? 7 : 30;
    const budgetMultiplier = period === 'week' ? 7/30 : 1;

    // Get current period transactions
    const currentPeriodResult = await query<{
      category: string;
      total_amount: number;
      transaction_count: number;
    }>(
      `SELECT 
        COALESCE(category, 'other') as category,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
       FROM transactions
       WHERE user_id = $1 
         AND date >= NOW() - INTERVAL '${daysInPeriod} days'
         AND type IN ('sent', 'payment')
       GROUP BY category
       ORDER BY total_amount DESC`,
      [actualUserId]
    );

    // Get previous period transactions for comparison
    const previousPeriodResult = await query<{
      category: string;
      total_amount: number;
    }>(
      `SELECT 
        COALESCE(category, 'other') as category,
        SUM(amount) as total_amount
       FROM transactions
       WHERE user_id = $1 
         AND date >= NOW() - INTERVAL '${daysInPeriod * 2} days'
         AND date < NOW() - INTERVAL '${daysInPeriod} days'
         AND type IN ('sent', 'payment')
       GROUP BY category`,
      [actualUserId]
    );

    const currentSpending = currentPeriodResult;
    const previousSpending = new Map(
      previousPeriodResult.map(r => [r.category.toLowerCase(), r.total_amount])
    );

    // Calculate totals
    const totalSpent = currentSpending.reduce((sum, c) => sum + Number(c.total_amount), 0);
    const previousTotal = Array.from(previousSpending.values()).reduce((a, b) => a + Number(b), 0);
    const dailyAverage = totalSpent / daysInPeriod;

    // Calculate category spending with trends
    const categories = currentSpending.map(c => {
      const categoryKey = c.category.toLowerCase();
      const prevAmount = previousSpending.get(categoryKey) || 0;
      const trendDiff = Number(c.total_amount) - prevAmount;
      const trendPercentage = prevAmount > 0 ? (trendDiff / prevAmount) * 100 : 0;

      return {
        Category: c.category,
        Amount: Math.round(Number(c.total_amount) * 100) / 100,
        TransactionCount: Number(c.transaction_count),
        Percentage: totalSpent > 0 ? Math.round((Number(c.total_amount) / totalSpent) * 100 * 100) / 100 : 0,
        Trend: trendDiff > prevAmount * 0.1 ? 'up' : trendDiff < -prevAmount * 0.1 ? 'down' : 'stable',
        TrendPercentage: Math.round(trendPercentage),
      };
    });

    // Calculate budget health score
    let totalBudgetUsed = 0;
    let totalBudgetAllowed = 0;

    for (const cat of categories) {
      const categoryKey = cat.Category.toLowerCase();
      const budget = (DEFAULT_MONTHLY_BUDGETS[categoryKey] || DEFAULT_MONTHLY_BUDGETS['other']) * budgetMultiplier;
      totalBudgetUsed += cat.Amount;
      totalBudgetAllowed += budget;
    }

    const budgetRatio = totalBudgetAllowed > 0 ? totalBudgetUsed / totalBudgetAllowed : 1;
    let score = Math.max(0, Math.min(100, Math.round((1 - (budgetRatio - 1) * 2) * 100)));

    // Calculate grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    const insightsResponse = {
      Data: {
        Score: score,
        Grade: grade,
        Period: period,
        SpendingSummary: {
          Total: Math.round(totalSpent * 100) / 100,
          DailyAverage: Math.round(dailyAverage * 100) / 100,
          Categories: categories,
        },
        Comparison: {
          VsLastPeriod: Math.round((totalSpent - previousTotal) * 100) / 100,
          VsLastPeriodPercentage: previousTotal > 0 
            ? Math.round(((totalSpent - previousTotal) / previousTotal) * 100) 
            : 0,
        },
        GeneratedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/transaction-analyst/budget-insights',
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
    log.error('Error generating budget insights:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while generating budget insights',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleBudgetInsights,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const GET = openBankingSecureRoute(
  handleBudgetInsights,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
