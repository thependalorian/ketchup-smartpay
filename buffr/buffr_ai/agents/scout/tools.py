"""
Scout Agent Tools - Market Intelligence & Forecasting
"""

from pydantic_ai import RunContext
from typing import Dict, Any, List, Optional
import logging
import numpy as np
# Optional pandas import
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None
from datetime import datetime, timedelta
# Optional duckduckgo_search import
try:
    from duckduckgo_search import DDGS
    DDGS_AVAILABLE = True
except ImportError:
    DDGS_AVAILABLE = False
    DDGS = None

from .agent import ScoutDependencies, scout_agent

logger = logging.getLogger(__name__)


@scout_agent.tool
async def search_namibian_financial_info(
    ctx: RunContext[ScoutDependencies],
    query: str,
    max_results: int = 5
) -> List[Dict[str, Any]]:
    """
    Search for information from Namibian financial institutions and regulators.

    Uses DuckDuckGo to search specifically for information from:
    - Bank of Namibia (BoN)
    - NAMFISA (Namibia Financial Institutions Supervisory Authority)
    - Ministry of Finance
    - Namibian Stock Exchange (NSX)
    - Commercial banks (FNB, Standard Bank, Bank Windhoek, Nedbank)

    Args:
        query: Search query for Namibian financial information
        max_results: Maximum number of results to return (default 5)

    Returns:
        List of search results with title, link, and snippet
    """
    try:
        # Enhance query with Namibian financial context
        enhanced_query = f"{query} site:bon.com.na OR site:namfisa.com.na OR site:mof.gov.na OR site:nsx.com.na OR namibia finance"

        logger.info(f"Searching: {enhanced_query}")

        results = []

        with DDGS() as ddgs:
            search_results = ddgs.text(
                enhanced_query,
                max_results=max_results,
                region='wt-wt',  # Worldwide
                safesearch='moderate'
            )

            for result in search_results:
                results.append({
                    'title': result.get('title', ''),
                    'link': result.get('href', ''),
                    'snippet': result.get('body', ''),
                    'source': 'DuckDuckGo'
                })

        logger.info(f"Found {len(results)} results")

        if not results:
            return [{
                'title': 'No results found',
                'snippet': f'No recent information found for: {query}',
                'link': '',
                'source': 'DuckDuckGo'
            }]

        return results

    except Exception as e:
        logger.error(f"Search failed: {e}")
        return [{
            'title': 'Search Error',
            'snippet': f'Failed to search: {str(e)}',
            'link': '',
            'source': 'Error'
        }]


@scout_agent.tool
async def get_bon_exchange_rates(
    ctx: RunContext[ScoutDependencies]
) -> Dict[str, Any]:
    """
    Get current NAD exchange rates from Bank of Namibia.

    Searches for latest exchange rate information from BoN website.

    Returns:
        {
            'rates': dict,
            'last_updated': str,
            'source': str
        }
    """
    try:
        # Search for latest BoN exchange rates
        search_results = await search_namibian_financial_info(
            ctx,
            query="Bank of Namibia exchange rates NAD USD EUR ZAR",
            max_results=3
        )

        # Parse exchange rates from search results
        # In production, this would parse the BoN website or use their API
        rates = {
            'USD_NAD': 18.50,  # Default fallback rates
            'EUR_NAD': 20.10,
            'ZAR_NAD': 1.00,  # NAD pegged to ZAR
            'GBP_NAD': 23.50
        }
        
        # Try to extract rates from search results
        for result in search_results:
            snippet = result.get('snippet', '').lower()
            # Look for rate patterns in search results
            import re
            usd_match = re.search(r'usd.*?(\d+\.?\d*)', snippet)
            eur_match = re.search(r'eur.*?(\d+\.?\d*)', snippet)
            
            if usd_match:
                try:
                    rates['USD_NAD'] = float(usd_match.group(1))
                except:
                    pass
            if eur_match:
                try:
                    rates['EUR_NAD'] = float(eur_match.group(1))
                except:
                    pass
        
        return {
            'rates': rates,
            'last_updated': datetime.now().isoformat(),
            'source': 'Bank of Namibia (via search)',
            'search_results': search_results,
            'note': 'Exchange rates are indicative. Verify with Bank of Namibia for official rates.',
            'method': 'search_based' if search_results else 'fallback'
        }

    except Exception as e:
        logger.error(f"Exchange rate fetch failed: {e}")
        return {
            'rates': {},
            'error': str(e),
            'source': 'Error'
        }


