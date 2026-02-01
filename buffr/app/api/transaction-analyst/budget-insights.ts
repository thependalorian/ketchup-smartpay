/**
 * Budget Insights API Endpoint
 *
 * Location: app/api/transaction-analyst/budget-insights.ts
 * Purpose: AI-powered budget analysis and recommendations
 *
 * Features:
 * - Analyze spending patterns by category
 * - Compare to user's budget limits
 * - Generate savings recommendations
 * - Calculate budget adherence score
 *
 * Endpoint: POST /api/transaction-analyst/budget-insights
 * Request: { user_id: string, period: 'week' | 'month' }
 * Response: { insights: [...], score: number, recommendations: [...] }
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import logger, { log } from '@/utils/logger';

function jsonResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface CategorySpending {
  category: string;
  amount: number;
  transaction_count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

interface BudgetInsight {
  id: string;
  type: 'overspending' | 'underspending' | 'on_track' | 'opportunity' | 'warning';
  category: string;
  message: string;
  current_spend: number;
  budget_limit?: number;
  percentage_used?: number;
  icon: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  potential_savings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  action_type: 'reduce' | 'optimize' | 'save' | 'invest';
}

interface BudgetInsightsRequest {
  user_id?: string;
  period?: 'week' | 'month';
}

interface BudgetInsightsResponse {
  success: boolean;
  score: number; // 0-100 budget health score
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  period: 'week' | 'month';
  spending_summary: {
    total: number;
    daily_average: number;
    categories: CategorySpending[];
  };
  insights: BudgetInsight[];
  recommendations: Recommendation[];
  comparison: {
    vs_last_period: number;
    vs_last_period_percentage: number;
  };
  generated_at: string;
}

// Default category budgets (can be customized per user)
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

async function postHandler(request: ExpoRequest): Promise<Response> {
  try {
    const userId = await getUserIdFromRequest(request);
    const body: BudgetInsightsRequest = await request.json();
    const period = body.period || 'month';

    if (!userId) {
      return jsonResponse({ error: 'User not authenticated' }, 401);
    }

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
      [userId]
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
      [userId]
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
    const categories: CategorySpending[] = currentSpending.map(c => {
      const categoryKey = c.category.toLowerCase();
      const prevAmount = previousSpending.get(categoryKey) || 0;
      const trendDiff = Number(c.total_amount) - prevAmount;
      const trendPercentage = prevAmount > 0 ? (trendDiff / prevAmount) * 100 : 0;

      return {
        category: c.category,
        amount: Number(c.total_amount),
        transaction_count: Number(c.transaction_count),
        percentage: totalSpent > 0 ? (Number(c.total_amount) / totalSpent) * 100 : 0,
        trend: trendDiff > prevAmount * 0.1 ? 'up' : trendDiff < -prevAmount * 0.1 ? 'down' : 'stable',
        trend_percentage: Math.round(trendPercentage)
      };
    });

    // Generate insights
    const insights: BudgetInsight[] = [];
    let totalBudgetUsed = 0;
    let totalBudgetAllowed = 0;

    for (const cat of categories) {
      const categoryKey = cat.category.toLowerCase();
      const budget = (DEFAULT_MONTHLY_BUDGETS[categoryKey] || DEFAULT_MONTHLY_BUDGETS['other']) * budgetMultiplier;
      const percentageUsed = (cat.amount / budget) * 100;
      
      totalBudgetUsed += cat.amount;
      totalBudgetAllowed += budget;

      if (percentageUsed > 100) {
        insights.push({
          id: `overspend_${cat.category}`,
          type: 'overspending',
          category: cat.category,
          message: `You've exceeded your ${cat.category} budget by N$${Math.round(cat.amount - budget)}`,
          current_spend: cat.amount,
          budget_limit: budget,
          percentage_used: Math.round(percentageUsed),
          icon: 'exclamation-triangle',
          severity: percentageUsed > 150 ? 'error' : 'warning'
        });
      } else if (percentageUsed > 80) {
        insights.push({
          id: `warning_${cat.category}`,
          type: 'warning',
          category: cat.category,
          message: `You're approaching your ${cat.category} budget limit (${Math.round(percentageUsed)}% used)`,
          current_spend: cat.amount,
          budget_limit: budget,
          percentage_used: Math.round(percentageUsed),
          icon: 'info-circle',
          severity: 'warning'
        });
      } else if (cat.trend === 'up' && cat.trend_percentage > 30) {
        insights.push({
          id: `trend_${cat.category}`,
          type: 'opportunity',
          category: cat.category,
          message: `Your ${cat.category} spending increased by ${Math.round(cat.trend_percentage)}% compared to last ${period}`,
          current_spend: cat.amount,
          percentage_used: Math.round(percentageUsed),
          icon: 'arrow-up',
          severity: 'info'
        });
      } else if (percentageUsed <= 50) {
        insights.push({
          id: `ontrack_${cat.category}`,
          type: 'on_track',
          category: cat.category,
          message: `Great job! Your ${cat.category} spending is well under budget`,
          current_spend: cat.amount,
          budget_limit: budget,
          percentage_used: Math.round(percentageUsed),
          icon: 'check-circle',
          severity: 'success'
        });
      }
    }

    // Sort insights by severity
    const severityOrder = { error: 0, warning: 1, info: 2, success: 3 };
    insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Generate recommendations
    const recommendations: Recommendation[] = [];

    // Find top spending categories for reduction recommendations
    const topSpenders = categories.slice(0, 3);
    for (const cat of topSpenders) {
      if (cat.amount > 500) {
        const potentialSavings = Math.round(cat.amount * 0.15);
        recommendations.push({
          id: `reduce_${cat.category}`,
          title: `Reduce ${cat.category} spending`,
          description: `Consider cutting back 15% on ${cat.category} to save N$${potentialSavings} per ${period}`,
          potential_savings: potentialSavings,
          difficulty: potentialSavings > 500 ? 'hard' : potentialSavings > 200 ? 'medium' : 'easy',
          category: cat.category,
          action_type: 'reduce'
        });
      }
    }

    // Add general savings recommendation
    if (totalSpent > dailyAverage * daysInPeriod * 0.8) {
      recommendations.push({
        id: 'general_savings',
        title: 'Build an emergency fund',
        description: `Save 10% of your income (N$${Math.round(totalSpent * 0.1)}) for unexpected expenses`,
        potential_savings: Math.round(totalSpent * 0.1),
        difficulty: 'medium',
        category: 'savings',
        action_type: 'save'
      });
    }

    // Subscription audit recommendation if subscriptions detected
    const subscriptionSpend = categories.find(c => c.category.toLowerCase().includes('subscription'));
    if (subscriptionSpend && subscriptionSpend.amount > 300) {
      recommendations.push({
        id: 'audit_subscriptions',
        title: 'Audit your subscriptions',
        description: `You're spending N$${Math.round(subscriptionSpend.amount)} on subscriptions. Review and cancel unused ones.`,
        potential_savings: Math.round(subscriptionSpend.amount * 0.3),
        difficulty: 'easy',
        category: 'subscriptions',
        action_type: 'optimize'
      });
    }

    // Calculate budget health score (0-100)
    const budgetRatio = totalBudgetAllowed > 0 ? totalBudgetUsed / totalBudgetAllowed : 1;
    let score = Math.max(0, Math.min(100, Math.round((1 - (budgetRatio - 1) * 2) * 100)));
    
    // Adjust score based on trends
    const avgTrend = categories.reduce((sum, c) => sum + c.trend_percentage, 0) / (categories.length || 1);
    if (avgTrend > 20) score = Math.max(0, score - 10);
    if (avgTrend < -10) score = Math.min(100, score + 5);

    // Calculate grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    logger.info(`Generated budget insights for user ${userId}: score=${score}, grade=${grade}`);

    return jsonResponse({
      success: true,
      score,
      grade,
      period,
      spending_summary: {
        total: Math.round(totalSpent * 100) / 100,
        daily_average: Math.round(dailyAverage * 100) / 100,
        categories: categories.map(c => ({
          ...c,
          amount: Math.round(c.amount * 100) / 100,
          percentage: Math.round(c.percentage * 100) / 100
        }))
      },
      insights: insights.slice(0, 10),
      recommendations: recommendations.slice(0, 5),
      comparison: {
        vs_last_period: Math.round((totalSpent - previousTotal) * 100) / 100,
        vs_last_period_percentage: previousTotal > 0 
          ? Math.round(((totalSpent - previousTotal) / previousTotal) * 100) 
          : 0
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    log.error('Error generating budget insights:', error);
    return jsonResponse(
      { error: error.message || 'Failed to generate budget insights' },
      500
    );
  }
}

async function getHandler(request: ExpoRequest): Promise<Response> {
  // For GET requests, default to monthly period
  try {
    const url = new URL(request.url);
    const period = (url.searchParams.get('period') as 'week' | 'month') || 'month';

    // Call POST handler logic with period
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return jsonResponse({ error: 'User not authenticated' }, 401);
    }

    // Reuse POST handler logic by creating a request object with the period in body
    // This is intentional code reuse, not a mock - we're adapting the GET request to call POST handler
    const body = { period };
    const adaptedRequest = {
      ...request,
      json: async () => body,
    } as ExpoRequest;

    return postHandler(adaptedRequest);
  } catch (error: any) {
    return jsonResponse(
      { error: error.message || 'Failed to get budget insights' },
      500
    );
  }
}

// Apply security wrappers with API rate limits
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
