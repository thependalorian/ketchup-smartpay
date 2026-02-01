/**
 * Exchange Rate API Service
 * 
 * Fetches live exchange rates for NAD (Namibian Dollar) from exchangerate.host
 * Stores rates in database and fetches twice daily to stay within API limits (100 requests/month)
 * 
 * API: https://exchangerate.host
 * Documentation: https://exchangerate.host/documentation
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "quotes": { "NADUSD": 0.054, "NADEUR": 0.050, ... },
 *   "source": "NAD",
 *   "timestamp": 1430401802
 * }
 * 
 * Database Strategy:
 * - Rates are fetched twice daily (morning and evening)
 * - Stored in exchange_rates table
 * - API calls are logged in exchange_rate_fetch_log
 * - Service reads from database first, only fetches if needed
 */

import { neon } from '@neondatabase/serverless';
import logger, { log } from '@/utils/logger';

// Get database connection
const getDb = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return neon(databaseUrl);
};

interface ExchangeRateHostResponse {
  success: boolean;
  quotes?: Record<string, number>; // Format: "NADUSD", "NADEUR", etc.
  source?: string;
  timestamp?: number;
  date?: string;
  error?: {
    code: number;
    type: string;
    info: string;
  };
  terms?: string;
  privacy?: string;
}

interface CachedRates {
  data: Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }>;
  timestamp: Date;
}

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (to stay well under 100 requests/month)
let cachedRates: CachedRates | null = null;

// ExchangeRate Host API Configuration
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || '';
const EXCHANGE_RATE_API_BASE = process.env.EXCHANGE_RATE_API_URL || 
  'https://api.exchangerate.host';

/**
 * Build API URL for exchangerate.host
 * Uses /live endpoint with source=NAD and optional currencies filter
 */
function buildExchangeRateUrl(currencies: string[]): string {
  const params = new URLSearchParams();
  
  if (EXCHANGE_RATE_API_KEY) {
    params.append('access_key', EXCHANGE_RATE_API_KEY);
  }
  
  params.append('source', 'NAD');
  
  if (currencies.length > 0) {
    params.append('currencies', currencies.join(','));
  }
  
  return `${EXCHANGE_RATE_API_BASE}/live?${params.toString()}`;
}

/**
 * Simulated rates as fallback (current implementation)
 */
function getSimulatedRates(
  currencies: string[]
): Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }> {
  const simulated: Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }> = {
    USD: { rate: 18.45, trend: 'stable', lastUpdated: new Date() },
    EUR: { rate: 20.12, trend: 'up', lastUpdated: new Date() },
    GBP: { rate: 23.56, trend: 'stable', lastUpdated: new Date() },
    ZAR: { rate: 1.00, trend: 'stable', lastUpdated: new Date() }, // Pegged 1:1
    BWP: { rate: 1.35, trend: 'down', lastUpdated: new Date() },
    CNY: { rate: 2.58, trend: 'up', lastUpdated: new Date() },
    JPY: { rate: 0.12, trend: 'stable', lastUpdated: new Date() },
    AUD: { rate: 12.15, trend: 'down', lastUpdated: new Date() },
  };
  
  const result: Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }> = {};
  currencies.forEach(currency => {
    const upperCurrency = currency.toUpperCase();
    if (simulated[upperCurrency]) {
      result[upperCurrency] = simulated[upperCurrency];
    }
  });
  
  return result;
}

/**
 * Calculate trend by comparing with previous rate
 * For now, defaults to 'stable' (could be enhanced with historical data)
 */
function calculateTrend(
  currentRate: number,
  previousRate?: number
): 'up' | 'down' | 'stable' {
  if (!previousRate) {
    return 'stable';
  }
  
  const diff = currentRate - previousRate;
  const percentChange = (diff / previousRate) * 100;
  
  // Only mark as up/down if change is significant (>0.5%)
  if (percentChange > 0.5) return 'up';
  if (percentChange < -0.5) return 'down';
  return 'stable';
}

/**
 * Fetch live exchange rates from exchangerate.host API
 * 
 * Response format: { success: true, quotes: { "NADUSD": 0.054, "NADEUR": 0.050 }, source: "NAD" }
 * Quotes are in format "SOURCE_TARGET" (e.g., "NADUSD" means 1 NAD = X USD)
 */
