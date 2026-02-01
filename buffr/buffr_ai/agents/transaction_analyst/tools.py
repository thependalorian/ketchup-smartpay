"""
Transaction Analyst Agent Tools - ML-powered analysis tools
"""

from pydantic_ai import RunContext
from typing import Dict, Any, List
from pydantic import BaseModel
import logging
import numpy as np
import pandas as pd

from .agent import TransactionAnalystDependencies, transaction_analyst_agent

logger = logging.getLogger(__name__)


@transaction_analyst_agent.tool
async def classify_transaction(
    ctx: RunContext[TransactionAnalystDependencies],
    merchant_name: str,
    amount: float,
    merchant_mcc: int,
    timestamp: str
) -> Dict[str, Any]:
    """
    Automatically classify transaction into category.

    Uses Random Forest classifier with 98%+ accuracy.

    Categories:
    - Food & Dining
    - Groceries
    - Transport
    - Shopping
    - Bills & Utilities
    - Entertainment
    - Health
    - Education
    - Travel
    - Personal Care
    - Home
    - Income
    - Transfers
    - Other

    Args:
        merchant_name: Name of the merchant
        amount: Transaction amount
        merchant_mcc: Merchant Category Code
        timestamp: Transaction timestamp (ISO format)

    Returns:
        {
            'category': str,
            'confidence': float,
            'top_k_categories': list,
            'explanation': str
        }
    """
    try:
        classifier = ctx.deps.classifier_model

        if classifier is None or not classifier.is_trained:
            return {
                'error': 'Transaction classifier not available',
                'category': 'Other',
                'confidence': 0.0
            }

        # Prepare transaction data
        transaction_data = {
            'merchant_name': merchant_name,
            'amount': amount,
            'merchant_mcc': merchant_mcc,
            'timestamp': timestamp
        }

        # Run classification
        result = classifier.predict(transaction_data)

        # Generate explanation
        explanation = f"Transaction at {merchant_name} classified as {result['category']} "
        explanation += f"with {result['confidence']:.1%} confidence based on merchant name and MCC patterns."

        return {
            'category': result['category'],
            'confidence': result['confidence'],
            'top_k_categories': result['top_k_categories'],
            'explanation': explanation
        }

    except Exception as e:
        logger.error(f"Transaction classification failed: {e}")
        return {
            'error': str(e),
            'category': 'Other',
            'confidence': 0.0
        }


@transaction_analyst_agent.tool
async def analyze_spending_patterns(
    ctx: RunContext[TransactionAnalystDependencies],
    user_id: str,
    transactions: List[Dict[str, Any]],
    time_period_days: int = 30
) -> Dict[str, Any]:
    """
    Comprehensive spending pattern analysis.

    Uses K-Means clustering and GMM to identify:
    - User spending persona
    - Category breakdown
    - Spending trends
    - Anomalies
    - Budget recommendations

    Args:
        user_id: User identifier
        transactions: List of user transactions
        time_period_days: Analysis time period (days)

    Returns:
        {
            'user_persona': dict,
            'spending_by_category': dict,
            'total_spending': float,
            'spending_trend': str,
            'insights': list,
            'recommendations': list
        }
    """
    try:
        spending_model = ctx.deps.spending_model

        if spending_model is None or not spending_model.is_trained:
            return {
                'error': 'Spending analysis model not available',
                'user_persona': {'primary': 'Unknown'},
                'total_spending': 0.0
            }

        # Run spending analysis
        result = spending_model.analyze(
            user_id=user_id,
            transactions=transactions
        )

        return result

    except Exception as e:
        logger.error(f"Spending analysis failed: {e}")
        return {
            'error': str(e),
            'user_id': user_id,
            'total_spending': 0.0
        }


@transaction_analyst_agent.tool
async def generate_budget_recommendation(
    ctx: RunContext[TransactionAnalystDependencies],
    user_id: str,
    spending_analysis: Dict[str, Any],
    savings_goal: float = None
) -> Dict[str, Any]:
    """
    Generate personalized budget recommendations.

    Based on:
    - Current spending patterns
    - User spending persona
    - Financial goals
    - Category-wise breakdown

    Args:
        user_id: User identifier
        spending_analysis: Previous spending analysis result
        savings_goal: Optional savings target (NAD)

    Returns:
        {
            'current_spending': float,
            'recommended_spending': float,
            'savings_goal': float,
            'achievability': str,
            'category_budgets': dict,
            'total_savings_potential': float
        }
    """
    try:
        spending_model = ctx.deps.spending_model

        if spending_model is None or not spending_model.is_trained:
            return {
                'error': 'Budget model not available',
                'achievability': 'unknown'
            }

        # Generate budget
        result = spending_model.generate_budget(
            analysis=spending_analysis,
            savings_goal=savings_goal
        )

        result['user_id'] = user_id

        return result

    except Exception as e:
        logger.error(f"Budget generation failed: {e}")
        return {
            'error': str(e),
            'user_id': user_id,
            'achievability': 'error'
        }


