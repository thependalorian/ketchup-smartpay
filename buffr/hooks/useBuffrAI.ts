/**
 * Buffr AI React Hooks
 * 
 * Location: hooks/useBuffrAI.ts
 * Purpose: React hooks for interacting with Buffr AI backend
 * 
 * Features:
 * - Type-safe hooks for all AI agents
 * - Loading and error state management
 * - Automatic retry logic
 * - Session management
 */

import { useState, useCallback, useRef } from 'react';
import { buffrAI, type FraudCheckRequest, type FraudCheckResponse, type CreditAssessmentRequest, type CreditAssessmentResponse, type TransactionClassificationRequest, type TransactionClassificationResponse, type SpendingAnalysisRequest, type SpendingAnalysisResponse, type BudgetRequest, type BudgetResponse, type CompanionChatRequest, type CompanionChatResponse, type LiteracyAssessmentRequest, type LiteracyAssessmentResponse, type LearningPathRequest, type LearningPathResponse } from '@/utils/buffrAIClient';
import { useUser } from '@/contexts/UserContext';

// ============================================================================
// GUARDIAN AGENT HOOKS
// ============================================================================

/**
 * Hook for fraud detection
 */
export function useFraudDetection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFraud = useCallback(async (request: FraudCheckRequest) => {
    setLoading(true);
    setError(null);
    try {
      // Note: Backend doesn't require user_id in request model
      // but we can add it if needed for context
      const result = await buffrAI.checkFraud(request);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Fraud check failed');
      setLoading(false);
      throw err;
    }
  }, []);

  return { checkFraud, loading, error };
}

/**
 * Hook for credit assessment
 */