@scout_agent.tool
async def forecast_spending_trend(
    ctx: RunContext[ScoutDependencies],
    user_id: str,
    forecast_days: int = 30
) -> Dict[str, Any]:
    """
    Forecast future spending trends using historical data.

    Uses simple linear regression for trend forecasting.

    Args:
        user_id: User identifier
        forecast_days: Number of days to forecast (default 30)

    Returns:
        {
            'forecast': list,
            'trend': str,
            'confidence': float,
            'insights': list
        }
    """
    try:
        # Fetch historical transactions
        from .db_utils import fetch_user_transactions
        transactions = await fetch_user_transactions(
            ctx.deps.db_pool,
            user_id,
            days=90
        )

        if not transactions or len(transactions) < 7:
            return {
                'forecast': [],
                'trend': 'insufficient_data',
                'confidence': 0.0,
                'insights': ['Need at least 7 days of transaction history for forecasting']
            }

        # Convert to pandas DataFrame
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['transaction_time']).dt.date
        daily_spending = df.groupby('date')['amount'].sum().reset_index()

        # Simple linear regression
        X = np.arange(len(daily_spending)).reshape(-1, 1)
        y = daily_spending['amount'].values

        # Calculate trend
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(X, y)

        # Forecast
        future_X = np.arange(len(daily_spending), len(daily_spending) + forecast_days).reshape(-1, 1)
        forecast = model.predict(future_X)

        # Determine trend
        slope = model.coef_[0]
        if slope > 10:
            trend = 'increasing'
        elif slope < -10:
            trend = 'decreasing'
        else:
            trend = 'stable'

        # Calculate R² for confidence
        from sklearn.metrics import r2_score
        y_pred = model.predict(X)
        confidence = max(0.0, min(1.0, r2_score(y, y_pred)))

        # Generate insights
        insights = []
        avg_daily = daily_spending['amount'].mean()
        forecast_avg = forecast.mean()

        insights.append(f"Historical average: NAD {avg_daily:.2f}/day")
        insights.append(f"Forecast average: NAD {forecast_avg:.2f}/day")

        if trend == 'increasing':
            insights.append(f"Spending trend is increasing by ~NAD {abs(slope):.2f}/day")
        elif trend == 'decreasing':
            insights.append(f"Spending trend is decreasing by ~NAD {abs(slope):.2f}/day")
        else:
            insights.append("Spending pattern is stable")

        return {
            'forecast': forecast.tolist(),
            'forecast_dates': [
                (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
                for i in range(forecast_days)
            ],
            'trend': trend,
            'confidence': float(confidence),
            'insights': insights,
            'historical_avg': float(avg_daily),
            'forecast_avg': float(forecast_avg)
        }

    except Exception as e:
        logger.error(f"Forecast failed: {e}")
        return {
            'forecast': [],
            'trend': 'error',
            'confidence': 0.0,
            'insights': [f"Forecast failed: {str(e)}"]
        }


@scout_agent.tool
async def analyze_merchant_pricing(
    ctx: RunContext[ScoutDependencies],
    merchant_category: str,
    location: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze merchant pricing trends by category.

    Args:
        merchant_category: Category to analyze (e.g., 'Groceries', 'Fuel')
        location: Optional location filter

    Returns:
        {
            'category': str,
            'avg_price': float,
            'price_trend': str,
            'top_merchants': list,
            'recommendations': list
        }
    """
    try:
        from .db_utils import get_merchant_pricing_data

        pricing_data = await get_merchant_pricing_data(
            ctx.deps.db_pool,
            merchant_category,
            location
        )

        if not pricing_data:
            return {
                'category': merchant_category,
                'avg_price': 0.0,
                'price_trend': 'no_data',
                'top_merchants': [],
                'recommendations': ['Insufficient data for this category']
            }

        # Calculate statistics
        prices = [p['avg_price'] for p in pricing_data]
        avg_price = np.mean(prices)

        # Price trend (simple comparison)
        if len(prices) >= 2:
            recent_avg = np.mean(prices[-5:])
            older_avg = np.mean(prices[:-5])

            if recent_avg > older_avg * 1.05:
                price_trend = 'increasing'
            elif recent_avg < older_avg * 0.95:
                price_trend = 'decreasing'
            else:
                price_trend = 'stable'
        else:
            price_trend = 'unknown'

        # Top merchants (best value)
        top_merchants = sorted(pricing_data, key=lambda x: x['avg_price'])[:5]

        recommendations = []
        if price_trend == 'increasing':
            recommendations.append(f"{merchant_category} prices are rising. Consider shopping at budget-friendly options.")

        if top_merchants:
            cheapest = top_merchants[0]
            recommendations.append(f"Best value: {cheapest['merchant_name']} (avg NAD {cheapest['avg_price']:.2f})")

        return {
            'category': merchant_category,
            'avg_price': float(avg_price),
            'price_trend': price_trend,
            'top_merchants': [
                {
                    'name': m['merchant_name'],
                    'avg_price': float(m['avg_price']),
                    'transaction_count': m['count']
                }
                for m in top_merchants
            ],
            'recommendations': recommendations
        }

    except Exception as e:
        logger.error(f"Pricing analysis failed: {e}")
        return {
            'category': merchant_category,
            'error': str(e),
            'recommendations': []
        }


@scout_agent.tool
async def get_regulatory_updates(
    ctx: RunContext[ScoutDependencies],
    topic: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get latest regulatory updates from NAMFISA and Ministry of Finance.

    Args:
        topic: Optional topic to filter (e.g., 'banking', 'payments', 'insurance')

    Returns:
        List of regulatory updates with title, date, and link
    """
    try:
        query = "NAMFISA Ministry of Finance Namibia regulatory updates banking payments"
        if topic:
            query += f" {topic}"

        results = await search_namibian_financial_info(
            ctx,
            query=query,
            max_results=10
        )

        return results

    except Exception as e:
        logger.error(f"Regulatory updates fetch failed: {e}")
        return [{
            'title': 'Error',
            'snippet': f"Failed to fetch updates: {str(e)}",
            'link': ''
        }]


@scout_agent.tool
async def identify_spending_opportunities(
    ctx: RunContext[ScoutDependencies],
    user_id: str
) -> Dict[str, Any]:
    """
    Identify opportunities to optimize spending.

    Analyzes user's spending patterns and suggests:
    - Best times to shop
    - Category-specific opportunities
    - Potential savings

    Args:
        user_id: User identifier

    Returns:
        {
            'opportunities': list,
            'potential_savings': float,
            'recommendations': list
        }
    """
    try:
        from .db_utils import fetch_user_transactions

        transactions = await fetch_user_transactions(
            ctx.deps.db_pool,
            user_id,
            days=60
        )

        if not transactions:
            return {
                'opportunities': [],
                'potential_savings': 0.0,
                'recommendations': ['Need transaction history to identify opportunities']
            }

        df = pd.DataFrame(transactions)

        opportunities = []
        total_savings = 0.0

        # Analyze by category
        category_spending = df.groupby('category')['amount'].agg(['sum', 'mean', 'count'])

        for category, stats in category_spending.iterrows():
            if stats['sum'] > 1000:  # Significant spending
                potential_saving = stats['sum'] * 0.10  # Assume 10% savings potential
                opportunities.append({
                    'category': category,
                    'current_spending': float(stats['sum']),
                    'potential_saving': float(potential_saving),
                    'suggestion': f"Consider budget-friendly alternatives in {category}"
                })
                total_savings += potential_saving

        # Day of week analysis
        df['day_of_week'] = pd.to_datetime(df['transaction_time']).dt.day_name()
        day_spending = df.groupby('day_of_week')['amount'].sum()

        cheapest_day = day_spending.idxmin()
        opportunities.append({
            'type': 'timing',
            'suggestion': f"{cheapest_day} tends to have lower spending. Consider major purchases on this day.",
            'potential_saving': 0.0
        })

        recommendations = [
            f"Total potential savings: NAD {total_savings:.2f}/month",
            f"Focus on {category_spending['sum'].idxmax()} category for maximum impact"
        ]

        return {
            'opportunities': opportunities,
            'potential_savings': float(total_savings),
            'recommendations': recommendations
        }

    except Exception as e:
        logger.error(f"Opportunity identification failed: {e}")
        return {
            'opportunities': [],
            'potential_savings': 0.0,
            'recommendations': [f"Analysis failed: {str(e)}"]
        }
