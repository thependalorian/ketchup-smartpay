"""
API Endpoints to Database Schema Mapping Validation Tests

Location: buffr_ai/tests/test_api_database_mapping.py
Purpose: Validate that all Python AI backend endpoints correctly map to database tables

Usage:
    pytest buffr_ai/tests/test_api_database_mapping.py -v
    python -m pytest buffr_ai/tests/test_api_database_mapping.py -v
"""

import pytest
import os
import asyncio
from typing import List, Dict, Any
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("NEON_CONNECTION_STRING")

# Documented endpoints from API_ENDPOINTS_DATABASE_MAPPING.md
PYTHON_AI_ENDPOINTS = [
    {"method": "GET", "path": "/", "tables": []},
    {"method": "GET", "path": "/health", "tables": []},
    {
        "method": "POST",
        "path": "/api/guardian/fraud/check",
        "tables": ["transactions", "fraud_checks", "users", "sessions"],
    },
    {
        "method": "POST",
        "path": "/api/guardian/credit/assess",
        "tables": ["users", "transactions", "credit_assessments", "merchants"],
    },
    {
        "method": "POST",
        "path": "/api/guardian/chat",
        "tables": ["sessions", "fraud_checks", "credit_assessments", "transactions"],
    },
    {"method": "GET", "path": "/api/guardian/health", "tables": []},
    {
        "method": "POST",
        "path": "/api/transaction-analyst/classify",
        "tables": ["transactions", "transaction_categories"],
    },
    {
        "method": "POST",
        "path": "/api/transaction-analyst/analyze",
        "tables": [
            "transactions",
            "transaction_categories",
            "user_spending_features",
            "spending_personas",
            "spending_analyses",
        ],
    },
    {
        "method": "POST",
        "path": "/api/transaction-analyst/budget",
        "tables": [
            "transactions",
            "transaction_categories",
            "user_spending_features",
            "spending_personas",
            "spending_analyses",
        ],
    },
    {
        "method": "POST",
        "path": "/api/transaction-analyst/chat",
        "tables": ["transactions", "spending_analyses", "transaction_categories"],
    },
    {"method": "GET", "path": "/api/transaction-analyst/health", "tables": []},
    {
        "method": "POST",
        "path": "/api/companion/chat",
        "tables": [
            "sessions",
            "conversations",
            "users",
            "transactions",
            "financial_goals",
            "literacy_assessments",
        ],
    },
    {
        "method": "POST",
        "path": "/api/companion/chat/stream",
        "tables": ["sessions", "conversations"],
    },
    {
        "method": "POST",
        "path": "/api/companion/multi-agent",
        "tables": [
            "transactions",
            "fraud_checks",
            "credit_assessments",
            "spending_analyses",
            "transaction_categories",
        ],
    },
    {
        "method": "GET",
        "path": "/api/companion/context/{user_id}",
        "tables": [
            "users",
            "transactions",
            "financial_goals",
            "literacy_assessments",
            "spending_personas",
            "user_spending_features",
        ],
    },
    {
        "method": "GET",
        "path": "/api/companion/history/{session_id}",
        "tables": ["conversations"],
    },
    {"method": "GET", "path": "/api/companion/health", "tables": []},
    {
        "method": "POST",
        "path": "/api/ml/fraud/check",
        "tables": ["ml_models", "predictions"],
    },
    {
        "method": "POST",
        "path": "/api/ml/credit/assess",
        "tables": ["ml_models", "predictions"],
    },
    {
        "method": "POST",
        "path": "/api/ml/transactions/classify",
        "tables": ["ml_models", "predictions", "transaction_categories"],
    },
    {
        "method": "POST",
        "path": "/api/ml/spending/analyze",
        "tables": ["ml_models", "predictions", "spending_analyses"],
    },
    {
        "method": "POST",
        "path": "/chat",
        "tables": ["documents", "chunks", "sessions", "messages"],
    },
    {
        "method": "POST",
        "path": "/chat/simple",
        "tables": ["sessions", "messages"],
    },
    {
        "method": "POST",
        "path": "/chat/stream",
        "tables": ["sessions", "messages"],
    },
    {
        "method": "POST",
        "path": "/search/vector",
        "tables": ["chunks", "documents"],
    },
    {"method": "POST", "path": "/search/graph", "tables": []},  # Neo4j external
    {
        "method": "POST",
        "path": "/search/hybrid",
        "tables": ["chunks", "documents"],
    },
    {"method": "GET", "path": "/documents", "tables": ["documents"]},
    {
        "method": "GET",
        "path": "/sessions/{session_id}",
        "tables": ["sessions", "messages"],
    },
]