export async function fetchLiveExchangeRates(
  currencies: string[] = ['USD', 'EUR', 'GBP', 'ZAR', 'BWP', 'CNY', 'JPY', 'AUD']
): Promise<Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }>> {
  try {
    logger.info(`[ExchangeRate API] Fetching rates for: ${currencies.join(', ')}`);
    
    const url = buildExchangeRateUrl(currencies);
    logger.info(`[ExchangeRate API] URL: ${url.replace(EXCHANGE_RATE_API_KEY, '***')}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.status} ${response.statusText}`);
    }
    
    const data: ExchangeRateHostResponse = await response.json();
    
    // Check for API errors
    if (data.success === false || data.error) {
      const errorInfo = data.error || { code: 0, type: 'Unknown', info: 'Unknown API error' };
      throw new Error(`ExchangeRate API error [${errorInfo.code}]: ${errorInfo.info}`);
    }
    
    // Validate response has quotes
    if (!data.quotes || Object.keys(data.quotes).length === 0) {
      throw new Error('ExchangeRate API response missing or empty quotes');
    }
    
    // Validate source currency
    if (data.source && data.source !== 'NAD') {
      logger.warn(`[ExchangeRate API] Expected source NAD, got ${data.source}`);
    }
    
    // Convert exchangerate.host format to Scout Agent format
    // Quotes are in format "NADUSD", "NADEUR", etc.
    // We need to extract the target currency and the rate
    const rates: Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }> = {};
    const now = new Date();
    
    currencies.forEach(currency => {
      const upperCurrency = currency.toUpperCase();
      const quoteKey = `NAD${upperCurrency}`; // e.g., "NADUSD", "NADEUR"
      
      if (data.quotes && data.quotes[quoteKey] !== undefined) {
        const rate = data.quotes[quoteKey];
        const previousRate = cachedRates?.data[upperCurrency]?.rate;
        
        rates[upperCurrency] = {
          rate: rate,
          trend: calculateTrend(rate, previousRate),
          lastUpdated: now,
        };
      }
    });
    
    if (Object.keys(rates).length === 0) {
      throw new Error('No exchange rates found for requested currencies');
    }
    
    logger.info(`[ExchangeRate API] Successfully fetched ${Object.keys(rates).length} rates`);
    return rates;
    
  } catch (error) {
    log.error('[ExchangeRate API] Failed to fetch live rates:', error);
    logger.info('[ExchangeRate API] Falling back to simulated rates');
    return getSimulatedRates(currencies);
  }
}

/**
 * Get exchange rates from database (latest available)
 * Falls back to API fetch if database is empty
 */
export async function getExchangeRatesFromDatabase(
  currencies: string[] = ['USD', 'EUR', 'GBP', 'ZAR', 'BWP', 'CNY', 'JPY', 'AUD']
): Promise<Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }>> {
  try {
    const sql = getDb();
    
    // Get latest rates from database using the function
    const upperCurrencies = currencies.map(c => c.toUpperCase());
    logger.info(`[ExchangeRate API] Querying database for currencies: ${upperCurrencies.join(', ')}`);
    
    const result = await sql`
      SELECT target_currency, rate, trend, fetched_at
      FROM get_latest_exchange_rates('NAD', ${upperCurrencies}::VARCHAR(3)[])
    `;
    
    logger.info(`[ExchangeRate API] Database query returned ${result.length} rows`);
    
    if (result.length > 0) {
      const rates: Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }> = {};
      
      result.forEach((row: any) => {
        rates[row.target_currency] = {
          rate: parseFloat(row.rate),
          trend: (row.trend || 'stable') as 'up' | 'down' | 'stable',
          lastUpdated: new Date(row.fetched_at),
        };
      });
      
      logger.info(`[ExchangeRate API] Retrieved ${Object.keys(rates).length} rates from database:`, { rateKeys: Object.keys(rates) });
      return rates;
    }
    
    // No rates in database - return empty (will trigger API fetch)
    logger.info('[ExchangeRate API] No rates found in database');
    return {};
    
  } catch (error: any) {
    log.error('[ExchangeRate API] Error reading from database:', error.message);
    log.error('[ExchangeRate API] Full error:', error);
    return {};
  }
}

/**
 * Store exchange rates in database
 */
