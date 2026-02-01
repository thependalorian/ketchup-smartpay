/**
 * Open Banking API: /api/v1/companion/suggestions
 * 
 * AI-powered predictive payment suggestions (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

/**
 * POST /api/v1/companion/suggestions
 * Get payment suggestions
 */
async function handleSuggestions(req: ExpoRequest) {
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
    const limit = Data?.Limit || 10;

    // Analyze transaction history (last 90 days)
    const transactionsResult = await query<{
      id: string;
      type: string;
      amount: number;
      recipient_id: string;
      recipient_name: string;
      category: string;
      date: string;
      description: string;
    }>(
      `SELECT id, type, amount, recipient_id, recipient_name, category, date, description
       FROM transactions
       WHERE user_id = $1 
         AND date >= NOW() - INTERVAL '90 days'
         AND type IN ('sent', 'payment')
       ORDER BY date DESC`,
      [actualUserId]
    );

    const transactions = transactionsResult;
    const suggestions: any[] = [];

    // Pattern 1: Detect recurring payments
    const recipientMap = new Map<string, {
      name: string;
      payments: { amount: number; date: Date; category: string }[];
    }>();

    for (const tx of transactions) {
      const key = tx.recipient_id || tx.recipient_name;
      if (!recipientMap.has(key)) {
        recipientMap.set(key, {
          name: tx.recipient_name || 'Unknown',
          payments: []
        });
      }
      recipientMap.get(key)!.payments.push({
        amount: tx.amount,
        date: new Date(tx.date),
        category: tx.category || 'Other'
      });
    }

    // Analyze each recipient for patterns
    for (const [recipientId, data] of recipientMap) {
      if (data.payments.length < 2) continue;

      data.payments.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Check for monthly patterns
      if (data.payments.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < data.payments.length; i++) {
          const daysDiff = Math.floor(
            (data.payments[i].date.getTime() - data.payments[i-1].date.getTime()) / (1000 * 60 * 60 * 24)
          );
          intervals.push(daysDiff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((acc, val) => acc + Math.abs(val - avgInterval), 0) / intervals.length;

        if (variance < 7) {
          const avgAmount = data.payments.reduce((a, b) => a + b.amount, 0) / data.payments.length;
          const lastPayment = data.payments[data.payments.length - 1];
          const nextDate = new Date(lastPayment.date);
          nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

          let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
          if (avgInterval <= 1) frequency = 'daily';
          else if (avgInterval <= 10) frequency = 'weekly';
          else if (avgInterval <= 40) frequency = 'monthly';
          else frequency = 'yearly';

          const confidence = Math.min(0.95, (1 - variance / avgInterval) * (Math.min(data.payments.length, 5) / 5));

          if (confidence > 0.5 && nextDate > new Date()) {
            suggestions.push({
              SuggestionId: `recurring_${recipientId}_${Date.now()}`,
              Type: 'recurring',
              Recipient: {
                Id: recipientId,
                Name: data.name
              },
              Amount: Math.round(avgAmount * 100) / 100,
              Confidence: Math.round(confidence * 100) / 100,
              Reason: `You typically pay ${data.name} ${frequency}. Next payment predicted based on ${data.payments.length} previous transactions.`,
              Category: lastPayment.category,
              SuggestedDate: nextDate.toISOString().split('T')[0],
              Frequency: frequency,
              LastPaymentDate: lastPayment.date.toISOString().split('T')[0],
              Priority: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low'
            });
          }
        }
      }
    }

    // Sort by priority and confidence
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => {
      if (priorityOrder[a.Priority as keyof typeof priorityOrder] !== priorityOrder[b.Priority as keyof typeof priorityOrder]) {
        return priorityOrder[a.Priority as keyof typeof priorityOrder] - priorityOrder[b.Priority as keyof typeof priorityOrder];
      }
      return b.Confidence - a.Confidence;
    });

    // Limit results
    const limitedSuggestions = suggestions.slice(0, limit);

    const suggestionsResponse = {
      Data: {
        Suggestions: limitedSuggestions,
        GeneratedDateTime: new Date().toISOString(),
        Analysis: {
          TotalTransactionsAnalyzed: transactions.length,
          PatternsDetected: suggestions.length,
          TimePeriodDays: 90,
        },
      },
      Links: {
        Self: '/api/v1/companion/suggestions',
      },
      Meta: {},
    };

    return helpers.success(
      suggestionsResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error generating suggestions:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while generating suggestions',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleSuggestions,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const GET = openBankingSecureRoute(
  handleSuggestions,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
