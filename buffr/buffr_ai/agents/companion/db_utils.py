"""
Main Buffr AI Companion - Database Utilities
"""

import os
import logging
from typing import Optional, List, Dict, Any
import asyncpg
from datetime import datetime

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


async def store_conversation(
    db_pool: Optional[asyncpg.Pool],
    session_id: str,
    user_id: str,
    message: str,
    response: str,
    agents_consulted: List[str]
) -> bool:
    """Store conversation for history"""
    if db_pool is None:
        return False

    try:
        async with db_pool.acquire() as conn:
            query = """
            INSERT INTO conversations (
                session_id, user_id, user_message, assistant_response,
                agents_consulted, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
            """
            await conn.execute(
                query,
                session_id,
                user_id,
                message,
                response,
                agents_consulted,
                datetime.now()
            )
            return True
    except Exception as e:
        logger.error(f"Failed to store conversation: {e}")
        return False


async def get_conversation_history(
    db_pool: Optional[asyncpg.Pool],
    session_id: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Get conversation history for session"""
    if db_pool is None:
        return []

    try:
        async with db_pool.acquire() as conn:
            query = """
            SELECT user_message, assistant_response, agents_consulted, created_at
            FROM conversations
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """
            rows = await conn.fetch(query, session_id, limit)
            return [dict(row) for row in reversed(rows)]
    except Exception as e:
        logger.error(f"Failed to get conversation history: {e}")
        return []
