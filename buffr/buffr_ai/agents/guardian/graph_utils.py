"""
Guardian Agent - Knowledge Graph Utilities (Neo4j/Graphiti)
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

    Optional: Knowledge graph for relationship analysis
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

        logger.info("Neo4j connection initialized")

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


async def update_transaction_graph(
    neo4j_client: Optional[Any],
    transaction_data: Dict[str, Any],
    fraud_result: Dict[str, Any]
) -> bool:
    """
    Update knowledge graph with transaction relationships

    Args:
        neo4j_client: Neo4j client
        transaction_data: Transaction information
        fraud_result: Fraud detection result

    Returns:
        Success status
    """
    if neo4j_client is None or _neo4j_driver is None:
        logger.debug("Knowledge graph not available")
        return False

    try:
        async with _neo4j_driver.session() as session:
            # Create/update user node
            await session.run(
                """
                MERGE (u:User {id: $user_id})
                SET u.last_transaction = $timestamp
                """,
                user_id=transaction_data.get('user_id'),
                timestamp=datetime.now().isoformat()
            )

            # Create/update merchant node
            await session.run(
                """
                MERGE (m:Merchant {id: $merchant_id, name: $merchant_name})
                SET m.mcc = $mcc
                """,
                merchant_id=transaction_data.get('merchant_id'),
                merchant_name=transaction_data.get('merchant_name'),
                mcc=transaction_data.get('merchant_mcc')
            )

            # Create transaction relationship
            await session.run(
                """
                MATCH (u:User {id: $user_id})
                MATCH (m:Merchant {id: $merchant_id})
                CREATE (u)-[t:TRANSACTED_WITH {
                    transaction_id: $transaction_id,
                    amount: $amount,
                    timestamp: $timestamp,
                    is_fraud: $is_fraud,
                    risk_level: $risk_level
                }]->(m)
                """,
                user_id=transaction_data.get('user_id'),
                merchant_id=transaction_data.get('merchant_id'),
                transaction_id=transaction_data.get('transaction_id'),
                amount=transaction_data.get('amount'),
                timestamp=datetime.now().isoformat(),
                is_fraud=fraud_result.get('is_fraud'),
                risk_level=fraud_result.get('risk_level', 'UNKNOWN')
            )

            logger.info(f"Transaction graph updated: {transaction_data.get('transaction_id')}")
            return True

    except Exception as e:
        logger.error(f"Failed to update transaction graph: {e}")
        return False


async def get_merchant_risk_network(
    merchant_id: str,
    depth: int = 2
) -> Dict[str, Any]:
    """
    Analyze merchant's risk network

    Args:
        merchant_id: Merchant identifier
        depth: Graph traversal depth

    Returns:
        Network analysis result
    """
    if _neo4j_driver is None:
        return {
            'merchant_id': merchant_id,
            'network_available': False
        }

    try:
        async with _neo4j_driver.session() as session:
            # Find connected merchants through shared users
            result = await session.run(
                """
                MATCH (m:Merchant {id: $merchant_id})<-[:TRANSACTED_WITH]-(u:User)
                     -[:TRANSACTED_WITH]->(related:Merchant)
                WHERE related.id <> m.id
                WITH related, COUNT(DISTINCT u) as shared_users
                RETURN related.id as merchant_id,
                       related.name as merchant_name,
                       shared_users
                ORDER BY shared_users DESC
                LIMIT 10
                """,
                merchant_id=merchant_id
            )

            related_merchants = []
            async for record in result:
                related_merchants.append({
                    'merchant_id': record['merchant_id'],
                    'merchant_name': record['merchant_name'],
                    'shared_users': record['shared_users']
                })

            return {
                'merchant_id': merchant_id,
                'network_available': True,
                'related_merchants': related_merchants,
                'network_size': len(related_merchants)
            }

    except Exception as e:
        logger.error(f"Failed to analyze merchant network: {e}")
        return {
            'merchant_id': merchant_id,
            'network_available': False,
            'error': str(e)
        }


async def get_user_transaction_patterns(
    user_id: str
) -> Dict[str, Any]:
    """
    Analyze user's transaction patterns from graph

    Args:
        user_id: User identifier

    Returns:
        Pattern analysis result
    """
    if _neo4j_driver is None:
        return {
            'user_id': user_id,
            'patterns_available': False
        }

    try:
        async with _neo4j_driver.session() as session:
            # Analyze merchant diversity
            result = await session.run(
                """
                MATCH (u:User {id: $user_id})-[t:TRANSACTED_WITH]->(m:Merchant)
                RETURN COUNT(DISTINCT m) as merchant_count,
                       AVG(t.amount) as avg_amount,
                       SUM(CASE WHEN t.is_fraud THEN 1 ELSE 0 END) as fraud_count,
                       COUNT(t) as total_transactions
                """,
                user_id=user_id
            )

            record = await result.single()

            if record:
                return {
                    'user_id': user_id,
                    'patterns_available': True,
                    'merchant_diversity': record['merchant_count'],
                    'avg_transaction_amount': float(record['avg_amount'] or 0),
                    'fraud_incidents': record['fraud_count'],
                    'total_transactions': record['total_transactions']
                }

    except Exception as e:
        logger.error(f"Failed to analyze user patterns: {e}")

    return {
        'user_id': user_id,
        'patterns_available': False
    }
