/**
 * Buffr AI Backend API Client
 * 
 * Location: utils/buffrAIClient.ts
 * Purpose: Centralized API client for making requests to Buffr AI backend
 * 
 * Features:
 * - Type-safe API calls to Buffr AI backend
 * - Consistent error handling
 * - Automatic JSON parsing
 * - Environment-based URL configuration
 * - Support for active AI agents (Guardian, Transaction Analyst, Companion, RAG)
 * - Note: Scout, Mentor, and Crafter agents removed (not relevant to G2P vouchers)
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get backend URL from environment or use default
const getBackendUrl = (): string => {
  // Check environment variable first
  const envUrl = Constants.expoConfig?.extra?.buffrAIUrl || 
                 process.env.EXPO_PUBLIC_BUFFR_AI_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Development default (adjust for your setup)
  // NOTE: AI Backend migrated from TypeScript (port 8000) to Python (port 8001)
  // IMPORTANT: Base URL should NOT include /api - endpoints will include it
  if (__DEV__) {
    // For iOS Simulator: use localhost
    // For Android Emulator: use 10.0.2.2 (special IP for Android emulator)
    // For physical device: use your computer's IP address (update manually)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8001'; // Android emulator - Python backend (no /api suffix)
    }
    return 'http://localhost:8001'; // iOS simulator / web - Python backend (no /api suffix)
  }
  
  // Production URL (update with actual production URL)
  return 'https://api.buffr.ai';
};

const API_BASE_URL = getBackendUrl();

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export class BuffrAIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'BuffrAIError';
  }
}

/**
 * Make a GET request to Buffr AI backend
 */
async function apiGet<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
  try {
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new BuffrAIError(
        errorData.error || errorData.message || 'Request failed',
        response.status,
        errorData
      );
    }
    
    const result = await response.json();
    return result as T;
  } catch (error) {
    if (error instanceof BuffrAIError) {
      throw error;
    }
    throw new BuffrAIError(
      error instanceof Error ? error.message : 'Network error',
      500
    );
  }
}

/**
 * Make a POST request to Buffr AI backend
 */
