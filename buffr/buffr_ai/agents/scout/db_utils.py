"""
Scout Agent - Database Utilities
"""

import os
import logging
from typing import Optional, List, Dict, Any
import asyncpg
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

_db_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    """Get or create database connection pool"""
    global _db_pool

    if _db_pool is None:
        database_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/buffr_db")
        _db_pool = await asyncpg.create_pool(database_url, min_size=5, max_size=20)
        logger.info("Database connection pool created")

    return _db_pool


async def close_db_pool():
    """Close database connection pool"""
    global _db_pool
    if _db_pool:
        await _db_pool.close()
        _db_pool = None


async def fetch_user_transactions(
    db_pool: Optional[asyncpg.Pool],
    user_id: str,
    days: int = 90
) -> List[Dict[str, Any]]:
    """
    Fetch user's transaction history

    Args:
        db_pool: Database connection pool
        user_id: User identifier
        days: Number of days of history

    Returns:
        List of transactions
    """
    if db_pool is None:
        logger.warning("Database pool not available")
        return []

    try:
        async with db_pool.acquire() as conn:
            query = """
            SELECT *
            FROM transactions
            WHERE user_id = $1
              AND transaction_time >= $2
            ORDER BY transaction_time DESC
            """

            cutoff_date = datetime.now() - timedelta(days=days)
            rows = await conn.fetch(query, user_id, cutoff_date)

            return [dict(row) for row in rows]

    except Exception as e:
        logger.error(f"Failed to fetch transactions: {e}")
        return []


async def get_merchant_pricing_data(
    db_pool: Optional[asyncpg.Pool],
    category: str,
    location: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get merchant pricing data by category

    Args:
        db_pool: Database connection pool
        category: Merchant category
        location: Optional location filter

    Returns:
        List of merchant pricing data
    """
    if db_pool is None:
        logger.warning("Database pool not available")
        return []

    try:
        async with db_pool.acquire() as conn:
            if location:
                query = """
                SELECT
                    m.name as merchant_name,
                    m.location,
                    AVG(t.amount) as avg_price,
                    COUNT(*) as count
                FROM transactions t
                JOIN merchants m ON t.merchant_id = m.id
                WHERE t.category = $1
                  AND m.location ILIKE $2
                  AND t.transaction_time >= NOW() - INTERVAL '60 days'
                GROUP BY m.name, m.location
                ORDER BY avg_price ASC
                """
                rows = await conn.fetch(query, category, f"%{location}%")
            else:
                query = """
                SELECT
                    m.name as merchant_name,
                    m.location,
                    AVG(t.amount) as avg_price,
                    COUNT(*) as count
                FROM transactions t
                JOIN merchants m ON t.merchant_id = m.id
                WHERE t.category = $1
                  AND t.transaction_time >= NOW() - INTERVAL '60 days'
                GROUP BY m.name, m.location
                ORDER BY avg_price ASC
                """
                rows = await conn.fetch(query, category)

            return [dict(row) for row in rows]

    except Exception as e:
        logger.error(f"Failed to fetch merchant pricing: {e}")
        return []


async def store_forecast(
    db_pool: Optional[asyncpg.Pool],
    user_id: str,
    forecast_data: Dict[str, Any]
) -> str:
    """
    Store forecast result

    Args:
        db_pool: Database connection pool
        user_id: User identifier
        forecast_data: Forecast data

    Returns:
        Forecast ID
    """
    if db_pool is None:
        logger.warning("Database pool not available")
        return "no-db"

    try:
        async with db_pool.acquire() as conn:
            query = """
            INSERT INTO predictions (
                user_id,
                model_type,
                prediction_data,
                confidence,
                created_at
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            """

            forecast_id = await conn.fetchval(
                query,
                user_id,
                'spending_forecast',
                forecast_data,
                forecast_data.get('confidence', 0.0),
                datetime.now()
            )

            logger.info(f"Forecast stored: {forecast_id}")
            return str(forecast_id)

    except Exception as e:
        logger.error(f"Failed to store forecast: {e}")
        return "error"