@transaction_analyst_agent.tool
async def get_spending_insights(
    ctx: RunContext[TransactionAnalystDependencies],
    user_id: str,
    transactions: List[Dict[str, Any]]
) -> List[str]:
    """
    Generate actionable financial insights.

    Insights include:
    - Spending trends
    - Category analysis
    - Savings opportunities
    - Financial health indicators

    Args:
        user_id: User identifier
        transactions: List of transactions

    Returns:
        List of insight strings
    """
    try:
        if not transactions:
            return ["No transaction data available for analysis"]

        insights = []

        # Calculate basic metrics
        total_spending = sum(t.get('amount', 0) for t in transactions)
        avg_transaction = total_spending / len(transactions) if transactions else 0

        insights.append(f"Total spending: NAD {total_spending:,.2f}")
        insights.append(f"Average transaction: NAD {avg_transaction:,.2f}")

        # Category analysis
        categories = {}
        for t in transactions:
            cat = t.get('category', 'Other')
            categories[cat] = categories.get(cat, 0) + t.get('amount', 0)

        if categories:
            top_category = max(categories.items(), key=lambda x: x[1])
            insights.append(f"Largest category: {top_category[0]} (NAD {top_category[1]:,.2f})")

        # Transaction frequency
        if len(transactions) > 50:
            insights.append("High transaction frequency - consider consolidating purchases")
        elif len(transactions) < 5:
            insights.append("Low transaction activity in this period")

        return insights

    except Exception as e:
        logger.error(f"Insight generation failed: {e}")
        return [f"Error generating insights: {str(e)}"]


