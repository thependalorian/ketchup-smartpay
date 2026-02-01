"""
Mentor Agent - Knowledge Graph Utilities (Neo4j/Graphiti)
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

    Optional: Knowledge graph for financial education and learning paths
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

        logger.info("Neo4j connection initialized for Mentor Agent")

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


async def update_learning_path_graph(
    neo4j_client: Optional[Any],
    user_id: str,
    learning_data: Dict[str, Any]
) -> bool:
    """
    Update knowledge graph with user's learning progress

    Args:
        neo4j_client: Neo4j client
        user_id: User identifier
        learning_data: Learning progress data

    Returns:
        Success status
    """
    if neo4j_client is None or _neo4j_driver is None:
        logger.debug("Knowledge graph not available")
        return False

    try:
        async with _neo4j_driver.session() as session:
            # Create/update user learning profile
            await session.run(
                """
                MERGE (u:User {id: $user_id})
                SET u.financial_literacy_level = $level,
                    u.completed_modules = $completed,
                    u.learning_score = $score,
                    u.last_updated = $timestamp
                """,
                user_id=user_id,
                level=learning_data.get('literacy_level', 'beginner'),
                completed=learning_data.get('completed_modules', []),
                score=learning_data.get('learning_score', 0),
                timestamp=datetime.now().isoformat()
            )

            # Create module relationships
            for module in learning_data.get('completed_modules', []):
                await session.run(
                    """
                    MERGE (m:Module {id: $module_id})
                    MERGE (u:User {id: $user_id})
                    MERGE (u)-[c:COMPLETED {
                        completed_at: $timestamp,
                        score: $score
                    }]->(m)
                    """,
                    module_id=module.get('id'),
                    user_id=user_id,
                    timestamp=datetime.now().isoformat(),
                    score=module.get('score', 0)
                )

            logger.info(f"Learning path graph updated for user: {user_id}")
            return True

    except Exception as e:
        logger.error(f"Failed to update learning path graph: {e}")
        return False


async def get_recommended_learning_path(
    user_id: str
) -> Dict[str, Any]:
    """
    Get recommended learning path based on user's current level

    Args:
        user_id: User identifier

    Returns:
        Recommended learning path
    """
    if _neo4j_driver is None:
        return {
            'user_id': user_id,
            'path_available': False
        }

    try:
        async with _neo4j_driver.session() as session:
            # Find recommended modules based on user's level and completed modules
            result = await session.run(
                """
                MATCH (u:User {id: $user_id})
                MATCH (m:Module)
                WHERE NOT (u)-[:COMPLETED]->(m)
                  AND m.difficulty <= u.financial_literacy_level + 1
                RETURN m.id as module_id,
                       m.name as name,
                       m.difficulty as difficulty,
                       m.category as category
                ORDER BY m.difficulty ASC, m.priority DESC
                LIMIT 10
                """,
                user_id=user_id
            )

            recommended_modules = []
            async for record in result:
                recommended_modules.append({
                    'module_id': record['module_id'],
                    'name': record['name'],
                    'difficulty': record['difficulty'],
                    'category': record['category']
                })

            return {
                'user_id': user_id,
                'path_available': True,
                'recommended_modules': recommended_modules,
                'count': len(recommended_modules)
            }

    except Exception as e:
        logger.error(f"Failed to get recommended learning path: {e}")
        return {
            'user_id': user_id,
            'path_available': False,
            'error': str(e)
        }
