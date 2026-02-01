/**
 * Scout Agent - Market Intelligence
 * 
 * Exchange rates, regulatory updates, and market research
 */

import { ScoutResponse } from '../../types/index.js';
import { chatCompletion } from '../../utils/providers.js';
import {
  SCOUT_SYSTEM_PROMPT,
  EXCHANGE_RATE_PROMPT,
  REGULATORY_UPDATE_PROMPT,
  MARKET_SEARCH_PROMPT,
  OPPORTUNITY_DETECTION_PROMPT,
  PRICE_COMPARISON_PROMPT,
} from './prompts.js';
import { getCachedExchangeRates } from '../../services/exchangeRateApi.js';

// ==================== Regulatory Updates ====================

const RECENT_UPDATES = [
  {
    id: 'bon-2024-001',
    source: 'Bank of Namibia',
    title: 'Repo Rate Decision',
    summary: 'Repo rate maintained at 7.75% amid inflation concerns',
    date: '2024-01-15',
    impact: 'Lending rates remain stable',
    category: 'monetary_policy',
  },
  {
    id: 'namfisa-2024-002',
    source: 'NAMFISA',
    title: 'Updated Insurance Guidelines',
    summary: 'New disclosure requirements for insurance products',
    date: '2024-01-10',
    impact: 'Insurers must provide clearer product information',
    category: 'insurance',
  },
  {
    id: 'mof-2024-003',
    source: 'Ministry of Finance',
    title: 'Digital Payment Regulations',
    summary: 'Enhanced security requirements for mobile money operators',
    date: '2024-01-05',
    impact: 'Additional verification may be required for large transfers',
    category: 'payments',
  },
];

// ==================== Scout Agent Functions ====================

/**
 * Get exchange rates for specified currencies
 * 
 * Fetches live rates from ExchangeRate Host API with 10-minute caching
 * Falls back to simulated rates if API fails
 */
export async function getExchangeRates(
  currencies: string[] = ['USD', 'EUR', 'GBP', 'ZAR']
): Promise<ScoutResponse> {
  // Fetch live rates (with caching and fallback)
  const rateDataMap = await getCachedExchangeRates(currencies);
  
  // Format for response
  const rateData: Record<string, any> = {};
  
  for (const currency of currencies) {
    const upperCurrency = currency.toUpperCase();
    if (rateDataMap[upperCurrency]) {
      const data = rateDataMap[upperCurrency];
      rateData[upperCurrency] = {
        rate: data.rate,
        formatted: `1 ${upperCurrency} = NAD ${data.rate.toFixed(2)}`,
        trend: data.trend,
        trendIcon: data.trend === 'up' ? '📈' : data.trend === 'down' ? '📉' : '➡️',
        lastUpdated: data.lastUpdated.toISOString(),
      };
    }
  }
  
  // Get AI context
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: SCOUT_SYSTEM_PROMPT },
    { role: 'user', content: EXCHANGE_RATE_PROMPT(currencies) },
  ];
  
  const aiInsights = await chatCompletion(messages);
  
  // Determine sources based on whether we used database rates or simulated rates
  // Database rates will have a lastUpdated timestamp, simulated rates will be very recent
  const hasRates = Object.keys(rateData).length > 0;
  const firstRate = hasRates ? rateData[Object.keys(rateData)[0]] : null;
  const isSimulated = !firstRate || 
    (firstRate.lastUpdated && new Date(firstRate.lastUpdated).getTime() > Date.now() - 60000); // If updated in last minute, likely simulated
  
  const sources = hasRates && !isSimulated
    ? ['ExchangeRate Host API', 'Bank of Namibia']
    : ['Simulated Rates (API unavailable)', 'Bank of Namibia'];
  
  return {
    type: 'exchange_rates',
    data: {
      rates: rateData,
      baseCurrency: 'NAD',
      timestamp: new Date().toISOString(),
    },
    insights: [aiInsights],
    sources,
    timestamp: new Date(),
  };
}

/**
 * Get regulatory updates
 */
export async function getRegulatoryUpdates(
  topic?: string
): Promise<ScoutResponse> {
  // Filter updates by topic if specified
  let filteredUpdates = RECENT_UPDATES;
  if (topic) {
    const lowerTopic = topic.toLowerCase();
    filteredUpdates = RECENT_UPDATES.filter(
      u => u.category.includes(lowerTopic) || 
           u.title.toLowerCase().includes(lowerTopic) ||
           u.summary.toLowerCase().includes(lowerTopic)
    );
  }
  
  // Get AI analysis
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: SCOUT_SYSTEM_PROMPT },
    { role: 'user', content: REGULATORY_UPDATE_PROMPT(topic) },
  ];
  
  const aiInsights = await chatCompletion(messages);
  
  return {
    type: 'regulatory',
    data: {
      updates: filteredUpdates,
      totalCount: filteredUpdates.length,
      lastChecked: new Date().toISOString(),
    },
    insights: [aiInsights],
    sources: ['Bank of Namibia', 'NAMFISA', 'Ministry of Finance'],
    timestamp: new Date(),
  };
}

/**
 * Search for market information
 */
