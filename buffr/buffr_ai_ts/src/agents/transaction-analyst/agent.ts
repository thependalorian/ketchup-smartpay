/**
 * Transaction Analyst Agent
 * 
 * Spending analysis, transaction classification, and budget generation
 */

import {
  TransactionAnalystResponse,
  TransactionCategory,
  SpendingPattern,
  BudgetRecommendation,
} from '../../types/index.js';
import { chatCompletion } from '../../utils/providers.js';
import {
  TRANSACTION_ANALYST_SYSTEM_PROMPT,
  CLASSIFICATION_PROMPT,
  SPENDING_ANALYSIS_PROMPT,
  BUDGET_GENERATION_PROMPT,
} from './prompts.js';

// ==================== Category Definitions ====================

export const TRANSACTION_CATEGORIES = {
  groceries: { name: 'Groceries & Food', icon: '🛒', essential: true },
  transport: { name: 'Transport & Fuel', icon: '⛽', essential: true },
  housing: { name: 'Housing & Rent', icon: '🏠', essential: true },
  utilities: { name: 'Utilities', icon: '💡', essential: true },
  telecom: { name: 'Telecom & Internet', icon: '📱', essential: true },
  healthcare: { name: 'Healthcare', icon: '🏥', essential: true },
  education: { name: 'Education', icon: '📚', essential: true },
  dining: { name: 'Dining & Restaurants', icon: '🍽️', essential: false },
  entertainment: { name: 'Entertainment', icon: '🎬', essential: false },
  shopping: { name: 'Shopping', icon: '🛍️', essential: false },
  travel: { name: 'Travel', icon: '✈️', essential: false },
  fitness: { name: 'Fitness & Wellness', icon: '💪', essential: false },
  personal: { name: 'Personal Care', icon: '💇', essential: false },
  loans: { name: 'Loan Repayments', icon: '💳', essential: true },
  savings: { name: 'Savings', icon: '💰', essential: true },
  insurance: { name: 'Insurance', icon: '📊', essential: true },
  fees: { name: 'Bank Fees', icon: '🏦', essential: true },
  other: { name: 'Other', icon: '📝', essential: false },
};

// Merchant keyword mapping for classification
const MERCHANT_KEYWORDS: Record<string, string> = {
  // Groceries
  'pick n pay': 'groceries',
  'checkers': 'groceries',
  'spar': 'groceries',
  'woermann': 'groceries',
  'shoprite': 'groceries',
  'ok foods': 'groceries',
  
  // Fuel
  'engen': 'transport',
  'shell': 'transport',
  'caltex': 'transport',
  'puma': 'transport',
  'sasol': 'transport',
  
  // Utilities
  'nampower': 'utilities',
  'city of windhoek': 'utilities',
  'namwater': 'utilities',
  
  // Telecom
  'mtc': 'telecom',
  'tn mobile': 'telecom',
  'paratus': 'telecom',
  'telecom': 'telecom',
  
  // Dining
  'kfc': 'dining',
  'nandos': 'dining',
  'steers': 'dining',
  'ocean basket': 'dining',
  'wimpy': 'dining',
  'debonairs': 'dining',
  'restaurant': 'dining',
  'cafe': 'dining',
  
  // Entertainment
  'ster kinekor': 'entertainment',
  'cinema': 'entertainment',
  'netflix': 'entertainment',
  'spotify': 'entertainment',
  'dstv': 'entertainment',
  
  // Shopping
  'game': 'shopping',
  'edgars': 'shopping',
  'woolworths': 'shopping',
  'mr price': 'shopping',
  'ackermans': 'shopping',
  
  // Healthcare
  'pharmacy': 'healthcare',
  'clicks': 'healthcare',
  'dischem': 'healthcare',
  'hospital': 'healthcare',
  'clinic': 'healthcare',
  'doctor': 'healthcare',
  
  // Banking
  'fnb': 'fees',
  'standard bank': 'fees',
  'bank windhoek': 'fees',
  'nedbank': 'fees',
};

// ==================== Classification Functions ====================

/**
 * Classify a single transaction
 */
export function classifyTransaction(transaction: {
  description?: string;
  merchantName?: string;
  amount: number;
}): {
  category: string;
  subcategory?: string;
  confidence: number;
  essential: boolean;
} {
  const searchText = `${transaction.description || ''} ${transaction.merchantName || ''}`.toLowerCase();
  
  // Try keyword matching first
  for (const [keyword, category] of Object.entries(MERCHANT_KEYWORDS)) {
    if (searchText.includes(keyword)) {
      const categoryInfo = TRANSACTION_CATEGORIES[category as keyof typeof TRANSACTION_CATEGORIES];
      return {
        category: categoryInfo.name,
        confidence: 0.9,
        essential: categoryInfo.essential,
      };
    }
  }
  
  // Default to 'Other' if no match
  return {
    category: TRANSACTION_CATEGORIES.other.name,
    confidence: 0.5,
    essential: false,
  };
}

