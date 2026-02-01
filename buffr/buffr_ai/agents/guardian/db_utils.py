"""
Guardian Agent - Database Utilities (Neon PostgreSQL)
"""

import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncpg
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# Global connection pool
_db_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    """
    Get or create database connection pool

    Returns:
        AsyncPG connection pool
    """
    global _db_pool

    if _db_pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            logger.warning("DATABASE_URL not set, using default")
            database_url = "postgresql://user:pass@localhost/buffr_db"

        try:
            _db_pool = await asyncpg.create_pool(
                database_url,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            logger.info("Database connection pool created")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise

    return _db_pool


async def close_db_pool():
    """Close database connection pool"""
    global _db_pool

    if _db_pool:
        await _db_pool.close()
        _db_pool = None
        logger.info("Database connection pool closed")


@asynccontextmanager
async def get_db_connection():
    """
    Get database connection from pool

    Usage:
        async with get_db_connection() as conn:
            result = await conn.fetchrow("SELECT * FROM table")
    """
    pool = await get_db_pool()
    async with pool.acquire() as connection:
        yield connection


# === Fraud Detection Storage ===

async def store_fraud_check(
    db_pool: Optional[asyncpg.Pool],
    transaction_data: Dict[str, Any],
    fraud_result: Dict[str, Any],
    risk_level: str,
    recommended_action: str
) -> str:
    """
    Store fraud check result in database

    Args:
        db_pool: Database connection pool
        transaction_data: Transaction information
        fraud_result: Fraud detection result
        risk_level: Risk level assessment
        recommended_action: Recommended action

    Returns:
        Fraud check ID
    """
    if db_pool is None:
        logger.warning("Database pool not available, skipping fraud check storage")
        return "no-db"

    try:
        async with db_pool.acquire() as conn:
            # Store in fraud_checks table
            query = """
            INSERT INTO fraud_checks (
                transaction_id,
                fraud_probability,
                is_fraud,
                risk_level,
                recommended_action,
                logistic_score,
                neural_network_score,
                random_forest_score,
                gmm_anomaly_score,
                checked_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
            """

            model_scores = fraud_result.get('model_scores', {})

            fraud_check_id = await conn.fetchval(
                query,
                transaction_data.get('transaction_id'),
                fraud_result.get('fraud_probability', 0.0),
                fraud_result.get('is_fraud', False),
                risk_level,
                recommended_action,
                model_scores.get('logistic', 0.0),
                model_scores.get('neural_network', 0.0),
                model_scores.get('random_forest', 0.0),
                model_scores.get('gmm_anomaly', 0.0),
                datetime.now()
            )

            logger.info(f"Fraud check stored: {fraud_check_id}")
            return str(fraud_check_id)

    except Exception as e:
        logger.error(f"Failed to store fraud check: {e}")
        return "error"


# === Credit Assessment Storage ===

async def store_credit_assessment(
    db_pool: Optional[asyncpg.Pool],
    user_id: str,
    assessment: Dict[str, Any],
    loan_amount_requested: float,
    is_eligible: bool
) -> str:
    """
    Store credit assessment result in database

    Args:
        db_pool: Database connection pool
        user_id: User identifier
        assessment: Credit assessment result
        loan_amount_requested: Requested loan amount
        is_eligible: Eligibility status

    Returns:
        Assessment ID
    """
    if db_pool is None:
        logger.warning("Database pool not available, skipping credit assessment storage")
        return "no-db"

    try:
        async with db_pool.acquire() as conn:
            query = """
            INSERT INTO credit_assessments (
                user_id,
                credit_score,
                tier,
                max_loan_amount,
                interest_rate,
                loan_amount_requested,
                is_eligible,
                default_probability,
                assessed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
            """

            assessment_id = await conn.fetchval(
                query,
                user_id,
                assessment.get('credit_score', 0),
                assessment.get('tier', 'DECLINED'),
                assessment.get('max_loan_amount', 0.0),
                assessment.get('interest_rate', 0.0),
                loan_amount_requested,
                is_eligible,
                assessment.get('default_probability', 1.0),
                datetime.now()
            )

            logger.info(f"Credit assessment stored: {assessment_id}")
            return str(assessment_id)

    except Exception as e:
        logger.error(f"Failed to store credit assessment: {e}")
        return "error"


# === Transaction History Retrieval ===

async def fetch_user_transaction_history(
    db_pool: Optional[asyncpg.Pool],
    user_id: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Fetch user's transaction history

    Args:
        db_pool: Database connection pool
        user_id: User identifier
        limit: Maximum number of transactions

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
            ORDER BY transaction_time DESC
            LIMIT $2
            """

            rows = await conn.fetch(query, user_id, limit)
            return [dict(row) for row in rows]

    except Exception as e:
        logger.error(f"Failed to fetch transaction history: {e}")
        return []


async def fetch_merchant_data(
    db_pool: Optional[asyncpg.Pool],
    merchant_id: str
) -> Optional[Dict[str, Any]]:
    """
    Fetch merchant data for credit assessment

    Args:
        db_pool: Database connection pool
        merchant_id: Merchant identifier

    Returns:
        Merchant data dictionary
    """
    if db_pool is None:
        logger.warning("Database pool not available")
        return None

    try:
        async with db_pool.acquire() as conn:
            # Fetch merchant basic info
            merchant_query = """
            SELECT *
            FROM merchants
            WHERE id = $1
            """
            merchant = await conn.fetchrow(merchant_query, merchant_id)

            if not merchant:
                return None

            # Fetch transaction statistics
            stats_query = """
            SELECT
                COUNT(*) as transaction_count,
                SUM(amount) as total_volume,
                AVG(amount) as avg_amount,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
            FROM transactions
            WHERE merchant_id = $1
            """
            stats = await conn.fetchrow(stats_query, merchant_id)

            return {
                'merchant_id': merchant_id,
                'name': merchant.get('name'),
                'mcc': merchant.get('mcc'),
                'account_age_days': (datetime.now() - merchant.get('created_at')).days,
                'transaction_count': stats.get('transaction_count', 0),
                'total_transaction_volume': float(stats.get('total_volume', 0)),
                'avg_transaction_amount': float(stats.get('avg_amount', 0)),
                'successful_transactions': stats.get('successful_count', 0),
                'failed_transactions': stats.get('failed_count', 0)
            }

    except Exception as e:
        logger.error(f"Failed to fetch merchant data: {e}")
        return None


# === Session Management ===

async def create_guardian_session(
    db_pool: Optional[asyncpg.Pool],
    user_id: Optional[str] = None,
    metadata: Dict[str, Any] = None
) -> str:
    """
    Create new Guardian agent session

    Args:
        db_pool: Database connection pool
        user_id: Optional user identifier
        metadata: Optional session metadata

    Returns:
        Session ID
    """
    if db_pool is None:
        import uuid
        return str(uuid.uuid4())

    try:
        async with db_pool.acquire() as conn:
            query = """
            INSERT INTO sessions (user_id, metadata, created_at)
            VALUES ($1, $2, $3)
            RETURNING id
            """

            session_id = await conn.fetchval(
                query,
                user_id,
                metadata or {},
                datetime.now()
            )

            logger.info(f"Guardian session created: {session_id}")
            return str(session_id)

    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        import uuid
        return str(uuid.uuid4())
