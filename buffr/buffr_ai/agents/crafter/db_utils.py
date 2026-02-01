"""
Crafter Agent - Database Utilities
"""

import os
import logging
from typing import Optional, List, Dict, Any
import asyncpg
from datetime import datetime
import uuid
import json

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


async def store_workflow(
    db_pool: Optional[asyncpg.Pool],
    user_id: str,
    workflow_name: str,
    workflow_type: str,
    steps: List[Dict[str, Any]],
    triggers: List[str]
) -> str:
    """Store workflow configuration"""
    if db_pool is None:
        return str(uuid.uuid4())

    try:
        async with db_pool.acquire() as conn:
            workflow_id = str(uuid.uuid4())
            query = """
            INSERT INTO workflows (
                workflow_id, user_id, workflow_name, workflow_type,
                steps, triggers, created_at, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING workflow_id
            """
            await conn.execute(
                query,
                workflow_id,
                user_id,
                workflow_name,
                workflow_type,
                json.dumps(steps),
                triggers,
                datetime.now(),
                'created'
            )
            return workflow_id
    except Exception as e:
        logger.error(f"Failed to store workflow: {e}")
        return str(uuid.uuid4())


async def get_workflow(
    db_pool: Optional[asyncpg.Pool],
    workflow_id: str
) -> Optional[Dict[str, Any]]:
    """Get workflow by ID"""
    if db_pool is None:
        return None

    try:
        async with db_pool.acquire() as conn:
            query = """
            SELECT * FROM workflows
            WHERE workflow_id = $1
            """
            row = await conn.fetchrow(query, workflow_id)

            if row:
                workflow = dict(row)
                if isinstance(workflow.get('steps'), str):
                    workflow['steps'] = json.loads(workflow['steps'])
                return workflow
            return None
    except Exception as e:
        logger.error(f"Failed to get workflow: {e}")
        return None


async def update_workflow_status(
    db_pool: Optional[asyncpg.Pool],
    workflow_id: str,
    status: str
) -> bool:
    """Update workflow status"""
    if db_pool is None:
        return False

    try:
        async with db_pool.acquire() as conn:
            query = """
            UPDATE workflows
            SET status = $1, updated_at = $2
            WHERE workflow_id = $3
            """
            await conn.execute(query, status, datetime.now(), workflow_id)
            return True
    except Exception as e:
        logger.error(f"Failed to update workflow status: {e}")
        return False


async def create_scheduled_payment_db(
    db_pool: Optional[asyncpg.Pool],
    user_id: str,
    recipient: str,
    amount: float,
    frequency: str,
    start_date: str,
    end_date: Optional[str]
) -> str:
    """Store scheduled payment"""
    if db_pool is None:
        return str(uuid.uuid4())

    try:
        async with db_pool.acquire() as conn:
            payment_id = str(uuid.uuid4())
            query = """
            INSERT INTO scheduled_payments (
                payment_id, user_id, recipient, amount, frequency,
                start_date, end_date, created_at, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING payment_id
            """
            await conn.execute(
                query,
                payment_id,
                user_id,
                recipient,
                amount,
                frequency,
                start_date,
                end_date,
                datetime.now(),
                'active'
            )
            return payment_id
    except Exception as e:
        logger.error(f"Failed to create scheduled payment: {e}")
        return str(uuid.uuid4())


async def get_user_spending_patterns(
    db_pool: Optional[asyncpg.Pool],
    user_id: str
) -> Dict[str, Any]:
    """Get user's spending patterns"""
    if db_pool is None:
        return {
            'monthly_income': 10000.0,
            'monthly_expenses': 7000.0,
            'daily_average': 233.33
        }

    try:
        async with db_pool.acquire() as conn:
            # Get income
            income_query = """
            SELECT AVG(amount) as avg_income
            FROM transactions
            WHERE user_id = $1
              AND category = 'Income'
              AND transaction_time >= NOW() - INTERVAL '3 months'
            """
            income_row = await conn.fetchrow(income_query, user_id)
            monthly_income = float(income_row['avg_income']) if income_row and income_row['avg_income'] else 10000.0

            # Get expenses
            expense_query = """
            SELECT AVG(amount) as avg_expense
            FROM transactions
            WHERE user_id = $1
              AND category != 'Income'
              AND transaction_time >= NOW() - INTERVAL '3 months'
            """
            expense_row = await conn.fetchrow(expense_query, user_id)
            monthly_expenses = float(expense_row['avg_expense']) if expense_row and expense_row['avg_expense'] else 7000.0

            # Get daily average
            daily_query = """
            SELECT AVG(daily_total) as avg_daily
            FROM (
                SELECT DATE(transaction_time) as day, SUM(amount) as daily_total
                FROM transactions
                WHERE user_id = $1
                  AND transaction_time >= NOW() - INTERVAL '1 month'
                GROUP BY DATE(transaction_time)
            ) daily_totals
            """
            daily_row = await conn.fetchrow(daily_query, user_id)
            daily_average = float(daily_row['avg_daily']) if daily_row and daily_row['avg_daily'] else 233.33

            return {
                'monthly_income': monthly_income,
                'monthly_expenses': monthly_expenses,
                'daily_average': daily_average
            }
    except Exception as e:
        logger.error(f"Failed to get spending patterns: {e}")
        return {
            'monthly_income': 10000.0,
            'monthly_expenses': 7000.0,
            'daily_average': 233.33
        }