export async function marketSearch(query: string): Promise<ScoutResponse> {
  // Get AI-powered search results
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: SCOUT_SYSTEM_PROMPT },
    { role: 'user', content: MARKET_SEARCH_PROMPT(query) },
  ];
  
  const aiResponse = await chatCompletion(messages);
  
  return {
    type: 'search',
    data: {
      query,
      response: aiResponse,
    },
    insights: [aiResponse],
    sources: ['Buffr Knowledge Base', 'Public Financial Data'],
    timestamp: new Date(),
  };
}

/**
 * Detect financial opportunities for user
 */
export async function detectOpportunities(
  userProfile: {
    monthlyIncome?: number;
    savingsRate?: number;
    riskTolerance?: string;
    goals?: string[];
    holdings?: Array<{ type: string; amount: number }>;
  }
): Promise<ScoutResponse> {
  const opportunities: Array<{
    type: string;
    title: string;
    description: string;
    potentialBenefit: string;
    risk: string;
    action: string;
  }> = [];
  
  // Savings opportunities
  if ((userProfile.savingsRate || 0) < 20) {
    opportunities.push({
      type: 'savings',
      title: 'High-Yield Savings Account',
      description: 'Consider moving funds to a high-yield savings account',
      potentialBenefit: 'Up to 8% annual interest vs 2% standard',
      risk: 'Low',
      action: 'Compare rates at Bank Windhoek, FNB, and Standard Bank',
    });
  }
  
  // Investment opportunities based on risk tolerance
  if (userProfile.riskTolerance === 'high' || userProfile.riskTolerance === 'moderate') {
    opportunities.push({
      type: 'investment',
      title: 'Tax-Free Savings Account',
      description: 'Invest up to NAD 36,000 per year tax-free',
      potentialBenefit: 'Tax savings on investment returns',
      risk: 'Varies by underlying investment',
      action: 'Open TFSA at licensed provider',
    });
  }
  
  // Cost-saving opportunities
  opportunities.push({
    type: 'cost_saving',
    title: 'Bank Fee Optimization',
    description: 'Review your current bank account fees',
    potentialBenefit: 'Save up to NAD 100/month on fees',
    risk: 'None',
    action: 'Compare account packages across banks',
  });
  
  // Get AI insights
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: SCOUT_SYSTEM_PROMPT },
    { role: 'user', content: OPPORTUNITY_DETECTION_PROMPT(userProfile) },
  ];
  
  const aiInsights = await chatCompletion(messages);
  
  return {
    type: 'opportunities',
    data: {
      opportunities,
      userProfile: {
        riskTolerance: userProfile.riskTolerance || 'moderate',
        savingsRate: userProfile.savingsRate || 0,
      },
    },
    insights: [aiInsights],
    sources: ['Buffr Analysis', 'Market Data'],
    timestamp: new Date(),
  };
}

/**
 * Compare financial products
 */
export async function comparePrices(
  product: string,
  providers?: string[]
): Promise<ScoutResponse> {
  // Get AI comparison
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: SCOUT_SYSTEM_PROMPT },
    { role: 'user', content: PRICE_COMPARISON_PROMPT(product, providers) },
  ];
  
  const aiComparison = await chatCompletion(messages);
  
  return {
    type: 'pricing',
    data: {
      product,
      comparison: aiComparison,
      providers: providers || ['FNB', 'Standard Bank', 'Bank Windhoek', 'Nedbank'],
    },
    insights: [aiComparison],
    sources: ['Bank Websites', 'Public Rate Sheets'],
    timestamp: new Date(),
  };
}

/**
 * Get spending forecast
 */
export async function getSpendingForecast(
  historicalData: Array<{ month: string; amount: number }>,
  months: number = 3
): Promise<ScoutResponse> {
  // Simple linear regression forecast
  const amounts = historicalData.map(d => d.amount);
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  
  // Calculate trend
  let trend = 0;
  if (amounts.length > 1) {
    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    trend = (secondAvg - firstAvg) / firstAvg;
  }
  
  // Generate forecast
  const forecast = [];
  const currentDate = new Date();
  for (let i = 1; i <= months; i++) {
    const forecastDate = new Date(currentDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    const forecastAmount = avgAmount * (1 + trend * i);
    forecast.push({
      month: forecastDate.toISOString().slice(0, 7),
      predictedAmount: Math.round(forecastAmount),
      confidence: Math.max(0.5, 0.9 - i * 0.1), // Decreasing confidence
    });
  }
  
  return {
    type: 'forecast',
    data: {
      historical: historicalData,
      forecast,
      trend: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'decreasing' : 'stable',
      trendPercentage: Math.round(trend * 100),
    },
    insights: [
      `Based on your spending history, we predict ${trend > 0 ? 'an increase' : trend < 0 ? 'a decrease' : 'stable spending'} of ${Math.abs(Math.round(trend * 100))}% over the next ${months} months.`,
    ],
    sources: ['Transaction History Analysis'],
    timestamp: new Date(),
  };
}

/**
 * Chat with Scout agent
 */
export async function scoutChat(message: string): Promise<string> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: SCOUT_SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];
  
  return chatCompletion(messages);
}
