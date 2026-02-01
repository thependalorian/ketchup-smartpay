"""
Transaction Analyst Agent - Knowledge Graph Utilities (Neo4j/Graphiti)
"""

import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

# Neo4j connection (optional - will implement when needed)
_neo4j_driver: Optional[Any] = None


async def initialize_graph():
    """
    Initialize Neo4j/Graphiti connection

    Optional: Knowledge graph for spending pattern analysis
    """
    global _neo4j_driver

    neo4j_uri = os.getenv("NEO4J_URI")

    if not neo4j_uri:
        logger.info("Neo4j not configured, knowledge graph features disabled")
        return None

    try:
        from neo4j import AsyncGraphDatabase

        _neo4j_driver = AsyncGraphDatabase.driver(
            neo4j_uri,
            auth=(
                os.getenv("NEO4J_USER", "neo4j"),
                os.getenv("NEO4J_PASSWORD")
            )
        )

        logger.info("Neo4j connection initialized for Transaction Analyst")

    except ImportError:
        logger.warning("Neo4j driver not installed, knowledge graph features disabled")
    except Exception as e:
        logger.error(f"Failed to initialize Neo4j: {e}")


async def close_graph():
    """Close Neo4j connection"""
    global _neo4j_driver

    if _neo4j_driver:
        await _neo4j_driver.close()
        _neo4j_driver = None
        logger.info("Neo4j connection closed")


async def update_spending_graph(
    neo4j_client: Optional[Any],
    user_id: str,
    analysis: Dict[str, Any]
) -> bool:
    """
    Update knowledge graph with spending analysis results

    Args:
        neo4j_client: Neo4j client
        user_id: User identifier
        analysis: Spending analysis results

    Returns:
        Success status
    """
    if neo4j_client is None or _neo4j_driver is None:
        logger.debug("Knowledge graph not available")
        return False

    try:
        async with _neo4j_driver.session() as session:
            # Create/update user node with spending persona
            await session.run(
                """
                MERGE (u:User {id: $user_id})
                SET u.spending_persona = $persona,
                    u.total_spending = $total_spending,
                    u.spending_trend = $trend,
                    u.last_analysis = $timestamp
                """,
                user_id=user_id,
                persona=analysis.get('user_persona', {}).get('primary', 'unknown'),
                total_spending=analysis.get('total_spending', 0),
                trend=analysis.get('spending_trend', 'stable'),
                timestamp=datetime.now().isoformat()
            )

            # Create category relationships
            spending_by_category = analysis.get('spending_by_category', {})
            for category, amount in spending_by_category.items():
                await session.run(
                    """
                    MERGE (c:Category {name: $category})
                    MERGE (u:User {id: $user_id})
                    MERGE (u)-[s:SPENDS_IN {
                        amount: $amount,
                        percentage: $percentage,
                        updated_at: $timestamp
                    }]->(c)
                    """,
                    category=category,
                    user_id=user_id,
                    amount=amount,
                    percentage=(amount / analysis.get('total_spending', 1)) * 100,
                    timestamp=datetime.now().isoformat()
                )

            logger.info(f"Spending graph updated for user: {user_id}")
            return True

    except Exception as e:
        logger.error(f"Failed to update spending graph: {e}")
        return False


async def get_user_spending_network(
    user_id: str
) -> Dict[str, Any]:
    """
    Analyze user's spending network and similar users

    Args:
        user_id: User identifier

    Returns:
        Network analysis result
    """
    if _neo4j_driver is None:
        return {
            'user_id': user_id,
            'network_available': False
        }

    try:
        async with _neo4j_driver.session() as session:
            # Find users with similar spending patterns
            result = await session.run(
                """
                MATCH (u:User {id: $user_id})-[s1:SPENDS_IN]->(c:Category)
                MATCH (similar:User)-[s2:SPENDS_IN]->(c)
                WHERE similar.id <> u.id
                WITH similar, COUNT(c) as shared_categories,
                     SUM(ABS(s1.amount - s2.amount)) as spending_diff
                RETURN similar.id as user_id,
                       similar.spending_persona as persona,
                       shared_categories,
                       spending_diff
                ORDER BY shared_categories DESC, spending_diff ASC
                LIMIT 10
                """,
                user_id=user_id
            )

            similar_users = []
            async for record in result:
                similar_users.append({
                    'user_id': record['user_id'],
                    'persona': record['persona'],
                    'shared_categories': record['shared_categories'],
                    'spending_similarity': 1 / (1 + record['spending_diff'])
                })

            return {
                'user_id': user_id,
                'network_available': True,
                'similar_users': similar_users,
                'network_size': len(similar_users)
            }

    except Exception as e:
        logger.error(f"Failed to analyze spending network: {e}")
        return {
            'user_id': user_id,
            'network_available': False,
            'error': str(e)
        }
