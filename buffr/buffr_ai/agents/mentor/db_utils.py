"""
Mentor Agent - Database Utilities
"""

import os
import logging
from typing import Optional, List, Dict, Any
import asyncpg
from datetime import datetime
import uuid

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


async def store_literacy_assessment(
    db_pool: Optional[asyncpg.Pool],
    user_id: str,
    assessment_data: Dict[str, Any]
) -> str:
    """Store literacy assessment results"""
    if db_pool is None:
        return "no-db"

    try:
        async with db_pool.acquire() as conn:
            query = """
            INSERT INTO literacy_assessments (
                user_id, literacy_level, overall_score,
                digital_score, financial_score, numeracy_score, fraud_score,
                assessed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
            """
            assessment_id = await conn.fetchval(
                query,
                user_id,
                assessment_data.get('literacy_level'),
                assessment_data.get('overall_score'),
                assessment_data.get('digital_score'),
                assessment_data.get('financial_score'),
                assessment_data.get('numeracy_score'),
                assessment_data.get('fraud_score'),
                datetime.now()
            )
            return str(assessment_id)
    except Exception as e:
        logger.error(f"Failed to store assessment: {e}")
        return "error"


async def get_literacy_assessment(
    db_pool: Optional[asyncpg.Pool],
    user_id: str
) -> Optional[Dict[str, Any]]:
    """Get latest literacy assessment"""
    if db_pool is None:
        return None

    try:
        async with db_pool.acquire() as conn:
            query = """
            SELECT * FROM literacy_assessments
            WHERE user_id = $1
            ORDER BY assessed_at DESC
            LIMIT 1
            """
            row = await conn.fetchrow(query, user_id)
            return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to get assessment: {e}")
        return None


async def get_learning_progress(
    db_pool: Optional[asyncpg.Pool],
    user_id: str
) -> Dict[str, Any]:
    """Get user's learning progress"""
    if db_pool is None:
        return {'completed_modules': [], 'skills_acquired': []}

    try:
        async with db_pool.acquire() as conn:
            query = """
            SELECT completed_modules, skills_acquired
            FROM learning_progress
            WHERE user_id = $1
            """
            row = await conn.fetchrow(query, user_id)

            if row:
                return {
                    'completed_modules': row['completed_modules'] or [],
                    'skills_acquired': row['skills_acquired'] or []
                }
            return {'completed_modules': [], 'skills_acquired': []}
    except Exception as e:
        logger.error(f"Failed to get progress: {e}")
        return {'completed_modules': [], 'skills_acquired': []}


async def create_financial_goal(
    db_pool: Optional[asyncpg.Pool],
    user_id: str,
    goal_name: str,
    target_amount: float,
    target_date: str,
    category: str
) -> str:
    """Create financial goal"""
    if db_pool is None:
        return str(uuid.uuid4())

    try:
        async with db_pool.acquire() as conn:
            query = """
            INSERT INTO financial_goals (
                user_id, goal_name, target_amount, target_date,
                category, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            """
            goal_id = await conn.fetchval(
                query,
                user_id,
                goal_name,
                target_amount,
                target_date,
                category,
                datetime.now()
            )
            return str(goal_id)
    except Exception as e:
        logger.error(f"Failed to create goal: {e}")
        return str(uuid.uuid4())


async def get_user_avg_monthly_income(
    db_pool: Optional[asyncpg.Pool],
    user_id: str
) -> float:
    """Get user's average monthly income"""
    if db_pool is None:
        return 0.0

    try:
        async with db_pool.acquire() as conn:
            query = """
            SELECT AVG(amount) as avg_income
            FROM transactions
            WHERE user_id = $1
              AND category = 'Income'
              AND transaction_time >= NOW() - INTERVAL '3 months'
            """
            row = await conn.fetchrow(query, user_id)
            return float(row['avg_income']) if row and row['avg_income'] else 0.0
    except Exception as e:
        logger.error(f"Failed to get income: {e}")
        return 0.0