async function apiPost<T = any>(
  endpoint: string,
  body: any,
  queryParams?: Record<string, string>
): Promise<T> {
  try {
    let url = `${API_BASE_URL}${endpoint}`;
    if (queryParams) {
      const queryString = new URLSearchParams(queryParams).toString();
      url += `?${queryString}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new BuffrAIError(
        errorData.error || errorData.message || 'Request failed',
        response.status,
        errorData
      );
    }
    
    const result = await response.json();
    return result as T;
  } catch (error) {
    if (error instanceof BuffrAIError) {
      throw error;
    }
    throw new BuffrAIError(
      error instanceof Error ? error.message : 'Network error',
      500
    );
  }
}

// ============================================================================
// GUARDIAN AGENT - Fraud Detection & Credit Scoring
// ============================================================================

export interface FraudCheckRequest {
  transaction_id: string;
  amount: number;
  merchant_name: string;
  merchant_mcc: number;
  user_location: { lat: number; lon: number };
  merchant_location: { lat: number; lon: number };
  timestamp: string; // ISO format
  device_fingerprint: string;
  beneficiary_account_age_days?: number;
  card_present?: boolean;
  // Note: user_id is added automatically by the hook
}

export interface FraudCheckResponse {
  transaction_id: string;
  fraud_probability: number;
  is_fraud: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ERROR' | 'UNKNOWN';
  explanation: string;
  model_breakdown: Record<string, number>;
  recommended_action: 'APPROVE' | 'REVIEW' | 'REQUEST_ADDITIONAL_VERIFICATION' | 'MANUAL_REVIEW' | 'DECLINE' | 'BLOCK_TRANSACTION';
  confidence: number;
  timestamp: string;
}

export interface CreditAssessmentRequest {
  user_id: string;
  loan_amount_requested: number;
  total_transaction_volume: number;
  avg_transaction_amount: number;
  transaction_count: number;
  account_age_days: number;
  successful_transactions: number;
  failed_transactions?: number;
  avg_daily_balance?: number;
  fraud_incidents?: number;
  disputed_transactions?: number;
  chargebacks?: number;
  monthly_income?: number;
  debt_to_income_ratio?: number;
  // Note: All fields except user_id and loan_amount_requested have defaults in backend
}

export interface CreditAssessmentResponse {
  user_id: string;
  credit_score: number;
  default_probability: number;
  tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DECLINED';
  max_loan_amount: number;
  interest_rate: number;
  is_eligible: boolean;
  risk_factors: string[];
  recommendation: string;
  confidence: number;
  timestamp: string;
}

// ============================================================================
// TRANSACTION ANALYST AGENT - Spending Analysis & Classification
// ============================================================================

export interface TransactionClassificationRequest {
  transaction_id: string;
  merchant_name: string;
  amount: number;
  merchant_mcc: number;
  timestamp: string;
}

export interface TransactionClassificationResponse {
  transaction_id: string;
  category: string;
  confidence: number;
  top_k_categories?: Array<{ category: string; confidence: number }>;
  explanation: string;
  timestamp: string;
}

export interface SpendingAnalysisRequest {
  user_id: string;
  transactions: Array<{
    transaction_id: string;
    amount: number;
    category?: string;
    merchant_name?: string;
    timestamp: string;
  }>;
  time_period_days?: number;
}

export interface SpendingAnalysisResponse {
  user_id: string;
  user_persona: {
    primary: string;
    secondary?: string;
    traits: string[];
  };
  spending_by_category: Record<string, {
    total: number;
    count: number;
    avg: number;
  }>;
  total_spending: number;
  avg_transaction: number;
  transaction_count: number;
  spending_trend: 'increasing' | 'decreasing' | 'stable';
  is_unusual_spending: boolean;
  top_categories: string[];
  insights: string[];
  recommendations: string[];
  timestamp: string;
}

export interface BudgetRequest {
  user_id: string;
  spending_analysis: SpendingAnalysisResponse;
  savings_goal?: number;
}

export interface BudgetResponse {
  user_id: string;
  current_spending: number;
  recommended_spending: number;
  savings_goal: number;
  achievability: string;
  category_budgets: Record<string, {
    current: number;
    recommended: number;
    savings_potential: number;
  }>;
  total_savings_potential: number;
  timestamp: string;
}

// ============================================================================
// SCOUT AGENT - Market Intelligence
// ============================================================================
// REMOVED: Scout Agent is not available in Python backend (G2P voucher platform)
// These interfaces are kept for TypeScript backend compatibility only

export interface ScoutSearchRequest {
  query: string;
  max_results?: number;
}

export interface ScoutSearchResponse {
  query: string;
  results: Array<{
    title: string;
    link: string;
    snippet: string;
    source: string;
  }>;
  result_count: number;
  timestamp: string;
}

export interface ExchangeRateResponse {
  base_currency: string;
  rates: Record<string, number>;
  last_updated: string;
  source: string;
  timestamp: string;
}

export interface ForecastRequest {
  user_id: string;
  forecast_days?: number;
}

export interface ForecastResponse {
  user_id: string;
  forecast: number[];
  forecast_dates: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  insights: string[];
  historical_avg: number;
  forecast_avg: number;
  timestamp: string;
}

// ============================================================================
// MENTOR AGENT - Financial Education
// ============================================================================
// REMOVED: Mentor Agent is not available in Python backend (G2P voucher platform)
// These interfaces are kept for TypeScript backend compatibility only

export interface LiteracyAssessmentRequest {
  user_id: string;
  assessment_answers?: Record<string, any>;
}

export interface LiteracyAssessmentResponse {
  user_id: string;
  literacy_level: 'beginner' | 'intermediate' | 'advanced';
  overall_score: number;
  digital_literacy_score: number;
  financial_literacy_score: number;
  numeracy_score: number;
  fraud_awareness_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  recommended_learning_path: string;
}


export interface ConceptExplanationRequest {
  concept: string;
  user_level?: string;
}

export interface ConceptExplanationResponse {
  concept: string;
  simple_explanation: string;
  detailed_explanation: string;
  namibian_context: string;
  example: string;
  related_concepts: string[];
  timestamp: string;
}


// ============================================================================
// CRAFTER AGENT - Workflow Automation
// ============================================================================

export interface ScheduledPaymentRequest {
  user_id: string;
  recipient: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  payment_source?: string;
}

export interface ScheduledPaymentResponse {
  workflow_id: string;
  user_id: string;
  status: 'active' | 'paused' | 'completed';
  next_payment_date: string;
  total_payments: number;
  completed_payments: number;
}

export interface SpendingAlertRequest {
  user_id: string;
  alert_type: 'daily_limit' | 'category_limit' | 'unusual_activity' | 'budget_warning';
  threshold: number;
  categories?: string[];
}

export interface SpendingAlertResponse {
  alert_id: string;
  user_id: string;
  alert_type: string;
  threshold: number;
  categories: string[] | null;
  current_spending: number;
  buffer_remaining: number;
  status: string;
  notification_channels: string[];
  timestamp: string;
}

// ============================================================================
// COMPANION AGENT - Multi-Agent Orchestration
// ============================================================================

export interface CompanionChatRequest {
  user_id: string;
  message: string;
  session_id?: string;
  conversation_history?: Array<{ role: 'user' | 'ai'; message: string }>;
}

export interface CompanionChatResponse {
  message: string;
  agents_consulted: string[];
  session_id: string;
  timestamp: string;
  context_used?: Record<string, any>;
  // Support fields (when used in support mode)
  ticket_created?: boolean;
  ticket_number?: string;
  escalated?: boolean;
  knowledge_base_used?: boolean;
}

export interface UserContextResponse {
  user_id: string;
  session_id: string;
  recent_spending?: Array<any>;
  active_goals?: Array<any>;
  literacy_level?: string;
  literacy_score?: number;
  timestamp: string;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class BuffrAIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get the base URL for the AI backend
   * Used for streaming endpoints that need direct fetch access
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ============================================================================
  // GUARDIAN AGENT METHODS
  // ============================================================================

  /**
   * Check transaction for fraud
   */
  async checkFraud(request: FraudCheckRequest): Promise<FraudCheckResponse> {
    return apiPost<FraudCheckResponse>('/api/guardian/fraud/check', request);
  }

  /**
   * Assess credit eligibility
   */
  async assessCredit(request: CreditAssessmentRequest): Promise<CreditAssessmentResponse> {
    return apiPost<CreditAssessmentResponse>('/api/guardian/credit/assess', request);
  }

  /**
   * Chat with Guardian agent
   * Note: Backend uses POST with query params
   */
  async chatWithGuardian(message: string, userId?: string, sessionId?: string): Promise<any> {
    const queryParams: Record<string, string> = { message };
    if (userId) queryParams.user_id = userId;
    if (sessionId) queryParams.session_id = sessionId;
    return apiPost('/guardian/chat', {}, queryParams);
  }

  // ============================================================================
  // TRANSACTION ANALYST AGENT METHODS
  // ============================================================================

  /**
   * Classify transaction into category
   */
  async classifyTransaction(request: TransactionClassificationRequest): Promise<TransactionClassificationResponse> {
    return apiPost<TransactionClassificationResponse>('/api/transaction-analyst/classify', request);
  }

  /**
   * Analyze spending patterns
   */
  async analyzeSpending(request: SpendingAnalysisRequest): Promise<SpendingAnalysisResponse> {
    return apiPost<SpendingAnalysisResponse>('/api/transaction-analyst/analyze', request);
  }

  /**
   * Generate personalized budget
   */
  async generateBudget(request: BudgetRequest): Promise<BudgetResponse> {
    return apiPost<BudgetResponse>('/api/transaction-analyst/budget', request);
  }

  /**
   * Chat with Transaction Analyst
   * Note: Transaction Analyst doesn't have a chat endpoint in the backend
   */
  async chatWithTransactionAnalyst(message: string, userId: string, sessionId?: string): Promise<any> {
    // Use companion chat instead, which routes to transaction analyst
    return this.chat({
      user_id: userId,
      message,
      session_id: sessionId,
    });
  }

  // ============================================================================
  // SCOUT AGENT METHODS
  // ============================================================================
  // REMOVED: Scout Agent is not available in Python backend (G2P voucher platform)
  // These methods are commented out - use TypeScript backend (port 8000) if needed

  /**
   * Search Namibian financial institutions
   * @deprecated Scout Agent removed from Python backend - not relevant to G2P vouchers
   * Use TypeScript backend (port 8000) if Scout functionality is needed
   */
  async searchFinancialInfo(request: ScoutSearchRequest): Promise<ScoutSearchResponse> {
    throw new Error('Scout Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // return apiPost<ScoutSearchResponse>('/scout/search', request);
  }

  /**
   * Get NAD exchange rates
   * @deprecated Scout Agent removed from Python backend - not relevant to G2P vouchers
   * Use TypeScript backend (port 8000) if Scout functionality is needed
   */
  async getExchangeRates(baseCurrency: string = 'NAD', targetCurrencies: string[] = ['USD', 'EUR', 'ZAR', 'GBP']): Promise<ExchangeRateResponse> {
    throw new Error('Scout Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // return apiPost<ExchangeRateResponse>('/scout/exchange-rates', {
    //   base_currency: baseCurrency,
    //   target_currencies: targetCurrencies,
    // });
  }

  /**
   * Forecast spending trends
   * @deprecated Scout Agent removed from Python backend - not relevant to G2P vouchers
   * Use TypeScript backend (port 8000) if Scout functionality is needed
   */
  async forecastSpending(userId: string, forecastDays: number = 30): Promise<ForecastResponse> {
    throw new Error('Scout Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // return apiPost<ForecastResponse>('/scout/forecast', {
    //   user_id: userId,
    //   forecast_days: forecastDays,
    // });
  }

  /**
   * Chat with Scout agent
   * @deprecated Scout Agent removed from Python backend - not relevant to G2P vouchers
   * Use TypeScript backend (port 8000) if Scout functionality is needed
   */
  async chatWithScout(message: string, userId?: string, sessionId?: string): Promise<any> {
    throw new Error('Scout Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // const queryParams: Record<string, string> = { message };
    // if (userId) queryParams.user_id = userId;
    // if (sessionId) queryParams.session_id = sessionId;
    // return apiPost('/scout/chat', {}, queryParams);
  }

  // ============================================================================
  // MENTOR AGENT METHODS
  // ============================================================================
  // REMOVED: Mentor Agent is not available in Python backend (G2P voucher platform)
  // These methods are commented out - use TypeScript backend (port 8000) if needed

  /**
   * Assess financial literacy
   * @deprecated Mentor Agent removed from Python backend - not relevant to G2P vouchers
   * Use TypeScript backend (port 8000) if Mentor functionality is needed
   */
  async assessLiteracy(request: LiteracyAssessmentRequest): Promise<LiteracyAssessmentResponse> {
    throw new Error('Mentor Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // return apiPost<LiteracyAssessmentResponse>('/mentor/assess', request);
  }


  /**
   * Explain financial concept
   * @deprecated Mentor Agent removed from Python backend - not relevant to G2P vouchers
   * Use TypeScript backend (port 8000) if Mentor functionality is needed
   */
  async explainConcept(concept: string, userLevel: string = 'basic'): Promise<ConceptExplanationResponse> {
    throw new Error('Mentor Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // return apiPost<ConceptExplanationResponse>('/mentor/explain-concept', {
    //   concept,
    //   user_level: userLevel,
    // });
  }


  /**
   * Chat with Mentor agent
   * @deprecated Mentor Agent removed from Python backend - not relevant to G2P vouchers
   * Use TypeScript backend (port 8000) if Mentor functionality is needed
   */
  async chatWithMentor(message: string, userId: string): Promise<any> {
    throw new Error('Mentor Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // const queryParams: Record<string, string> = { user_id: userId, message };
    // return apiPost('/mentor/chat', {}, queryParams);
  }

  // ============================================================================
  // CRAFTER AGENT METHODS
  // ============================================================================
  // NOTE: Crafter Agent is available in TypeScript backend (port 8000) only
  // Python backend (port 8001) does not include Crafter agent for G2P voucher platform

  /**
   * Create scheduled payment
   * @deprecated Crafter Agent not available in Python backend - TypeScript backend (port 8000) only
   */
  async createScheduledPayment(request: ScheduledPaymentRequest): Promise<ScheduledPaymentResponse> {
    throw new Error('Crafter Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // return apiPost<ScheduledPaymentResponse>('/crafter/scheduled-payment', request);
  }

  /**
   * Set spending alert
   * @deprecated Crafter Agent not available in Python backend - TypeScript backend (port 8000) only
   */
  async setSpendingAlert(request: SpendingAlertRequest): Promise<SpendingAlertResponse> {
    throw new Error('Crafter Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // return apiPost<SpendingAlertResponse>('/crafter/spending-alert', request);
  }

  /**
   * Chat with Crafter agent
   * @deprecated Crafter Agent not available in Python backend - TypeScript backend (port 8000) only
   */
  async chatWithCrafter(message: string, userId: string): Promise<any> {
    throw new Error('Crafter Agent is not available in Python backend. Use TypeScript backend (port 8000) or remove this call.');
    // const queryParams: Record<string, string> = { user_id: userId, message };
    // return apiPost('/crafter/chat', {}, queryParams);
  }

  // ============================================================================
  // COMPANION AGENT METHODS (Main Orchestrator)
  // ============================================================================

  /**
   * Chat with main Buffr AI Companion (orchestrates all agents)
   */
  async chat(request: CompanionChatRequest): Promise<CompanionChatResponse> {
    return apiPost<CompanionChatResponse>('/api/companion/chat', request);
  }

  /**
   * Get user context
   */
  async getUserContext(userId: string): Promise<UserContextResponse> {
    return apiGet<UserContextResponse>(`/api/companion/context/${userId}`);
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string, limit: number = 10): Promise<any> {
    return apiGet(`/api/companion/history/${sessionId}?limit=${limit}`);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Check backend health
   */
  async checkHealth(): Promise<any> {
    return apiGet('/health');
  }
}

// Export singleton instance
export const buffrAI = new BuffrAIClient();

// Export individual functions for convenience
// Note: Removed Scout, Mentor, and Crafter agent exports (not in Python backend)
export const {
  checkFraud,
  assessCredit,
  classifyTransaction,
  analyzeSpending,
  generateBudget,
  // searchFinancialInfo, // REMOVED: Scout Agent not in Python backend
  // getExchangeRates, // REMOVED: Scout Agent not in Python backend
  // forecastSpending, // REMOVED: Scout Agent not in Python backend
  // assessLiteracy, // REMOVED: Mentor Agent not in Python backend
  // explainConcept, // REMOVED: Mentor Agent not in Python backend
  // createScheduledPayment, // REMOVED: Crafter Agent not in Python backend
  // setSpendingAlert, // REMOVED: Crafter Agent not in Python backend
  chat: companionChat,
  getUserContext,
  getConversationHistory,
  checkHealth,
} = buffrAI;