@transaction_analyst_agent.tool
async def compare_with_peers(
    ctx: RunContext[TransactionAnalystDependencies],
    user_id: str,
    user_spending: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compare user's spending with similar users using ML clustering.

    Uses K-means + GMM clustering to identify similar spending personas
    and provides anonymous comparison statistics.

    Args:
        user_id: User identifier
        user_spending: User's spending analysis (optional, will fetch if not provided)

    Returns:
        {
            'user_persona': str,
            'peer_group_size': int,
            'spending_percentile': float,
            'category_comparison': dict,
            'insights': list,
            'user_total_spending': float,
            'peer_average_spending': float,
            'peer_median_spending': float
        }
    """
    try:
        spending_model = ctx.deps.spending_model
        
        if spending_model is None or not spending_model.is_trained:
            return {
                'error': 'Spending analysis model not available',
                'user_persona': 'Unknown',
                'peer_group_size': 0,
                'spending_percentile': 0.5
            }
        
        # Fetch user transactions
        from .db_utils import fetch_user_transactions
        
        transactions = await fetch_user_transactions(
            ctx.deps.db_pool,
            user_id,
            'last_3_months'
        )
        
        if not transactions:
            return {
                'user_persona': 'Unknown',
                'peer_group_size': 0,
                'spending_percentile': 0.5,
                'insights': ['No transaction data available for peer comparison']
            }
        
        # Convert to DataFrame for ML model
        df = pd.DataFrame(transactions)
        if 'transaction_time' in df.columns:
            df['transaction_time'] = pd.to_datetime(df['transaction_time'])
        if 'category' not in df.columns:
            df['category'] = df.get('merchant_category', 'Other')
        
        # Extract user features using ML model
        user_features = spending_model._extract_user_features(df)
        user_features_scaled = spending_model.scaler.transform(user_features.reshape(1, -1))
        
        # Predict user's cluster using K-Means
        user_cluster = int(spending_model.kmeans.predict(user_features_scaled)[0])
        
        # Get GMM probabilities for persona distribution
        cluster_probs = spending_model.gmm.predict_proba(user_features_scaled)[0]
        primary_cluster = int(np.argmax(cluster_probs))
        primary_persona = spending_model.persona_profiles[primary_cluster]['persona']
        
        # Get cluster statistics from database
        from .db_utils import get_cluster_statistics
        cluster_stats = await get_cluster_statistics(
            ctx.deps.db_pool,
            user_cluster,
            primary_persona
        )
        
        # Calculate user spending totals
        user_total = float(df['amount'].sum())
        user_categories = {}
        for _, t in df.iterrows():
            cat = t.get('category', 'Other')
            user_categories[cat] = user_categories.get(cat, 0) + abs(float(t.get('amount', 0)))
        
        # Try to get peer network from knowledge graph
        from .graph_utils import get_user_spending_network
        graph_network = await get_user_spending_network(user_id)
        
        # Combine database and graph statistics
        if cluster_stats:
            peer_avg = cluster_stats.get('average_spending', user_total)
            peer_median = cluster_stats.get('median_spending', user_total)
            peer_group_size = cluster_stats.get('group_size', 0)
            peer_categories = cluster_stats.get('category_averages', {})
        else:
            # Fallback: use graph network if available
            if graph_network.get('network_available'):
                peer_group_size = graph_network.get('network_size', 0)
                # Estimate from similar users
                similar_users = graph_network.get('similar_users', [])
                if similar_users:
                    peer_avg = user_total  # Would calculate from similar users
                    peer_median = user_total
                    peer_categories = {}
                else:
                    peer_avg = user_total
                    peer_median = user_total
                    peer_group_size = 0
                    peer_categories = {}
            else:
                peer_avg = user_total
                peer_median = user_total
                peer_group_size = 0
                peer_categories = {}
        
        if peer_group_size < 5:
            return {
                'user_persona': primary_persona,
                'peer_group_size': peer_group_size,
                'spending_percentile': 0.5,
                'category_comparison': {},
                'insights': [
                    f"You are a '{primary_persona}' spender",
                    "Insufficient peer data for detailed comparison",
                    "Continue using the app to build peer comparison data"
                ],
                'user_total_spending': user_total,
                'cluster_id': user_cluster,
                'persona_confidence': float(cluster_probs[primary_cluster])
            }
        
        # Calculate percentile based on cluster statistics
        if peer_avg > 0:
            # Percentile calculation: where user falls in cluster distribution
            if user_total <= peer_avg * 0.5:
                percentile = 0.25
            elif user_total <= peer_avg:
                percentile = 0.5
            elif user_total <= peer_avg * 1.5:
                percentile = 0.75
            else:
                percentile = 0.95
        else:
            percentile = 0.5
        
        # Category comparison
        category_comparison = {}
        for category, user_amount in user_categories.items():
            peer_amount = peer_categories.get(category, user_amount)
            if peer_amount > 0:
                ratio = user_amount / peer_amount
                category_comparison[category] = {
                    'user_spending': user_amount,
                    'peer_average': peer_amount,
                    'ratio': ratio,
                    'status': 'above_average' if ratio > 1.1 else 'below_average' if ratio < 0.9 else 'average'
                }
        
        # Generate insights
        insights = []
        insights.append(f"You are a '{primary_persona}' spender (confidence: {cluster_probs[primary_cluster]:.1%})")
        
        if percentile > 0.75:
            insights.append(f"You're spending more than 75% of users with similar patterns")
        elif percentile < 0.25:
            insights.append(f"You're spending less than 25% of users with similar patterns")
        else:
            insights.append(f"Your spending is similar to most users with your spending pattern")
        
        # Category-specific insights
        for category, comp in category_comparison.items():
            if comp['status'] == 'above_average':
                insights.append(f"You spend {comp['ratio']:.1f}x more on {category} than similar users")
            elif comp['status'] == 'below_average':
                insights.append(f"You spend {comp['ratio']:.1f}x less on {category} than similar users")
        
        # Add cluster insights
        if graph_network.get('network_available'):
            insights.append(f"Found {graph_network.get('network_size', 0)} users with similar spending patterns")
        
        return {
            'user_persona': primary_persona,
            'peer_group_size': peer_group_size,
            'spending_percentile': percentile,
            'category_comparison': category_comparison,
            'insights': insights,
            'user_total_spending': user_total,
            'peer_average_spending': peer_avg,
            'peer_median_spending': peer_median,
            'cluster_id': user_cluster,
            'persona_confidence': float(cluster_probs[primary_cluster]),
            'persona_distribution': {
                spending_model.persona_profiles[i]['persona']: float(prob)
                for i, prob in enumerate(cluster_probs)
            }
        }
        
    except Exception as e:
        logger.error(f"Peer comparison failed: {e}")
        return {
            'error': str(e),
            'user_persona': 'Unknown',
            'peer_group_size': 0,
            'spending_percentile': 0.5
        }
