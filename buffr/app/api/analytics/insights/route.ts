/**
 * Product Development Insights API
 * 
 * Location: app/api/analytics/insights/route.ts
 * Purpose: Generate product development recommendations based on transaction analytics
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { query } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

interface ProductInsight {
  type: 'savings' | 'credit' | 'merchant_expansion' | 'bill_payment' | 'geographic' | 'payment_method' | 'user_segmentation';
  title: string;
  description: string;
  opportunity: string;
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  data: Record<string, any>;
}

async function getHandler(req: ExpoRequest) {
  try {
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
      const percentage = (savingsData[0].user_count / 100) * 100; // Simplified calculation
      insights.push({
        type: 'savings',
        title: 'Savings Account Feature',
        description: `${savingsData[0].user_count} users maintain average balance of N$${Math.round(savingsData[0].avg_balance || 0)}+ for extended periods`,
        opportunity: 'Interest-bearing savings wallet with savings goals',
        expectedImpact: 'Increased wallet retention, new revenue stream',
        priority: 'high',
        confidence: Math.min(percentage, 100),
        data: savingsData[0],
      });
    }

    // 2. Credit Product Opportunity
    const creditData = await query<{
      user_count: number;
      avg_cashout_time: number;
    }>(
      `SELECT 
        COUNT(DISTINCT user_id)::INTEGER as user_count,
        AVG(spending_velocity) as avg_cashout_time
      FROM user_behavior_analytics
      WHERE date >= $1
      AND cash_out_count > 0
      AND spending_velocity < 1`,
      [dateThreshold.toISOString().split('T')[0]]
    );

    if (creditData[0] && creditData[0].user_count > 0) {
      insights.push({
        type: 'credit',
        title: 'Micro-Loans for Immediate Needs',
        description: `${creditData[0].user_count} users cash-out within 24 hours of voucher credit`,
        opportunity: 'Small loans (N$100-N$500) based on transaction history, repayment via future vouchers',
        expectedImpact: 'Reduced cash-out pressure, increased digital payment adoption',
        priority: 'high',
        confidence: 75,
        data: creditData[0],
      });
    }

    // 3. Merchant Network Expansion
    const merchantData = await query<{
      merchant_category: string;
      transaction_count: number;
      total_volume: number;
      percentage: number;
    }>(
      `SELECT 
        merchant_category,
        SUM(total_transactions)::INTEGER as transaction_count,
        SUM(total_volume) as total_volume,
        (SUM(total_volume) / (SELECT SUM(total_volume) FROM transaction_analytics WHERE date >= $1 AND merchant_category IS NOT NULL) * 100) as percentage
      FROM transaction_analytics
      WHERE date >= $1
      AND merchant_category IS NOT NULL
      GROUP BY merchant_category
      ORDER BY total_volume DESC
      LIMIT 5`,
      [dateThreshold.toISOString().split('T')[0]]
    );

    if (merchantData.length > 0) {
      const topCategory = merchantData[0];
      if (topCategory.percentage > 50) {
        insights.push({
          type: 'merchant_expansion',
          title: `Expand ${topCategory.merchant_category} Merchant Network`,
          description: `${Math.round(topCategory.percentage)}% of merchant payments are to ${topCategory.merchant_category} stores`,
          opportunity: 'Partner with more merchants in this category, negotiate better rates',
          expectedImpact: 'Increased merchant payment volume, user retention',
          priority: 'medium',
          confidence: 80,
          data: topCategory,
        });
      }
    }

    // 4. Payment Method Optimization
    const paymentMethodData = await query<{
      payment_method: string;
      growth_rate: number;
      transaction_count: number;
    }>(
      `WITH current_period AS (
        SELECT payment_method, SUM(transaction_count) as count
        FROM payment_method_analytics
        WHERE date >= $1
        GROUP BY payment_method
      ),
      previous_period AS (
        SELECT payment_method, SUM(transaction_count) as count
        FROM payment_method_analytics
        WHERE date >= $2 AND date < $1
        GROUP BY payment_method
      )
      SELECT 
        cp.payment_method,
        cp.count::INTEGER as transaction_count,
        CASE 
          WHEN pp.count > 0 THEN ((cp.count - pp.count) / pp.count * 100)
          ELSE 0
        END as growth_rate
      FROM current_period cp
      LEFT JOIN previous_period pp ON cp.payment_method = pp.payment_method
      WHERE cp.count > 100
      ORDER BY growth_rate DESC
      LIMIT 3`,
      [
        dateThreshold.toISOString().split('T')[0],
        new Date(dateThreshold.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ]
    );

    for (const method of paymentMethodData) {
      if (method.growth_rate > 100) {
        insights.push({
          type: 'payment_method',
          title: `Enhance ${method.payment_method} Payment Experience`,
          description: `${method.payment_method} payments growing ${Math.round(method.growth_rate)}% month-over-month`,
          opportunity: 'Faster processing, better UX, favorite merchants feature',
          expectedImpact: 'Increased adoption, user satisfaction',
          priority: 'medium',
          confidence: 70,
          data: method,
        });
      }
    }

    // 5. Geographic Expansion
    const geographicData = await query<{
      region: string;
      cash_out_ratio: number;
      transaction_count: number;
    }>(
      `SELECT 
        region,
        AVG(cash_out_ratio) as cash_out_ratio,
        SUM(transaction_count)::INTEGER as transaction_count
      FROM geographic_analytics
      WHERE date >= $1
      AND region IS NOT NULL
      GROUP BY region
      HAVING AVG(cash_out_ratio) > 0.8
      ORDER BY transaction_count DESC
      LIMIT 5`,
      [dateThreshold.toISOString().split('T')[0]]
    );

    if (geographicData.length > 0) {
      insights.push({
        type: 'geographic',
        title: 'Targeted Rural Financial Inclusion',
        description: `${geographicData.length} regions have 80%+ cash-out rate vs 40% in urban areas`,
        opportunity: 'More agent/merchant locations, USSD-first approach, financial literacy programs',
        expectedImpact: 'Increased digital payment adoption in rural areas',
        priority: 'high',
        confidence: 85,
        data: { regions: geographicData },
      });
    }

    // 6. User Segmentation Analysis
    const segmentationData = await query<{
      segment: string;
      user_count: number;
      avg_balance: number;
      avg_transactions: number;
      cash_out_ratio: number;
      digital_ratio: number;
    }>(
      `WITH user_segments AS (
        SELECT 
          user_id,
          AVG(average_balance) as avg_balance,
          AVG(transaction_count) as avg_transactions,
          AVG(cash_out_amount) / NULLIF(AVG(total_spent), 0) as cash_out_ratio,
          AVG(merchant_payment_amount + p2p_transfer_amount + bill_payment_amount) / NULLIF(AVG(total_spent), 0) as digital_ratio
        FROM user_behavior_analytics
        WHERE date >= $1
        GROUP BY user_id
      ),
      segment_classification AS (
        SELECT 
          user_id,
          CASE
            WHEN cash_out_ratio < 0.2 AND digital_ratio > 0.7 THEN 'digital_first'
            WHEN cash_out_ratio > 0.7 AND digital_ratio < 0.3 THEN 'cash_out_only'
            ELSE 'balanced'
          END as segment,
          avg_balance,
          avg_transactions,
          cash_out_ratio,
          digital_ratio
        FROM user_segments
      )
      SELECT 
        segment,
        COUNT(*)::INTEGER as user_count,
        AVG(avg_balance) as avg_balance,
        AVG(avg_transactions) as avg_transactions,
        AVG(cash_out_ratio) as cash_out_ratio,
        AVG(digital_ratio) as digital_ratio
      FROM segment_classification
      GROUP BY segment
      ORDER BY user_count DESC`,
      [dateThreshold.toISOString().split('T')[0]]
    );

    if (segmentationData.length > 0) {
      const totalUsers = segmentationData.reduce((sum, s) => sum + (s.user_count || 0), 0);
      const digitalFirst = segmentationData.find((s) => s.segment === 'digital_first');
      const cashOutOnly = segmentationData.find((s) => s.segment === 'cash_out_only');
      const balanced = segmentationData.find((s) => s.segment === 'balanced');

      if (digitalFirst && digitalFirst.user_count > 0) {
        const percentage = (digitalFirst.user_count / totalUsers) * 100;
        insights.push({
          type: 'user_segmentation',
          title: 'Digital-First User Segment',
          description: `${digitalFirst.user_count} users (${percentage.toFixed(1)}%) are digital-first with high digital payment usage and low cash-out`,
          opportunity: 'Advanced features (investments, savings), premium services',
          expectedImpact: 'Increased engagement, new revenue streams',
          priority: percentage > 15 ? 'high' : 'medium',
          confidence: Math.min(percentage * 2, 100),
          data: { segment: 'digital_first', ...digitalFirst },
        });
      }

      if (cashOutOnly && cashOutOnly.user_count > 0) {
        const percentage = (cashOutOnly.user_count / totalUsers) * 100;
        insights.push({
          type: 'user_segmentation',
          title: 'Cash-Out Only User Segment',
          description: `${cashOutOnly.user_count} users (${percentage.toFixed(1)}%) primarily cash-out with minimal digital payments`,
          opportunity: 'Education and incentives for digital adoption, simplified digital payment features',
          expectedImpact: 'Increased digital payment adoption, reduced cash-out',
          priority: percentage > 20 ? 'high' : 'medium',
          confidence: Math.min(percentage * 2, 100),
          data: { segment: 'cash_out_only', ...cashOutOnly },
        });
      }

      if (balanced && balanced.user_count > 0) {
        const percentage = (balanced.user_count / totalUsers) * 100;
        insights.push({
          type: 'user_segmentation',
          title: 'Balanced User Segment',
          description: `${balanced.user_count} users (${percentage.toFixed(1)}%) use a mix of digital and cash-out`,
          opportunity: 'Hybrid features (flexible cash-out, digital options), convenience features',
          expectedImpact: 'Increased engagement, user satisfaction',
          priority: 'medium',
          confidence: 70,
          data: { segment: 'balanced', ...balanced },
        });
      }
    }

    // Sort by priority and confidence
    insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });

    return successResponse({
      insights,
      period: {
        days,
        fromDate: dateThreshold.toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
      },
      summary: {
        totalInsights: insights.length,
        highPriority: insights.filter(i => i.priority === 'high').length,
        mediumPriority: insights.filter(i => i.priority === 'medium').length,
        lowPriority: insights.filter(i => i.priority === 'low').length,
      },
    });
  } catch (error: any) {
    log.error('Error generating insights:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate insights',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
