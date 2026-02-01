/**
 * Scheduled Exchange Rate Fetcher
 * 
 * Fetches exchange rates from exchangerate.host API twice daily
 * and stores them in the database.
 * 
 * Usage:
 *   - Run manually: npx tsx scripts/fetch-exchange-rates.ts
 *   - Schedule with cron: 0 8,20 * * * (8 AM and 8 PM daily)
 *   - Or use a task scheduler (e.g., node-cron, PM2, systemd)
 * 
 * Rate Limit Strategy:
 *   - Fetches twice per day (morning and evening)
 *   - 2 fetches/day × 30 days = 60 requests/month (well under 100 limit)
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fetchLiveExchangeRates, storeExchangeRatesInDatabase, shouldFetchRatesFromAPI } from '../src/services/exchangeRateApi.js';
import logger, { log } from '@/utils/logger';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL not found in environment');
  process.exit(1);
}

async function fetchAndStoreRates() {
  logger.info('🚀 Starting scheduled exchange rate fetch...\n');
  logger.info(`📅 Date: ${new Date().toISOString()}\n`);

  try {
    // Check if we should fetch (twice daily limit)
    const shouldFetch = await shouldFetchRatesFromAPI();
    
    if (!shouldFetch) {
      logger.info('⚠️  Fetch limit reached for today (already fetched twice)');
      logger.info('✅ Skipping fetch to stay within API limits\n');
      process.exit(0);
    }

    // Fetch rates for all supported currencies
    const currencies = ['USD', 'EUR', 'GBP', 'ZAR', 'BWP', 'CNY', 'JPY', 'AUD'];
    logger.info(`📊 Fetching rates for: ${currencies.join(', ')}\n`);

    const rates = await fetchLiveExchangeRates(currencies);

    if (Object.keys(rates).length === 0) {
      log.error('❌ No rates fetched from API');
      process.exit(1);
    }

    logger.info(`✅ Successfully fetched ${Object.keys(rates).length} exchange rates\n`);

    // Store in database
    logger.info('💾 Storing rates in database...');
    await storeExchangeRatesInDatabase(rates);
    logger.info('✅ Rates stored successfully\n');

    // Display fetched rates
    logger.info('📈 Fetched Exchange Rates:');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.entries(rates).forEach(([currency, data]) => {
      const trendIcon = data.trend === 'up' ? '📈' : data.trend === 'down' ? '📉' : '➡️';
      logger.info(`   ${currency}: ${data.rate.toFixed(4)} ${trendIcon} ${data.trend}`);
    });
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    logger.info('🎉 Exchange rate fetch completed successfully!');
    process.exit(0);

  } catch (error: any) {
    log.error('❌ Error fetching exchange rates:', error.message);
    log.error(error);
    process.exit(1);
  }
}

// Run the fetch
fetchAndStoreRates();

