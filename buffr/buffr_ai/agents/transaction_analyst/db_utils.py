"""
Transaction Analyst Agent - Database Utilities
"""

import os
import logging
from typing import Optional
import asyncpg

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
    db_pool: asyncpg.Pool,
    user_id: str,
    time_period: str = 'last_3_months'
) -> list:
    """
    Fetch user transactions for analysis

    Args:
        db_pool: Database connection pool
        user_id: User identifier
        time_period: Time period string ('last_month', 'last_3_months', 'last_year')

    Returns:
        List of transaction dictionaries
    """
    try:
        # Map time period to SQL interval
        period_map = {
            'last_month': "INTERVAL '1 month'",
            'last_3_months': "INTERVAL '3 months'",
            'last_year': "INTERVAL '1 year'"
        }
        interval = period_map.get(time_period, "INTERVAL '3 months'")
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT 
                    id,
                    user_id,
                    amount,
                    currency,
                    transaction_type,
                    status,
                    merchant_name,
                    merchant_category,
                    transaction_time,
                    created_at
                FROM transactions
                WHERE user_id = $1
                  AND status = 'completed'
                  AND transaction_time >= NOW() - {interval}
                ORDER BY transaction_time DESC
                """,
                user_id
            )
            
            return [
                {
                    'id': str(row['id']),
                    'user_id': str(row['user_id']),
                    'amount': float(row['amount'] or 0),
                    'currency': row['currency'],
                    'transaction_type': row['transaction_type'],
                    'status': row['status'],
                    'merchant_name': row['merchant_name'],
                    'merchant_category': row['merchant_category'],
                    'category': row['merchant_category'],  # Alias for compatibility
                    'transaction_time': row['transaction_time'],
                    'created_at': row['created_at']
                }
                for row in rows
            ]
            
    except Exception as e:
        logger.error(f"Failed to fetch user transactions: {e}")
        return []


async def get_cluster_statistics(
    db_pool: asyncpg.Pool,
    cluster_id: int,
    persona_name: str
) -> Optional[dict]:
    """
    Get aggregated statistics for users in the same ML cluster

    Args:
        db_pool: Database connection pool
        cluster_id: ML cluster ID from K-Means
        persona_name: Persona name (e.g., "Conservative Saver")

    Returns:
        Cluster statistics dictionary or None
    """
    try:
        async with db_pool.acquire() as conn:
            # Get statistics for users with same persona/cluster
            # Note: In production, this would query a user_profiles table
            # with cluster_id and persona fields populated by ML models
            stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(DISTINCT user_id) as group_size,
                    AVG(total_spending) as average_spending,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spending) as median_spending,
                    MIN(total_spending) as min_spending,
                    MAX(total_spending) as max_spending,
                    STDDEV(total_spending) as spending_stddev
                FROM (
                    SELECT 
                        user_id,
                        SUM(amount) as total_spending
                    FROM transactions
                    WHERE status = 'completed'
                      AND transaction_time >= NOW() - INTERVAL '3 months'
                      AND amount > 0
                    GROUP BY user_id
                ) user_spending
                WHERE user_id IN (
                    -- In production, this would filter by cluster_id from user_profiles
                    -- For now, we use spending ranges as proxy for cluster similarity
                    SELECT user_id
                    FROM transactions
                    WHERE status = 'completed'
                      AND transaction_time >= NOW() - INTERVAL '3 months'
                    GROUP BY user_id
                    HAVING SUM(amount) BETWEEN (
                        SELECT AVG(total) * 0.7
                        FROM (
                            SELECT SUM(amount) as total
                            FROM transactions
                            WHERE status = 'completed'
                              AND transaction_time >= NOW() - INTERVAL '3 months'
                            GROUP BY user_id
                        ) avg_calc
                    ) AND (
                        SELECT AVG(total) * 1.3
                        FROM (
                            SELECT SUM(amount) as total
                            FROM transactions
                            WHERE status = 'completed'
                              AND transaction_time >= NOW() - INTERVAL '3 months'
                            GROUP BY user_id
                        ) avg_calc
                    )
                )
                """,
            )
            
            if not stats or stats['group_size'] == 0:
                return None
            
            # Get category averages for cluster
            category_stats = await conn.fetch(
                """
                SELECT 
                    merchant_category as category,
                    AVG(category_spending) as average_spending,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY category_spending) as median_spending
                FROM (
                    SELECT 
                        user_id,
                        merchant_category,
                        SUM(amount) as category_spending
                    FROM transactions
                    WHERE status = 'completed'
                      AND transaction_time >= NOW() - INTERVAL '3 months'
                      AND merchant_category IS NOT NULL
                      AND amount > 0
                    GROUP BY user_id, merchant_category
                    HAVING user_id IN (
                        SELECT user_id
                        FROM transactions
                        WHERE status = 'completed'
                          AND transaction_time >= NOW() - INTERVAL '3 months'
                        GROUP BY user_id
                        HAVING SUM(amount) BETWEEN (
                            SELECT AVG(total) * 0.7
                            FROM (
                                SELECT SUM(amount) as total
                                FROM transactions
                                WHERE status = 'completed'
                                  AND transaction_time >= NOW() - INTERVAL '3 months'
                                GROUP BY user_id
                            ) avg_calc
                        ) AND (
                            SELECT AVG(total) * 1.3
                            FROM (
                                SELECT SUM(amount) as total
                                FROM transactions
                                WHERE status = 'completed'
                                  AND transaction_time >= NOW() - INTERVAL '3 months'
                                GROUP BY user_id
                            ) avg_calc
                        )
                    )
                ) category_breakdown
                GROUP BY merchant_category
                ORDER BY average_spending DESC
                LIMIT 15
                """,
            )
            
            category_averages = {
                row['category']: {
                    'average': float(row['average_spending'] or 0),
                    'median': float(row['median_spending'] or 0)
                }
                for row in category_stats
            }
            
            return {
                'cluster_id': cluster_id,
                'persona': persona_name,
                'group_size': stats['group_size'] or 0,
                'average_spending': float(stats['average_spending'] or 0),
                'median_spending': float(stats['median_spending'] or 0),
                'min_spending': float(stats['min_spending'] or 0),
                'max_spending': float(stats['max_spending'] or 0),
                'spending_stddev': float(stats['spending_stddev'] or 0),
                'category_averages': {k: v['average'] for k, v in category_averages.items()}
            }
            
    except Exception as e:
        logger.error(f"Failed to get cluster statistics: {e}")
        return None


