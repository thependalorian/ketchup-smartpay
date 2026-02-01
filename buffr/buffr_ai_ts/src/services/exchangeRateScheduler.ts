/**
 * Exchange Rate Scheduler Service
 * 
 * Schedules automatic exchange rate fetching twice daily (8 AM and 8 PM)
 * Runs as part of the main server process
 * 
 * Usage:
 *   - Automatically starts when server starts
 *   - Can be disabled by setting ENABLE_EXCHANGE_RATE_SCHEDULER=false
 */

import * as cron from 'node-cron';
import { fetchLiveExchangeRates, storeExchangeRatesInDatabase, shouldFetchRatesFromAPI } from './exchangeRateApi.js';
import logger, { log } from '@/utils/logger';

const ENABLE_SCHEDULER = process.env.ENABLE_EXCHANGE_RATE_SCHEDULER !== 'false';

/**
 * Fetch and store exchange rates
 */
async function fetchAndStoreRates(): Promise<void> {
  try {
    logger.info('[ExchangeRate Scheduler] Starting scheduled fetch...');
    
    // Check if we should fetch (twice daily limit)
    const shouldFetch = await shouldFetchRatesFromAPI();
    
    if (!shouldFetch) {
      logger.info('[ExchangeRate Scheduler] ⚠️  Fetch limit reached for today (already fetched twice)');
      logger.info('[ExchangeRate Scheduler] ✅ Skipping fetch to stay within API limits');
      return;
    }

    // Fetch rates for all supported currencies
    const currencies = ['USD', 'EUR', 'GBP', 'ZAR', 'BWP', 'CNY', 'JPY', 'AUD'];
    logger.info(`[ExchangeRate Scheduler] 📊 Fetching rates for: ${currencies.join(', ')}`);

    const rates = await fetchLiveExchangeRates(currencies);

    if (Object.keys(rates).length === 0) {
      log.error('[ExchangeRate Scheduler] ❌ No rates fetched from API');
      return;
    }

    logger.info(`[ExchangeRate Scheduler] ✅ Successfully fetched ${Object.keys(rates).length} exchange rates`);

    // Store in database
    await storeExchangeRatesInDatabase(rates);
    logger.info('[ExchangeRate Scheduler] ✅ Rates stored successfully');

    // Log summary
    const rateSummary = Object.entries(rates)
      .map(([currency, data]) => {
        const trendIcon = data.trend === 'up' ? '📈' : data.trend === 'down' ? '📉' : '➡️';
        return `${currency}: ${data.rate.toFixed(4)} ${trendIcon}`;
      })
      .join(', ');
    
    logger.info(`[ExchangeRate Scheduler] 📈 Rates: ${rateSummary}`);

  } catch (error: any) {
    log.error('[ExchangeRate Scheduler] ❌ Error fetching exchange rates:', error.message);
  }
}

/**
 * Start the exchange rate scheduler
 * Fetches rates at 8 AM and 8 PM daily (UTC)
 */
export function startExchangeRateScheduler(): void {
  if (!ENABLE_SCHEDULER) {
    logger.info('[ExchangeRate Scheduler] ⚠️  Scheduler disabled (ENABLE_EXCHANGE_RATE_SCHEDULER=false)');
    return;
  }

  logger.info('[ExchangeRate Scheduler] 🚀 Starting exchange rate scheduler...');
  logger.info('[ExchangeRate Scheduler] 📅 Schedule: 8:00 AM and 8:00 PM UTC daily');
  logger.info('[ExchangeRate Scheduler] 📊 Rate limit: 2 fetches/day = 60 requests/month\n');

  // Schedule for 8 AM and 8 PM UTC (0 8,20 * * *)
  // Format: minute hour day month day-of-week
  cron.schedule('0 8,20 * * *', async () => {
    logger.info(`\n[ExchangeRate Scheduler] ⏰ Scheduled fetch triggered at ${new Date().toISOString()}`);
    await fetchAndStoreRates();
  }, {
    timezone: 'UTC',
  } as any);

  // Also fetch immediately on startup (if limit allows)
  logger.info('[ExchangeRate Scheduler] 🔄 Fetching rates on startup...');
  fetchAndStoreRates().catch(error => {
    log.error('[ExchangeRate Scheduler] ❌ Startup fetch failed:', error);
  });

  logger.info('[ExchangeRate Scheduler] ✅ Scheduler started successfully\n');
}

/**
 * Stop the exchange rate scheduler
 */
export function stopExchangeRateScheduler(): void {
  // Cron jobs are automatically cleaned up when process exits
  logger.info('[ExchangeRate Scheduler] 🛑 Scheduler stopped');
}

