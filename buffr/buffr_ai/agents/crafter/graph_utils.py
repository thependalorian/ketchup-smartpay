"""
Crafter Agent - Knowledge Graph Utilities (Neo4j/Graphiti + LangGraph)
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

    Optional: Knowledge graph for workflow automation and process optimization
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

        logger.info("Neo4j connection initialized for Crafter Agent")

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


async def update_workflow_graph(
    neo4j_client: Optional[Any],
    workflow_data: Dict[str, Any]
) -> bool:
    """
    Update knowledge graph with workflow execution data

    Args:
        neo4j_client: Neo4j client
        workflow_data: Workflow execution data

    Returns:
        Success status
    """
    if neo4j_client is None or _neo4j_driver is None:
        logger.debug("Knowledge graph not available")
        return False

    try:
        async with _neo4j_driver.session() as session:
            # Create/update workflow node
            await session.run(
                """
                MERGE (w:Workflow {id: $workflow_id})
                SET w.name = $name,
                    w.type = $type,
                    w.status = $status,
                    w.execution_count = COALESCE(w.execution_count, 0) + 1,
                    w.last_execution = $timestamp
                """,
                workflow_id=workflow_data.get('workflow_id'),
                name=workflow_data.get('name'),
                type=workflow_data.get('type'),
                status=workflow_data.get('status', 'active'),
                timestamp=datetime.now().isoformat()
            )

            # Create user-workflow relationship
            if workflow_data.get('user_id'):
                await session.run(
                    """
                    MERGE (u:User {id: $user_id})
                    MERGE (w:Workflow {id: $workflow_id})
                    MERGE (u)-[o:OWNS {
                        created_at: $timestamp,
                        enabled: $enabled
                    }]->(w)
                    """,
                    user_id=workflow_data.get('user_id'),
                    workflow_id=workflow_data.get('workflow_id'),
                    timestamp=datetime.now().isoformat(),
                    enabled=workflow_data.get('enabled', True)
                )

            logger.info(f"Workflow graph updated: {workflow_data.get('workflow_id')}")
            return True

    except Exception as e:
        logger.error(f"Failed to update workflow graph: {e}")
        return False


async def get_workflow_optimization_suggestions(
    user_id: str
) -> Dict[str, Any]:
    """
    Analyze workflows and suggest optimizations

    Args:
        user_id: User identifier

    Returns:
        Optimization suggestions
    """
    if _neo4j_driver is None:
        return {
            'user_id': user_id,
            'suggestions_available': False
        }

    try:
        async with _neo4j_driver.session() as session:
            # Find similar workflows from other users
            result = await session.run(
                """
                MATCH (u:User {id: $user_id})-[o:OWNS]->(w:Workflow)
                MATCH (other:User)-[o2:OWNS]->(similar:Workflow)
                WHERE other.id <> u.id
                  AND similar.type = w.type
                  AND similar.execution_count > w.execution_count
                RETURN similar.id as workflow_id,
                       similar.name as name,
                       similar.execution_count as executions,
                       COUNT(DISTINCT other) as user_count
                ORDER BY user_count DESC, executions DESC
                LIMIT 10
                """,
                user_id=user_id
            )

            suggestions = []
            async for record in result:
                suggestions.append({
                    'workflow_id': record['workflow_id'],
                    'name': record['name'],
                    'executions': record['executions'],
                    'popularity': record['user_count']
                })

            return {
                'user_id': user_id,
                'suggestions_available': True,
                'suggestions': suggestions,
                'count': len(suggestions)
            }

    except Exception as e:
        logger.error(f"Failed to get workflow optimization suggestions: {e}")
        return {
            'user_id': user_id,
            'suggestions_available': False,
            'error': str(e)
        }