/**
 * Classify transaction with AI assistance
 */
export async function classifyTransactionWithAI(
  transaction: Record<string, any>
): Promise<TransactionAnalystResponse> {
  // First try rule-based classification
  const ruleBasedResult = classifyTransaction({
    description: transaction.description,
    merchantName: transaction.merchantName,
    amount: transaction.amount,
  });
  
  // If confidence is high enough, use rule-based result
  if (ruleBasedResult.confidence >= 0.8) {
    return {
      type: 'classification',
      insights: [
        `Transaction classified as ${ruleBasedResult.category}`,
        ruleBasedResult.essential ? 'This is an essential expense' : 'This is a discretionary expense',
      ],
      categories: [{
        name: ruleBasedResult.category,
        amount: transaction.amount,
        percentage: 100,
        trend: 'stable',
      }],
    };
  }
  
  // Use AI for uncertain classifications
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: TRANSACTION_ANALYST_SYSTEM_PROMPT },
    { role: 'user', content: CLASSIFICATION_PROMPT(transaction) },
  ];
  
  const aiResponse = await chatCompletion(messages);
  
  return {
    type: 'classification',
    insights: [aiResponse],
    categories: [{
      name: ruleBasedResult.category,
      amount: transaction.amount,
      percentage: 100,
      trend: 'stable',
    }],
  };
}

// ==================== Spending Analysis ====================

/**
 * Analyze spending patterns
 */
export async function analyzeSpending(
  transactions: Array<{
    amount: number;
    category?: string;
    merchantName?: string;
    date: string;
  }>,
  options: {
    period?: string;
    previousPeriodTransactions?: any[];
  } = {}
): Promise<TransactionAnalystResponse> {
  // Calculate totals
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Group by category
  const categoryMap = new Map<string, number>();
  for (const transaction of transactions) {
    const classification = classifyTransaction({
      merchantName: transaction.merchantName,
      amount: transaction.amount,
    });
    const category = transaction.category || classification.category;
    categoryMap.set(category, (categoryMap.get(category) || 0) + transaction.amount);
  }
  
  // Convert to categories array
  const categories: TransactionCategory[] = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: Math.round((amount / totalSpent) * 100),
      trend: 'stable' as const, // Would compare with previous period
    }))
    .sort((a, b) => b.amount - a.amount);
  
  // Group by merchant
  const merchantMap = new Map<string, number>();
  for (const transaction of transactions) {
    const merchant = transaction.merchantName || 'Unknown';
    merchantMap.set(merchant, (merchantMap.get(merchant) || 0) + transaction.amount);
  }
  
  const topMerchants = Array.from(merchantMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));
  
  // Calculate previous period comparison
  let changePercentage = 0;
  let previousTotal = 0;
  if (options.previousPeriodTransactions) {
    previousTotal = options.previousPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);
    changePercentage = previousTotal > 0 
      ? Math.round(((totalSpent - previousTotal) / previousTotal) * 100)
      : 0;
  }
  
  // Get AI insights
  const analysisData = {
    period: options.period || 'Last 30 days',
    transactionCount: transactions.length,
    totalSpent,
    categories,
    topMerchants,
    previousTotal,
    changePercentage,
  };
  
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: TRANSACTION_ANALYST_SYSTEM_PROMPT },
    { role: 'user', content: SPENDING_ANALYSIS_PROMPT(analysisData) },
  ];
  
  const aiInsights = await chatCompletion(messages);
  
  // Identify spending patterns
  const patterns: SpendingPattern[] = [];
  
  // Weekend vs weekday spending
  const weekendTransactions = transactions.filter(t => {
    const day = new Date(t.date).getDay();
    return day === 0 || day === 6;
  });
  const weekendTotal = weekendTransactions.reduce((sum, t) => sum + t.amount, 0);
  const weekdayTotal = totalSpent - weekendTotal;
  
  if (weekendTotal > weekdayTotal * 0.5) {
    patterns.push({
      pattern: 'High Weekend Spending',
      frequency: 'Weekly',
      averageAmount: weekendTotal / 4,
      insight: 'You spend significantly on weekends. Consider planning weekend activities in advance.',
    });
  }
  
  // Large transaction detection
  const largeTransactions = transactions.filter(t => t.amount > 1000);
  if (largeTransactions.length > 0) {
    patterns.push({
      pattern: 'Large Transactions',
      frequency: `${largeTransactions.length} this period`,
      averageAmount: largeTransactions.reduce((sum, t) => sum + t.amount, 0) / largeTransactions.length,
      insight: 'Review large transactions to ensure they align with your budget.',
    });
  }
  
  return {
    type: 'analysis',
    insights: [aiInsights],
    categories,
    spendingPatterns: patterns,
  };
}

