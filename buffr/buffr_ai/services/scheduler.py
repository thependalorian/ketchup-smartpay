"""
Background Task Scheduler
Manages scheduled tasks like exchange rate fetching

Uses APScheduler for background task scheduling
"""

import os
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

from .exchange_rate import fetch_and_store_rates

logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler: AsyncIOScheduler = None


def get_scheduler() -> AsyncIOScheduler:
    """Get or create scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
    return _scheduler


def start_exchange_rate_scheduler():
    """
    Start exchange rate scheduler.
    
    Fetches rates twice daily at 8:00 AM and 8:00 PM UTC.
    Matches TypeScript implementation schedule.
    """
    enable_scheduler = os.getenv("ENABLE_EXCHANGE_RATE_SCHEDULER", "true").lower() != "false"
    
    if not enable_scheduler:
        logger.info("[Scheduler] ⚠️  Exchange rate scheduler disabled (ENABLE_EXCHANGE_RATE_SCHEDULER=false)")
        return
    
    scheduler = get_scheduler()
    
    logger.info("[Scheduler] 🚀 Starting exchange rate scheduler...")
    logger.info("[Scheduler] 📅 Schedule: 8:00 AM and 8:00 PM UTC daily")
    logger.info("[Scheduler] 📊 Rate limit: 2 fetches/day = 60 requests/month\n")
    
    # Schedule for 8 AM and 8 PM UTC (0 8,20 * * *)
    # APScheduler can handle async functions directly
    scheduler.add_job(
        fetch_and_store_rates,
        trigger=CronTrigger(hour='8,20', minute='0', timezone='UTC'),
        id='exchange_rate_fetch',
        name='Exchange Rate Fetch',
        replace_existing=True,
        max_instances=1  # Prevent overlapping runs
    )
    
    # Start scheduler
    scheduler.start()
    logger.info("[Scheduler] ✅ Exchange rate scheduler started successfully\n")
    
    # Note: Startup fetch will be handled by FastAPI lifespan
    # (called separately to avoid blocking scheduler startup)


def stop_scheduler():
    """Stop the scheduler"""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        _scheduler = None
        logger.info("[Scheduler] 🛑 Scheduler stopped")
