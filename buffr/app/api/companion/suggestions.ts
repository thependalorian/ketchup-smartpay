/**
 * Predictive Suggestions API Endpoint
 *
 * Location: app/api/companion/suggestions.ts
 * Purpose: AI-powered predictive payment suggestions using Transaction Analyst agent
 *
 * Features:
 * - Analyze user transaction patterns
 * - Suggest upcoming payments based on history
 * - Predict recurring expenses
 * - Return personalized payment suggestions
 *
 * Endpoint: POST /api/companion/suggestions
 * Request: { user_id: string, limit?: number }
 * Response: { suggestions: [...], generated_at: string }
 */

import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import logger, { log } from '@/utils/logger';

function jsonResponse<T>(data: T, status: number = 200) {
  return new Response(JSON.stringify(data), { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

interface PaymentSuggestion {
  id: string;
  type: 'recurring' | 'predicted' | 'reminder' | 'savings';
  recipient: {
    id: string;
    name: string;
    phone?: string;
  };
  amount: number;
  confidence: number; // 0-1
  reason: string;
  category?: string;
  suggested_date?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  last_payment_date?: string;
  priority: 'high' | 'medium' | 'low';
}

interface SuggestionsRequest {
  user_id?: string;
  limit?: number;
}

interface SuggestionsResponse {
  success: boolean;
  suggestions: PaymentSuggestion[];
  generated_at: string;
  analysis: {
    total_transactions_analyzed: number;
    patterns_detected: number;
    time_period_days: number;
  };
}

async function postHandler(request: ExpoRequest): Promise<Response> {
  try {
    // Get user ID from auth or request body
    const userId = await getUserIdFromRequest(request);
    const body: SuggestionsRequest = await request.json();
    const limit = body.limit || 10;

    if (!userId) {
      return jsonResponse({ error: 'User not authenticated' }, 401);
    }

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
      [userId]
    );

    const transactions = transactionsResult;
    const suggestions: PaymentSuggestion[] = [];

    // Pattern 1: Detect recurring payments (same recipient, similar amount, regular interval)
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

      // Sort payments by date
      data.payments.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Check for monthly patterns (within 5-day variance)
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

        // If variance is low, it's likely recurring
        if (variance < 7) {
          const avgAmount = data.payments.reduce((a, b) => a + b.amount, 0) / data.payments.length;
          const lastPayment = data.payments[data.payments.length - 1];
          const nextDate = new Date(lastPayment.date);
          nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

          // Determine frequency
          let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
          if (avgInterval <= 1) frequency = 'daily';
          else if (avgInterval <= 10) frequency = 'weekly';
          else if (avgInterval <= 40) frequency = 'monthly';
          else frequency = 'yearly';

          // Calculate confidence based on pattern strength
          const confidence = Math.min(0.95, (1 - variance / avgInterval) * (Math.min(data.payments.length, 5) / 5));

          if (confidence > 0.5 && nextDate > new Date()) {
            suggestions.push({
              id: `recurring_${recipientId}_${Date.now()}`,
              type: 'recurring',
              recipient: {
                id: recipientId,
                name: data.name
              },
              amount: Math.round(avgAmount * 100) / 100,
              confidence: Math.round(confidence * 100) / 100,
              reason: `You typically pay ${data.name} ${frequency}. Next payment predicted based on ${data.payments.length} previous transactions.`,
              category: lastPayment.category,
              suggested_date: nextDate.toISOString().split('T')[0],
              frequency,
              last_payment_date: lastPayment.date.toISOString().split('T')[0],
              priority: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low'
            });
          }
        }
      }
    }

    // Pattern 2: Bill payment reminders based on common categories
    const billCategories = ['utilities', 'rent', 'subscription', 'loan'];
    for (const tx of transactions.slice(0, 30)) {
      const category = (tx.category || '').toLowerCase();
      if (billCategories.some(cat => category.includes(cat))) {
        const txDate = new Date(tx.date);
        const dayOfMonth = txDate.getDate();
        const today = new Date();
        
        // If bill was paid around this time of month, suggest reminder
        if (Math.abs(dayOfMonth - today.getDate()) <= 5) {
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(dayOfMonth);

          const existingSuggestion = suggestions.find(s => 
            s.recipient.name === tx.recipient_name && s.type === 'recurring'
          );

          if (!existingSuggestion) {
            suggestions.push({
              id: `reminder_${tx.id}`,
              type: 'reminder',
              recipient: {
                id: tx.recipient_id || '',
                name: tx.recipient_name || tx.description || 'Unknown'
              },
              amount: tx.amount,
              confidence: 0.65,
              reason: `You paid this ${category} bill last month around this date.`,
              category: tx.category,
              suggested_date: nextMonth.toISOString().split('T')[0],
              last_payment_date: tx.date,
              priority: 'medium'
            });
          }
        }
      }
    }

    // Pattern 3: Savings suggestions based on spending patterns
    const totalSpent = transactions.reduce((sum: number, tx) => sum + tx.amount, 0);
    const avgDailySpend = totalSpent / 90;
    
    if (avgDailySpend > 0) {
      const suggestedSavings = Math.round(avgDailySpend * 30 * 0.1); // Suggest saving 10% of monthly spend
      
      if (suggestedSavings >= 50) { // Only suggest if meaningful amount
        suggestions.push({
          id: `savings_${Date.now()}`,
          type: 'savings',
          recipient: {
            id: 'savings',
            name: 'Savings Goal'
          },
          amount: suggestedSavings,
          confidence: 0.7,
          reason: `Based on your spending of N$${Math.round(avgDailySpend * 30)} monthly, consider saving N$${suggestedSavings} each month.`,
          category: 'savings',
          priority: 'low'
        });
      }
    }

    // Sort by priority and confidence
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidence - a.confidence;
    });

    // Limit results
    const limitedSuggestions = suggestions.slice(0, limit);

    logger.info(`Generated ${limitedSuggestions.length} payment suggestions for user ${userId}`);

    return jsonResponse({
      success: true,
      suggestions: limitedSuggestions,
      generated_at: new Date().toISOString(),
      analysis: {
        total_transactions_analyzed: transactions.length,
        patterns_detected: suggestions.length,
        time_period_days: 90
      }
    });

  } catch (error: any) {
    log.error('Error generating suggestions:', error);
    return jsonResponse(
      { error: error.message || 'Failed to generate suggestions' },
      500
    );
  }
}

async function getHandler(request: ExpoRequest): Promise<Response> {
  // Redirect GET to POST with empty body
  return postHandler(request);
}

// Apply security wrappers with API rate limits
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
