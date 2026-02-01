#!/usr/bin/env python3
"""
Create missing database tables for Buffr AI Backend

Creates:
- conversations table (for Companion Agent)
- exchange_rates table (for Exchange Rate Service)
- exchange_rate_fetch_log table (for rate limiting)

Usage:
    python scripts/create_tables.py
"""

import os
import sys
import asyncio
import asyncpg
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent / '.env.local')

SQL_FILE = Path(__file__).parent.parent / 'sql' / 'create_missing_tables.sql'


async def create_tables():
    """Create missing tables from SQL file"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        print("   Set it in .env.local or export it:")
        print("   export DATABASE_URL='postgresql://user:pass@localhost/dbname'")
        sys.exit(1)
    
    if not SQL_FILE.exists():
        print(f"❌ ERROR: SQL file not found: {SQL_FILE}")
        sys.exit(1)
    
    print("📋 Creating missing tables for Buffr AI Backend...")
    print(f"   Database: {database_url.split('@')[-1] if '@' in database_url else 'unknown'}")
    print(f"   SQL File: {SQL_FILE}")
    print()
    
    try:
        # Read SQL file
        with open(SQL_FILE, 'r') as f:
            sql = f.read()
        
        # Connect to database
        conn = await asyncpg.connect(database_url)
        
        try:
            # Execute SQL
            await conn.execute(sql)
            print("✅ Successfully created tables:")
            print("   - conversations")
            print("   - exchange_rates")
            print("   - exchange_rate_fetch_log")
            print()
            print("✅ All tables created successfully!")
            
        except Exception as e:
            print(f"❌ Error executing SQL: {e}")
            sys.exit(1)
        finally:
            await conn.close()
            
    except asyncpg.InvalidPasswordError:
        print("❌ ERROR: Invalid database password")
        sys.exit(1)
    except asyncpg.InvalidCatalogNameError:
        print("❌ ERROR: Database does not exist")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(create_tables())