export async function storeExchangeRatesInDatabase(
  rates: Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }>,
  source: string = 'exchangerate.host'
): Promise<void> {
  try {
    const sql = getDb();
    const now = new Date();
    
    // Insert rates into database
    for (const [currency, data] of Object.entries(rates)) {
      await sql`
        INSERT INTO exchange_rates (base_currency, target_currency, rate, trend, source, fetched_at)
        VALUES ('NAD', ${currency}, ${data.rate}, ${data.trend}, ${source}, ${now})
        ON CONFLICT (base_currency, target_currency, fetched_at) DO NOTHING
      `;
    }
    
    // Log the fetch
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];
    
    await sql`
      INSERT INTO exchange_rate_fetch_log (fetch_date, fetch_time, currencies_fetched, success, api_source)
      VALUES (${today}::DATE, ${time}::TIME, ${Object.keys(rates).length}, TRUE, ${source})
      ON CONFLICT (fetch_date, fetch_time) DO NOTHING
    `;
    
    logger.info(`[ExchangeRate API] Stored ${Object.keys(rates).length} rates in database`);
    
  } catch (error) {
    log.error('[ExchangeRate API] Error storing rates in database:', error);
    throw error;
  }
}

/**
 * Check if we should fetch rates from API (twice daily limit)
 */
export async function shouldFetchRatesFromAPI(): Promise<boolean> {
  try {
    const sql = getDb();
    
    const result = await sql`
      SELECT should_fetch_exchange_rates() as should_fetch
    `;
    
    return result[0]?.should_fetch ?? true;
    
  } catch (error) {
    log.error('[ExchangeRate API] Error checking fetch status:', error);
    // Default to true if check fails
    return true;
  }
}

/**
 * Get cached exchange rates from database or fetch new ones if needed
 * Implements twice-daily fetch strategy to stay within 100 requests/month limit
 */
export async function getCachedExchangeRates(
  currencies: string[] = ['USD', 'EUR', 'GBP', 'ZAR']
): Promise<Record<string, { rate: number; trend: 'up' | 'down' | 'stable'; lastUpdated: Date }>> {
  logger.info('[ExchangeRate API] getCachedExchangeRates called with currencies:', { currencies });
  
  // First, try to get rates from database
  const dbRates = await getExchangeRatesFromDatabase(currencies);
  logger.info('[ExchangeRate API] Database rates count:', { count: Object.keys(dbRates).length });
  
  // If we have rates in database, prioritize them (even if old)
  if (Object.keys(dbRates).length > 0) {
    logger.info('[ExchangeRate API] Found rates in database');
    
    // Check if we should fetch new rates (twice daily)
    const shouldFetch = await shouldFetchRatesFromAPI();
    logger.info('[ExchangeRate API] Should fetch from API:', { shouldFetch });
    
    if (!shouldFetch) {
      logger.info('[ExchangeRate API] Using database rates (fetch limit reached for today)');
      return dbRates;
    }
    
    // We can fetch, but check if rates are recent (less than 12 hours old)
    const oldestRate = Math.min(
      ...Object.values(dbRates).map(r => r.lastUpdated.getTime())
    );
    const ageHours = (Date.now() - oldestRate) / (1000 * 60 * 60);
    logger.info(`[ExchangeRate API] Database rates age: ${ageHours.toFixed(1)} hours`);
    
    if (ageHours < 12) {
      logger.info(`[ExchangeRate API] Using database rates (age: ${ageHours.toFixed(1)}h)`);
      return dbRates;
    }
    
    // Rates are old, try to fetch new ones, but fall back to database rates if API fails
    logger.info('[ExchangeRate API] Database rates are old (>12h), attempting to fetch new rates...');
    try {
      const newRates = await fetchLiveExchangeRates(currencies);
      
      // Store in database
      try {
        await storeExchangeRatesInDatabase(newRates);
      } catch (error) {
        log.error('[ExchangeRate API] Failed to store rates in database:', error);
        // Continue even if storage fails
      }
      
      logger.info('[ExchangeRate API] Successfully fetched new rates from API');
      return newRates;
    } catch (error) {
      log.error('[ExchangeRate API] Failed to fetch new rates from API, using database rates:', error);
      // Fall back to database rates if API fetch fails
      return dbRates;
    }
  }
  
  // No rates in database - fetch from API (with fallback to simulated)
  logger.info('[ExchangeRate API] No rates in database, fetching from API...');
  const rates = await fetchLiveExchangeRates(currencies);
  
  // Store in database
  try {
    await storeExchangeRatesInDatabase(rates);
  } catch (error) {
    log.error('[ExchangeRate API] Failed to store rates in database:', error);
    // Continue even if storage fails
  }
  
  return rates;
}

/**
 * Clear the exchange rate cache (useful for testing)
 */
export function clearExchangeRateCache(): void {
  cachedRates = null;
  logger.info('[ExchangeRate API] Cache cleared');
}

