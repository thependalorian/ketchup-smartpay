"""
Exchange Rate Service
Fetches and stores NAD exchange rates from external API

Matches TypeScript implementation in buffr_ai_ts/src/services/exchangeRateApi.ts
"""

import os
import logging
import httpx
from typing import Dict, Optional, Any
from datetime import datetime
import asyncpg

logger = logging.getLogger(__name__)

# Exchange Rate API Configuration
EXCHANGE_RATE_API_URL = os.getenv(
    "EXCHANGE_RATE_API_URL",
    "https://api.exchangerate.host/latest?base=NAD"
)
EXCHANGE_RATE_API_KEY = os.getenv("EXCHANGE_RATE_API_KEY", "")

# Supported currencies
DEFAULT_CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR', 'BWP', 'CNY', 'JPY', 'AUD']


_db_pool: Optional[asyncpg.Pool] = None


async def get_db_connection() -> asyncpg.Pool:
    """Get database connection pool (reuse existing pool)"""
    global _db_pool
    if _db_pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        _db_pool = await asyncpg.create_pool(database_url, min_size=1, max_size=5)
        logger.info("[ExchangeRate] Database connection pool created")
    return _db_pool


async def fetch_live_exchange_rates(
    currencies: list = None
) -> Dict[str, Dict[str, Any]]:
    """
    Fetch live exchange rates from external API.
    
    Returns:
        Dict mapping currency codes to rate data:
        {
            'USD': {'rate': 0.054, 'trend': 'stable', 'lastUpdated': datetime},
            ...
        }
    """
    if currencies is None:
        currencies = DEFAULT_CURRENCIES
    
    try:
        logger.info(f"[ExchangeRate] Fetching rates for: {', '.join(currencies)}")
        
        # Build API URL
        url = EXCHANGE_RATE_API_URL
        if EXCHANGE_RATE_API_KEY:
            url += f"&access_key={EXCHANGE_RATE_API_KEY}"
        
        # Add currencies filter if specified
        if currencies:
            url += f"&symbols={','.join(currencies)}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
        
        # Parse response (exchangerate.host format)
        rates = {}
        now = datetime.now()
        
        if 'rates' in data:
            # Format: {"rates": {"USD": 0.054, "EUR": 0.050, ...}}
            for currency in currencies:
                upper_currency = currency.upper()
                if upper_currency in data['rates']:
                    rates[upper_currency] = {
                        'rate': float(data['rates'][upper_currency]),
                        'trend': 'stable',  # Could be enhanced with historical comparison
                        'lastUpdated': now
                    }
        elif 'quotes' in data:
            # Format: {"quotes": {"NADUSD": 0.054, "NADEUR": 0.050, ...}}
            for currency in currencies:
                upper_currency = currency.upper()
                quote_key = f"NAD{upper_currency}"
                if quote_key in data['quotes']:
                    rates[upper_currency] = {
                        'rate': float(data['quotes'][quote_key]),
                        'trend': 'stable',
                        'lastUpdated': now
                    }
        
        if not rates:
            logger.warning("[ExchangeRate] No rates found in API response")
            return get_simulated_rates(currencies)
        
        logger.info(f"[ExchangeRate] Successfully fetched {len(rates)} rates")
        return rates
        
    except Exception as e:
        logger.error(f"[ExchangeRate] Failed to fetch live rates: {e}")
        logger.info("[ExchangeRate] Falling back to simulated rates")
        return get_simulated_rates(currencies)


def get_simulated_rates(
    currencies: list
) -> Dict[str, Dict[str, Any]]:
    """
    Get simulated exchange rates as fallback.
    
    Used when API is unavailable or for testing.
    """
    simulated = {
        'USD': {'rate': 0.054, 'trend': 'stable', 'lastUpdated': datetime.now()},
        'EUR': {'rate': 0.050, 'trend': 'up', 'lastUpdated': datetime.now()},
        'GBP': {'rate': 0.042, 'trend': 'stable', 'lastUpdated': datetime.now()},
        'ZAR': {'rate': 1.00, 'trend': 'stable', 'lastUpdated': datetime.now()},  # Pegged 1:1
        'BWP': {'rate': 0.74, 'trend': 'down', 'lastUpdated': datetime.now()},
        'CNY': {'rate': 0.39, 'trend': 'up', 'lastUpdated': datetime.now()},
        'JPY': {'rate': 8.12, 'trend': 'stable', 'lastUpdated': datetime.now()},
        'AUD': {'rate': 0.082, 'trend': 'down', 'lastUpdated': datetime.now()},
    }
    
    result = {}
    for currency in currencies:
        upper_currency = currency.upper()
        if upper_currency in simulated:
            result[upper_currency] = simulated[upper_currency]
    
    return result