// ==================== Budget Generation ====================

/**
 * Generate personalized budget recommendations
 */
export async function generateBudget(
  userData: {
    monthlyIncome: number;
    currentSpending?: Array<{ category: string; amount: number }>;
    goals?: string[];
    householdSize?: number;
    fixedExpenses?: number;
    debtPayments?: number;
  }
): Promise<TransactionAnalystResponse> {
  const { monthlyIncome, currentSpending, goals, householdSize = 1, fixedExpenses = 0, debtPayments = 0 } = userData;
  
  // Calculate available income
  const availableIncome = monthlyIncome - fixedExpenses - debtPayments;
  
  // Apply 50/30/20 rule with Namibian adjustments
  const needsBudget = availableIncome * 0.5;
  const wantsBudget = availableIncome * 0.3;
  const savingsBudget = availableIncome * 0.2;
  
  // Generate category budgets
  const budgetRecommendations: BudgetRecommendation[] = [
    {
      category: 'Groceries & Food',
      currentSpend: currentSpending?.find(c => c.category.includes('Groceries'))?.amount || 0,
      recommendedBudget: Math.round(needsBudget * 0.4), // 40% of needs
      savingsPotential: 0,
      tips: [
        'Shop at local markets for fresh produce',
        'Use Pick n Pay Smart Shopper or Checkers Xtra Savings',
        'Plan weekly meals to reduce waste',
      ],
    },
    {
      category: 'Transport & Fuel',
      currentSpend: currentSpending?.find(c => c.category.includes('Transport'))?.amount || 0,
      recommendedBudget: Math.round(needsBudget * 0.25),
      savingsPotential: 0,
      tips: [
        'Carpool when possible',
        'Track fuel prices across stations',
        'Maintain vehicle for better fuel efficiency',
      ],
    },
    {
      category: 'Utilities',
      currentSpend: currentSpending?.find(c => c.category.includes('Utilities'))?.amount || 0,
      recommendedBudget: Math.round(needsBudget * 0.15),
      savingsPotential: 0,
      tips: [
        'Use prepaid electricity to track usage',
        'Switch off geysers during peak hours',
        'Use energy-efficient appliances',
      ],
    },
    {
      category: 'Entertainment & Dining',
      currentSpend: currentSpending?.find(c => c.category.includes('Entertainment') || c.category.includes('Dining'))?.amount || 0,
      recommendedBudget: Math.round(wantsBudget * 0.5),
      savingsPotential: 0,
      tips: [
        'Look for restaurant specials and happy hours',
        'Cook at home more often',
        'Use streaming services instead of multiple subscriptions',
      ],
    },
    {
      category: 'Savings',
      currentSpend: currentSpending?.find(c => c.category.includes('Savings'))?.amount || 0,
      recommendedBudget: Math.round(savingsBudget),
      savingsPotential: savingsBudget,
      tips: [
        'Set up automatic transfers to savings',
        'Build 3-6 months emergency fund',
        'Consider tax-free savings accounts',
      ],
    },
  ];
  
  // Calculate savings potential
  for (const rec of budgetRecommendations) {
    if (rec.currentSpend > rec.recommendedBudget) {
      rec.savingsPotential = rec.currentSpend - rec.recommendedBudget;
    }
  }
  
  // Get AI-generated insights
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: TRANSACTION_ANALYST_SYSTEM_PROMPT },
    { role: 'user', content: BUDGET_GENERATION_PROMPT(userData) },
  ];
  
  const aiInsights = await chatCompletion(messages);
  
  // Convert to categories for response
  const categories: TransactionCategory[] = budgetRecommendations.map(rec => ({
    name: rec.category,
    amount: rec.recommendedBudget,
    percentage: Math.round((rec.recommendedBudget / availableIncome) * 100),
    trend: rec.currentSpend > rec.recommendedBudget ? 'down' : 'stable',
  }));
  
  return {
    type: 'budget',
    insights: [
      aiInsights,
      `Monthly income: NAD ${monthlyIncome.toLocaleString()}`,
      `Available for budgeting: NAD ${availableIncome.toLocaleString()}`,
      `Recommended savings: NAD ${savingsBudget.toLocaleString()} (20%)`,
    ],
    categories,
    budgetRecommendations,
  };
}

/**
 * Chat with Transaction Analyst
 */
export async function transactionAnalystChat(message: string): Promise<string> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: TRANSACTION_ANALYST_SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];
  
  return chatCompletion(messages);
}