async def get_peer_statistics(
    db_pool: asyncpg.Pool,
    user_persona: str,
    user_total_spending: float
) -> Optional[dict]:
    """
    Get aggregated peer statistics for comparison

    Args:
        db_pool: Database connection pool
        user_persona: User's spending persona
        user_total_spending: User's total spending

    Returns:
        Peer statistics dictionary or None
    """
    try:
        async with db_pool.acquire() as conn:
            # Get aggregated statistics for users with similar persona
            # This would ideally use a spending_persona field in user profiles
            # For now, we'll use spending ranges as a proxy
            spending_range_min = user_total_spending * 0.5
            spending_range_max = user_total_spending * 1.5
            
            # Get peer statistics
            stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(DISTINCT user_id) as group_size,
                    AVG(total_spending) as average_spending,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spending) as median_spending,
                    MIN(total_spending) as min_spending,
                    MAX(total_spending) as max_spending
                FROM (
                    SELECT 
                        user_id,
                        SUM(amount) as total_spending
                    FROM transactions
                    WHERE status = 'completed'
                      AND transaction_time >= NOW() - INTERVAL '3 months'
                      AND amount > 0
                    GROUP BY user_id
                    HAVING SUM(amount) BETWEEN $1 AND $2
                ) peer_spending
                """,
                spending_range_min,
                spending_range_max
            )
            
            if not stats or stats['group_size'] == 0:
                return None
            
            # Get category averages
            category_stats = await conn.fetch(
                """
                SELECT 
                    merchant_category as category,
                    AVG(category_spending) as average_spending
                FROM (
                    SELECT 
                        user_id,
                        merchant_category,
                        SUM(amount) as category_spending
                    FROM transactions
                    WHERE status = 'completed'
                      AND transaction_time >= NOW() - INTERVAL '3 months'
                      AND merchant_category IS NOT NULL
                      AND amount > 0
                    GROUP BY user_id, merchant_category
                    HAVING user_id IN (
                        SELECT user_id
                        FROM transactions
                        WHERE status = 'completed'
                          AND transaction_time >= NOW() - INTERVAL '3 months'
                        GROUP BY user_id
                        HAVING SUM(amount) BETWEEN $1 AND $2
                    )
                ) category_breakdown
                GROUP BY merchant_category
                ORDER BY average_spending DESC
                LIMIT 10
                """,
                spending_range_min,
                spending_range_max
            )
            
            category_averages = {
                row['category']: float(row['average_spending'] or 0)
                for row in category_stats
            }
            
            return {
                'group_size': stats['group_size'] or 0,
                'average_spending': float(stats['average_spending'] or 0),
                'median_spending': float(stats['median_spending'] or 0),
                'min_spending': float(stats['min_spending'] or 0),
                'max_spending': float(stats['max_spending'] or 0),
                'category_averages': category_averages
            }
            
    except Exception as e:
        logger.error(f"Failed to get peer statistics: {e}")
        return None