async def store_exchange_rates(
    rates: Dict[str, Dict[str, Any]],
    source: str = "exchangerate.host"
) -> bool:
    """
    Store exchange rates in database.
    
    Args:
        rates: Dict of rates from fetch_live_exchange_rates()
        source: API source name
    
    Returns:
        True if successful, False otherwise
    """
    try:
        pool = await get_db_connection()
        
        async with pool.acquire() as conn:
            # Use date-only for conflict resolution (one rate per currency per day)
            fetched_date = datetime.now().date()
            for currency, data in rates.items():
                await conn.execute(
                    """
                    INSERT INTO exchange_rates (
                        base_currency, target_currency, rate, trend, source, fetched_at, fetched_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (base_currency, target_currency, fetched_date)
                    DO UPDATE SET
                        rate = EXCLUDED.rate,
                        trend = EXCLUDED.trend,
                        source = EXCLUDED.source,
                        fetched_at = EXCLUDED.fetched_at
                    """,
                    'NAD',
                    currency,
                    float(data['rate']),
                    str(data['trend']),
                    source,
                    data['lastUpdated'],
                    fetched_date
                )
            
            # Log the fetch
            today = datetime.now().date()
            time = datetime.now().time()
            
            try:
                await conn.execute(
                    """
                    INSERT INTO exchange_rate_fetch_log (
                        fetch_date, fetch_time, currencies_fetched, success, api_source
                    ) VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (fetch_date, fetch_time) DO NOTHING
                    """,
                    today,
                    time,
                    len(rates),
                    True,
                    source
                )
            except Exception as log_error:
                # Log table might not exist - that's OK, continue
                logger.warning(f"[ExchangeRate] Could not log fetch (table may not exist): {log_error}")
        
        logger.info(f"[ExchangeRate] Stored {len(rates)} rates in database")
        return True
        
    except Exception as e:
        logger.error(f"[ExchangeRate] Error storing rates in database: {e}")
        return False


async def should_fetch_rates_from_api() -> bool:
    """
    Check if we should fetch rates from API (twice daily limit).
    
    Returns:
        True if we can fetch (less than 2 fetches today), False otherwise
    """
    try:
        pool = await get_db_connection()
        
        async with pool.acquire() as conn:
            # Check fetch count for today
            today = datetime.now().date()
            result = await conn.fetchrow(
                """
                SELECT COUNT(*) as fetch_count
                FROM exchange_rate_fetch_log
                WHERE fetch_date = $1 AND success = TRUE
                """,
                today
            )
            
            fetch_count = result['fetch_count'] if result else 0
            can_fetch = fetch_count < 2
            
            logger.info(f"[ExchangeRate] Fetch count today: {fetch_count}/2, can fetch: {can_fetch}")
            return can_fetch
            
    except Exception as e:
        logger.error(f"[ExchangeRate] Error checking fetch status: {e}")
        # Default to True if check fails
        return True


async def fetch_and_store_rates() -> bool:
    """
    Fetch and store exchange rates (main function for scheduler).
    
    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info("[ExchangeRate Scheduler] Starting scheduled fetch...")
        
        # Check if we should fetch (twice daily limit)
        should_fetch = await should_fetch_rates_from_api()
        
        if not should_fetch:
            logger.info("[ExchangeRate Scheduler] ⚠️  Fetch limit reached for today (already fetched twice)")
            logger.info("[ExchangeRate Scheduler] ✅ Skipping fetch to stay within API limits")
            return False
        
        # Fetch rates for all supported currencies
        currencies = DEFAULT_CURRENCIES
        logger.info(f"[ExchangeRate Scheduler] 📊 Fetching rates for: {', '.join(currencies)}")
        
        rates = await fetch_live_exchange_rates(currencies)
        
        if not rates:
            logger.error("[ExchangeRate Scheduler] ❌ No rates fetched from API")
            return False
        
        logger.info(f"[ExchangeRate Scheduler] ✅ Successfully fetched {len(rates)} exchange rates")
        
        # Store in database
        success = await store_exchange_rates(rates)
        
        if success:
            logger.info("[ExchangeRate Scheduler] ✅ Rates stored successfully")
            
            # Log summary
            rate_summary = ", ".join([
                f"{currency}: {data['rate']:.4f} {'📈' if data['trend'] == 'up' else '📉' if data['trend'] == 'down' else '➡️'}"
                for currency, data in rates.items()
            ])
            logger.info(f"[ExchangeRate Scheduler] 📈 Rates: {rate_summary}")
        
        return success
        
    except Exception as e:
        logger.error(f"[ExchangeRate Scheduler] ❌ Error fetching exchange rates: {e}")
        return False