@pytest.fixture
async def db_pool():
    """Create database connection pool for tests"""
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")
    
    pool = await asyncpg.create_pool(DATABASE_URL)
    yield pool
    await pool.close()


@pytest.mark.asyncio
async def test_database_connection(db_pool):
    """Test basic database connectivity"""
    async with db_pool.acquire() as conn:
        result = await conn.fetchval("SELECT 1")
        assert result == 1


@pytest.mark.asyncio
async def test_table_exists(db_pool, table_name: str):
    """Test if a specific table exists"""
    async with db_pool.acquire() as conn:
        result = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            )
            """,
            table_name,
        )
        return result


@pytest.mark.asyncio
async def test_all_documented_tables_exist(db_pool):
    """Test that all tables documented in API_ENDPOINTS_DATABASE_MAPPING.md exist"""
    all_tables = set()
    for endpoint in PYTHON_AI_ENDPOINTS:
        all_tables.update(endpoint.get("tables", []))
    
    missing_tables = []
    for table in all_tables:
        exists = await test_table_exists(db_pool, table)
        if not exists:
            missing_tables.append(table)
    
    if missing_tables:
        pytest.fail(f"Missing tables: {', '.join(missing_tables)}")


@pytest.mark.asyncio
async def test_critical_tables_exist(db_pool):
    """Test that critical tables for AI backend exist"""
    critical_tables = [
        "users",
        "transactions",
        "fraud_checks",
        "credit_assessments",
        "spending_analyses",
        "transaction_categories",
        "sessions",
        "messages",
        "conversations",
        "ml_models",
        "predictions",
    ]
    
    missing = []
    for table in critical_tables:
        exists = await test_table_exists(db_pool, table)
        if not exists:
            missing.append(table)
    
    assert len(missing) == 0, f"Critical tables missing: {', '.join(missing)}"


@pytest.mark.parametrize("endpoint", PYTHON_AI_ENDPOINTS)
@pytest.mark.asyncio
async def test_endpoint_table_mapping(db_pool, endpoint: Dict[str, Any]):
    """Test that each endpoint's documented tables exist"""
    tables = endpoint.get("tables", [])
    if not tables:
        pytest.skip(f"Endpoint {endpoint['path']} has no database tables")
    
    missing = []
    for table in tables:
        exists = await test_table_exists(db_pool, table)
        if not exists:
            missing.append(table)
    
    if missing:
        pytest.fail(
            f"Endpoint {endpoint['method']} {endpoint['path']} references missing tables: {', '.join(missing)}"
        )


def test_endpoint_count():
    """Test that we have the expected number of endpoints"""
    assert len(PYTHON_AI_ENDPOINTS) >= 25, "Expected at least 25 Python AI endpoints"


def test_endpoint_documentation_completeness():
    """Test that all endpoints have required documentation fields"""
    for endpoint in PYTHON_AI_ENDPOINTS:
        assert "method" in endpoint, f"Endpoint missing 'method': {endpoint}"
        assert "path" in endpoint, f"Endpoint missing 'path': {endpoint}"
        assert "tables" in endpoint, f"Endpoint missing 'tables': {endpoint}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