export function useCreditAssessment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const assessCredit = useCallback(async (request: Omit<CreditAssessmentRequest, 'user_id'>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.assessCredit({
        ...request,
        user_id: user.id,
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Credit assessment failed');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { assessCredit, loading, error };
}

// ============================================================================
// TRANSACTION ANALYST HOOKS
// ============================================================================

/**
 * Hook for transaction classification
 */
export function useTransactionClassification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classify = useCallback(async (request: TransactionClassificationRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.classifyTransaction(request);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Classification failed');
      setLoading(false);
      throw err;
    }
  }, []);

  return { classify, loading, error };
}

/**
 * Hook for spending analysis
 */
export function useSpendingAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const analyze = useCallback(async (request: Omit<SpendingAnalysisRequest, 'user_id'>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.analyzeSpending({
        ...request,
        user_id: user.id,
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { analyze, loading, error };
}

/**
 * Hook for budget generation
 */
export function useBudgetGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const generateBudget = useCallback(async (request: Omit<BudgetRequest, 'user_id'>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.generateBudget({
        ...request,
        user_id: user.id,
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Budget generation failed');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { generateBudget, loading, error };
}

// ============================================================================
// COMPANION AGENT HOOKS (Main AI Chat)
// ============================================================================

/**
 * Hook for Buffr AI Companion chat with streaming support
 */
export function useAIChat() {
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user } = useUser();

  // Non-streaming message (original)
  const sendMessage = useCallback(async (message: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      // Generate session ID if not exists
      if (!sessionIdRef.current) {
        sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const result = await buffrAI.chat({
        user_id: user.id,
        message,
        session_id: sessionIdRef.current,
      });
      
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Chat failed');
      setLoading(false);
      throw err;
    }
  }, [user]);

  // Streaming message - calls onChunk for each token received
  const sendMessageStream = useCallback(async (
    message: string,
    onChunk: (chunk: string, fullMessage: string) => void,
    onComplete?: (fullMessage: string) => void,
    onError?: (error: string) => void
  ) => {
    if (!user?.id) {
      const errorMsg = 'User not authenticated';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setStreaming(true);
    setLoading(true);
    setError(null);
    
    abortControllerRef.current = new AbortController();
    let fullMessage = '';

    try {
      const apiUrl = buffrAI.getBaseUrl();
      const response = await fetch(`${apiUrl}/api/companion/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: user.id,
          session_id: sessionIdRef.current,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.chunk) {
                fullMessage += data.chunk;
                onChunk(data.chunk, fullMessage);
              }
              
              if (data.done) {
                // Update session ID from server if provided
                if (data.sessionId) {
                  sessionIdRef.current = data.sessionId;
                }
                onComplete?.(fullMessage);
              }
            } catch (parseError) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      setStreaming(false);
      setLoading(false);
      return fullMessage;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stream was cancelled, not an error
        setStreaming(false);
        setLoading(false);
        return fullMessage;
      }
      
      const errorMsg = err.message || 'Stream failed';
      setError(errorMsg);
      setStreaming(false);
      setLoading(false);
      onError?.(errorMsg);
      throw err;
    }
  }, [user]);

  // Cancel an ongoing stream
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
    setLoading(false);
  }, []);

  const resetSession = useCallback(() => {
    sessionIdRef.current = null;
  }, []);

  return { 
    sendMessage, 
    sendMessageStream, 
    cancelStream,
    loading, 
    streaming,
    error, 
    sessionId: sessionIdRef.current, 
    resetSession 
  };
}

// ============================================================================
// MENTOR AGENT HOOKS
// ============================================================================

/**
 * Hook for financial literacy assessment
 */
export function useLiteracyAssessment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const assess = useCallback(async (answers?: Record<string, any>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.assessLiteracy({
        user_id: user.id,
        assessment_answers: answers,
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Assessment failed');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { assess, loading, error };
}

/**
 * Hook for learning path
 */
export function useLearningPath() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const getPath = useCallback(async (literacyLevel?: string, interests?: string[]) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.getLearningPath({
        user_id: user.id,
        literacy_level: literacyLevel,
        interests,
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to get learning path');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { getPath, loading, error };
}

/**
 * Hook for learning progress
 */
export function useLearningProgress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const getProgress = useCallback(async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.getLearningProgress(user.id);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to get progress');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { getProgress, loading, error };
}

/**
 * Hook for spending forecast
 */
export function useSpendingForecast() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const forecast = useCallback(async (forecastDays: number = 30) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.forecastSpending(user.id, forecastDays);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Forecast failed');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { forecast, loading, error };
}

// ============================================================================
// SCOUT AGENT HOOKS
// ============================================================================

/**
 * Hook for financial information search
 */
export function useFinancialSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, maxResults: number = 5) => {
    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.searchFinancialInfo({
        query,
        max_results: maxResults,
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setLoading(false);
      throw err;
    }
  }, []);

  return { search, loading, error };
}

/**
 * Hook for exchange rates
 */
export function useExchangeRates() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<any>(null);

  const fetchRates = useCallback(async (baseCurrency: string = 'NAD', targetCurrencies: string[] = ['USD', 'EUR', 'ZAR', 'GBP']) => {
    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.getExchangeRates(baseCurrency, targetCurrencies);
      // Backend returns { success: true, data: ExchangeRateResponse }
      // Extract the data property
      const exchangeData = (result as any).data || result;
      setRates(exchangeData);
      setLoading(false);
      return exchangeData;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exchange rates');
      setLoading(false);
      throw err;
    }
  }, []);

  return { fetchRates, rates, loading, error };
}

// ============================================================================
// CRAFTER AGENT HOOKS
// ============================================================================

/**
 * Hook for scheduled payments
 */
export function useScheduledPayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const createScheduledPayment = useCallback(async (request: {
    recipient: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    end_date?: string;
    payment_source?: string;
  }) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.createScheduledPayment({
        user_id: user.id,
        ...request,
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to create scheduled payment');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { createScheduledPayment, loading, error };
}

/**
 * Hook for spending alerts
 */
export function useSpendingAlerts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const setAlert = useCallback(async (request: {
    alert_type: 'daily_limit' | 'category_limit' | 'unusual_activity' | 'budget_warning';
    threshold: number;
    category?: string;
    enabled: boolean;
  }) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.setSpendingAlert({
        user_id: user.id,
        ...request,
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to set spending alert');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { setAlert, loading, error };
}

// ============================================================================
// PREDICTIVE SUGGESTIONS
// ============================================================================

/**
 * Hook for AI-powered predictive payment suggestions
 */
export function usePredictiveSuggestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { user } = useUser();

  const fetchSuggestions = useCallback(async (limit: number = 10) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const { apiPost } = await import('@/utils/apiClient');
      const result = await apiPost<{
        success: boolean;
        suggestions: any[];
        generated_at: string;
        analysis: {
          total_transactions_analyzed: number;
          patterns_detected: number;
          time_period_days: number;
        };
      }>('/companion/suggestions', {
        user_id: user.id,
        limit,
      });
      
      setSuggestions(result.suggestions || []);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suggestions');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { fetchSuggestions, suggestions, loading, error };
}

// ============================================================================
// BUDGET INSIGHTS
// ============================================================================

/**
 * Hook for AI-powered budget insights and recommendations
 */
export function useBudgetInsights() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const { user } = useUser();

  const fetchInsights = useCallback(async (period: 'week' | 'month' = 'month') => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const { apiPost } = await import('@/utils/apiClient');
      const result = await apiPost<{
        success: boolean;
        score: number;
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        period: 'week' | 'month';
        spending_summary: {
          total: number;
          daily_average: number;
          categories: Array<{
            category: string;
            amount: number;
            transaction_count: number;
            percentage: number;
            trend: 'up' | 'down' | 'stable';
            trend_percentage: number;
          }>;
        };
        insights: Array<{
          id: string;
          type: string;
          category: string;
          message: string;
          current_spend: number;
          budget_limit?: number;
          percentage_used?: number;
          icon: string;
          severity: 'info' | 'success' | 'warning' | 'error';
        }>;
        recommendations: Array<{
          id: string;
          title: string;
          description: string;
          potential_savings: number;
          difficulty: 'easy' | 'medium' | 'hard';
          category: string;
          action_type: 'reduce' | 'optimize' | 'save' | 'invest';
        }>;
        comparison: {
          vs_last_period: number;
          vs_last_period_percentage: number;
        };
        generated_at: string;
      }>('/transaction-analyst/budget-insights', {
        user_id: user.id,
        period,
      });
      
      setInsights(result);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch budget insights');
      setLoading(false);
      throw err;
    }
  }, [user]);

  return { fetchInsights, insights, loading, error };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Hook for backend health check
 */
export function useBackendHealth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthy, setHealthy] = useState<boolean | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await buffrAI.checkHealth();
      setHealthy(result.status === 'healthy');
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Health check failed');
      setHealthy(false);
      setLoading(false);
      throw err;
    }
  }, []);

  return { checkHealth, healthy, loading, error };
}
