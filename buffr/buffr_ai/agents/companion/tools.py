"""
Main Buffr AI Companion - Orchestration Tools

Routes and coordinates specialized agents, plus customer support functionality
"""

import logging
import uuid
import re
from typing import Dict, Any, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from buffr_ai.agent.models import ChunkResult
from datetime import datetime
from enum import Enum
from pydantic import BaseModel

from pydantic_ai import RunContext
from .agent import CompanionDependencies, companion_agent

logger = logging.getLogger(__name__)


# Support ticket enums
class TicketCategory(str, Enum):
    TECHNICAL = "TECHNICAL"
    PAYMENT = "PAYMENT"
    ACCOUNT = "ACCOUNT"
    SECURITY = "SECURITY"
    VOUCHER = "VOUCHER"
    GENERAL = "GENERAL"
    FEATURE_REQUEST = "FEATURE_REQUEST"
    BUG_REPORT = "BUG_REPORT"


class TicketPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_CUSTOMER = "WAITING_CUSTOMER"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


@companion_agent.tool
async def route_to_guardian(
    ctx: RunContext[CompanionDependencies],
    user_query: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Route request to Guardian Agent for fraud detection & credit scoring.

    Use when user asks about:
    - Transaction fraud risk
    - Credit assessment for loans
    - Risk analysis
    - Security concerns
    - Unusual account activity

    Args:
        user_query: User's fraud/credit related query
        context: Optional context (transaction data, user info)

    Returns:
        Guardian Agent response
    """
    try:
        from buffr_ai.agents.guardian import run_guardian_agent

        result = await run_guardian_agent(
            user_query=user_query,
            session_id=ctx.deps.session_id,
            user_id=ctx.deps.user_id
        )

        return {
            'agent': 'guardian',
            'query': user_query,
            'response': result.data,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Guardian routing failed: {e}")
        return {'error': str(e), 'agent': 'guardian'}


@companion_agent.tool
async def route_to_transaction_analyst(
    ctx: RunContext[CompanionDependencies],
    user_query: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Route request to Transaction Analyst for spending analysis & budgeting.

    Use when user asks about:
    - Spending patterns
    - Budget recommendations
    - Transaction categorization
    - Expense insights
    - Financial trends

    Args:
        user_query: User's spending/budget related query
        context: Optional context (transactions, categories)

    Returns:
        Transaction Analyst response
    """
    try:
        from buffr_ai.agents.transaction_analyst import run_transaction_analyst_agent

        result = await run_transaction_analyst_agent(
            user_query=user_query,
            session_id=ctx.deps.session_id,
            user_id=ctx.deps.user_id
        )

        return {
            'agent': 'transaction_analyst',
            'query': user_query,
            'response': result.data,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Transaction Analyst routing failed: {e}")
        return {'error': str(e), 'agent': 'transaction_analyst'}


# Removed: route_to_scout, route_to_mentor, route_to_crafter
# These agents are not relevant to G2P voucher platform


@companion_agent.tool
async def coordinate_multi_agent(
    ctx: RunContext[CompanionDependencies],
    user_query: str,
    agents_needed: List[str],
    orchestration_mode: str = 'sequential'
) -> Dict[str, Any]:
    """
    Coordinate multiple agents for complex queries.

    Orchestration modes:
    - sequential: Execute agents in order (results feed into next agent)
    - parallel: Execute agents concurrently (faster, independent results)
    - conditional: Execute based on previous results

    Example queries requiring multiple agents:
    - "Is this voucher transaction safe and how will it affect my balance?" (Guardian + Transaction Analyst)
    - "Check if I can use this voucher and analyze my spending" (Guardian + Transaction Analyst)

    Args:
        user_query: Complex user query
        agents_needed: List of agent names to coordinate
        orchestration_mode: How to orchestrate agents

    Returns:
        Coordinated response from multiple agents
    """
    try:
        responses = {}

        if orchestration_mode == 'sequential':
            # Execute agents in order, passing context forward
            accumulated_context = {}
            for agent_name in agents_needed:
                routing_tool = {
                    'guardian': route_to_guardian,
                    'transaction_analyst': route_to_transaction_analyst,
                    # Removed: scout, mentor, crafter (not relevant to G2P vouchers)
                }.get(agent_name)

                if routing_tool:
                    response = await routing_tool(ctx, user_query, accumulated_context)
                    responses[agent_name] = response
                    accumulated_context[agent_name] = response

        elif orchestration_mode == 'parallel':
            # Execute agents concurrently (would need asyncio.gather in production)
            import asyncio
            tasks = []
            for agent_name in agents_needed:
                routing_tool = {
                    'guardian': route_to_guardian,
                    'transaction_analyst': route_to_transaction_analyst,
                    # Removed: scout, mentor, crafter (not relevant to G2P vouchers)
                }.get(agent_name)

                if routing_tool:
                    tasks.append(routing_tool(ctx, user_query, {}))

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for i, agent_name in enumerate(agents_needed):
                responses[agent_name] = results[i] if i < len(results) else {'error': 'Not executed'}

        return {
            'orchestration_mode': orchestration_mode,
            'agents_coordinated': agents_needed,
            'query': user_query,
            'responses': responses,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Multi-agent coordination failed: {e}")
        return {'error': str(e), 'orchestration_mode': orchestration_mode}


@companion_agent.tool
async def get_user_context(
    ctx: RunContext[CompanionDependencies],
    user_id: str
) -> Dict[str, Any]:
    """
    Retrieve comprehensive user context for personalized assistance.

    Fetches:
    - Recent transactions
    - Current budgets
    - Active goals
    - Financial literacy level
    - Active workflows

    Args:
        user_id: User identifier

    Returns:
        Comprehensive user context
    """
    try:
        context = {
            'user_id': user_id,
            'session_id': ctx.deps.session_id,
            'timestamp': datetime.now().isoformat()
        }

        if ctx.deps.db_pool:
            async with ctx.deps.db_pool.acquire() as conn:
                # Get recent transactions
                tx_query = """
                SELECT category, SUM(amount) as total, COUNT(*) as count
                FROM transactions
                WHERE user_id = $1
                  AND transaction_time >= NOW() - INTERVAL '30 days'
                GROUP BY category
                ORDER BY total DESC
                LIMIT 5
                """
                tx_rows = await conn.fetch(tx_query, user_id)
                context['recent_spending'] = [dict(row) for row in tx_rows]

                # Get active goals
                goals_query = """
                SELECT goal_name, target_amount, target_date, category
                FROM financial_goals
                WHERE user_id = $1 AND status = 'active'
                ORDER BY target_date
                LIMIT 3
                """
                goal_rows = await conn.fetch(goals_query, user_id)
                context['active_goals'] = [dict(row) for row in goal_rows]

                # Get literacy level
                literacy_query = """
                SELECT literacy_level, overall_score
                FROM literacy_assessments
                WHERE user_id = $1
                ORDER BY assessed_at DESC
                LIMIT 1
                """
                literacy_row = await conn.fetchrow(literacy_query, user_id)
                if literacy_row:
                    context['literacy_level'] = literacy_row['literacy_level']
                    context['literacy_score'] = float(literacy_row['overall_score'])

        return context
    except Exception as e:
        logger.error(f"Failed to get user context: {e}")
        return {'error': str(e), 'user_id': user_id}


# ============================================================================
# CUSTOMER SUPPORT TOOLS
# ============================================================================

@companion_agent.tool
async def search_knowledge_base(
    ctx: RunContext[CompanionDependencies],
    query: str,
    max_results: int = 3
) -> str:
    """
    Search the knowledge base for answers to customer questions.
    
    This tool searches documentation, FAQs, and help articles using RAG
    to find relevant information for customer support queries.
    
    Use this when:
    - Customer asks "how to" questions
    - Customer needs information about features
    - Customer asks about G2P vouchers, payments, or account management
    - You need to find documented procedures or policies
    
    Args:
        query: Customer's question or search query
        max_results: Maximum number of results to return (default: 3)
        
    Returns:
        Formatted answer with sources from knowledge base
    """
    try:
        # Integrate with RAG agent for actual knowledge base search
        # Use RAG agent's search tools directly
        try:
            from buffr_ai.agent.tools import hybrid_search_tool, vector_search_tool
            from buffr_ai.agent.models import HybridSearchInput, VectorSearchInput, ChunkResult
            
            # Try hybrid search first (best results - combines vector + graph)
            try:
                hybrid_input = HybridSearchInput(query=query, limit=max_results)
                hybrid_results: List[ChunkResult] = await hybrid_search_tool(hybrid_input)
                
                if hybrid_results and len(hybrid_results) > 0:
                    answer_parts = []
                    sources = []
                    
                    for result in hybrid_results[:max_results]:
                        # ChunkResult has: content, document_title, document_source, score
                        content = result.content
                        source = result.document_title or result.document_source or "Knowledge Base"
                        score = result.score  # Similarity score (0-1)
                        
                        # Only include high-confidence results (score > 0.7)
                        if score > 0.7 and content:
                            answer_parts.append(content)
                            if source:
                                sources.append(source)
                    
                    if answer_parts:
                        answer = "\n\n".join(answer_parts)
                        sources_str = ", ".join(set(sources)) if sources else "Knowledge Base"
                        return f"Found in knowledge base:\n\n{answer}\n\nSources: {sources_str}"
            except Exception as hybrid_error:
                logger.debug(f"Hybrid search failed, trying vector: {hybrid_error}")
            
            # Fallback to vector search
            try:
                vector_input = VectorSearchInput(query=query, limit=max_results)
                vector_results = await vector_search_tool(vector_input)
                
                if vector_results and len(vector_results) > 0:
                    answer_parts = []
                    sources = []
                    
                    for result in vector_results[:max_results]:
                        content = result.content if hasattr(result, 'content') else ""
                        source = result.document_title if hasattr(result, 'document_title') else (result.source if hasattr(result, 'source') else "Knowledge Base")
                        
                        if content:
                            answer_parts.append(content)
                            if source:
                                sources.append(source)
                    
                    if answer_parts:
                        answer = "\n\n".join(answer_parts)
                        sources_str = ", ".join(set(sources)) if sources else "Knowledge Base"
                        return f"Found in knowledge base:\n\n{answer}\n\nSources: {sources_str}"
            except Exception as vector_error:
                logger.debug(f"Vector search also failed: {vector_error}")
        
        except ImportError as import_error:
            logger.warning(f"RAG tools not available for direct import: {import_error}")
        except Exception as rag_error:
            logger.warning(f"RAG search failed: {rag_error}")
        
        # Fallback: Try HTTP call to RAG endpoint (if RAG is mounted on same server)
        try:
            import httpx
            import os
            
            # Since RAG is mounted on the same FastAPI app, use localhost
            rag_base_url = os.getenv("RAG_AGENT_URL", "http://localhost:8001")
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Try hybrid search endpoint
                try:
                    response = await client.post(
                        f"{rag_base_url}/api/search/hybrid",
                        json={"query": query, "limit": max_results}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("results") and len(data["results"]) > 0:
                            results = data["results"]
                            answer_parts = []
                            sources = []
                            
                            for result in results[:max_results]:
                                content = result.get("content", "") or result.get("text", "")
                                source = result.get("source", "") or result.get("document_title", "Knowledge Base")
                                similarity = result.get("similarity", 0.0) or result.get("score", 0.0)
                                
                                if similarity > 0.7 and content:
                                    answer_parts.append(content)
                                    if source:
                                        sources.append(source)
                            
                            if answer_parts:
                                answer = "\n\n".join(answer_parts)
                                sources_str = ", ".join(set(sources)) if sources else "Knowledge Base"
                                return f"Found in knowledge base:\n\n{answer}\n\nSources: {sources_str}"
                except Exception as http_hybrid_error:
                    logger.debug(f"HTTP hybrid search failed: {http_hybrid_error}")
                
                # Fallback to vector search endpoint
                try:
                    response = await client.post(
                        f"{rag_base_url}/api/search/vector",
                        json={"query": query, "limit": max_results}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("results") and len(data["results"]) > 0:
                            results = data["results"]
                            answer_parts = [r.get("content", "") or r.get("text", "") for r in results[:max_results]]
                            sources = [r.get("source", "") or r.get("document_title", "Knowledge Base") for r in results[:max_results]]
                            answer_parts = [a for a in answer_parts if a]
                            
                            if answer_parts:
                                answer = "\n\n".join(answer_parts)
                                sources_str = ", ".join(set([s for s in sources if s])) if sources else "Knowledge Base"
                                return f"Found in knowledge base:\n\n{answer}\n\nSources: {sources_str}"
                except Exception as http_vector_error:
                    logger.debug(f"HTTP vector search also failed: {http_vector_error}")
        except Exception as http_error:
            logger.debug(f"HTTP RAG search failed: {http_error}")
        
        # Final fallback: Return indication that search was attempted
        return f"I searched the knowledge base for '{query}' but didn't find a specific match. I'll provide general guidance based on my training."
        
    except Exception as e:
        logger.error(f"Knowledge base search failed: {e}")
        return f"I encountered an error searching the knowledge base. I'll provide general guidance based on my training."


@companion_agent.tool
async def create_support_ticket(
    ctx: RunContext[CompanionDependencies],
    subject: str,
    description: str,
    category: str = "GENERAL",
    priority: str = "MEDIUM"
) -> str:
    """
    Create a support ticket for escalation to human admin.
    
    Use this when:
    - Customer explicitly requests human support
    - Customer shows frustration (repeated questions, negative sentiment)
    - Issue is outside AI scope (account suspension, large refunds, legal questions)
    - Issue requires system/database access
    - Customer threatens to close account or complains about service
    
    Args:
        subject: Brief subject line for the ticket
        description: Detailed description of the issue
        category: Issue category (TECHNICAL, PAYMENT, ACCOUNT, SECURITY, VOUCHER, GENERAL)
        priority: Priority level (LOW, MEDIUM, HIGH, URGENT)
        
    Returns:
        Ticket number and confirmation message
    """
    try:
        if not ctx.deps.user_id:
            return "Error: User ID required to create support ticket"
        
        db_pool = ctx.deps.db_pool
        
        # Validate category and priority
        try:
            ticket_category = TicketCategory[category.upper()]
        except KeyError:
            ticket_category = TicketCategory.GENERAL
        
        try:
            ticket_priority = TicketPriority[priority.upper()]
        except KeyError:
            ticket_priority = TicketPriority.MEDIUM
        
        # Generate unique ticket number
        ticket_number = f"TKT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        ticket_id = str(uuid.uuid4())
        
        # Prepare conversation history
        conversation_json = ctx.deps.conversation_history or []
        
        if db_pool:
            try:
                async with db_pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO support_tickets (
                            id, user_id, ticket_number, subject, description,
                            category, status, priority, metadata, created_at, updated_at, is_deleted
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), false
                        )
                        """,
                        ticket_id,
                        ctx.deps.user_id,
                        ticket_number,
                        subject,
                        description,
                        ticket_category.value,
                        TicketStatus.OPEN.value,
                        ticket_priority.value,
                        {
                            "conversation_history": conversation_json,
                            "created_by_ai": True,
                            "escalation_reason": "AI support agent escalation",
                            "session_id": ctx.deps.session_id
                        }
                    )
                    logger.info(f"Support ticket created: {ticket_number} for user {ctx.deps.user_id}")
            except Exception as db_error:
                logger.warning(f"Could not persist ticket to database: {db_error}")
                logger.info(f"Ticket created in-memory: {ticket_number}")
        
        return f"Support ticket created successfully. Ticket number: {ticket_number}. A human agent will review and respond. Expected response time: {ticket_priority.value} priority tickets are typically responded to within 24-48 hours."
        
    except Exception as e:
        logger.error(f"Failed to create support ticket: {e}")
        return f"Failed to create ticket: {str(e)}. Please try contacting support directly."


@companion_agent.tool
async def escalate_to_admin(
    ctx: RunContext[CompanionDependencies],
    reason: str,
    conversation_summary: str,
    category: str = "GENERAL",
    priority: str = "MEDIUM"
) -> str:
    """
    Escalate an issue to a human admin by creating a support ticket.
    
    This is specifically for escalation scenarios where the customer
    needs human intervention.
    
    Args:
        reason: Reason for escalation (e.g., "Customer requested human", "Frustration detected")
        conversation_summary: Summary of the conversation leading to escalation
        category: Issue category
        priority: Priority level
        
    Returns:
        Ticket number and escalation confirmation
    """
    subject = f"Escalation: {reason[:50]}"
    description = f"""
Escalation Reason: {reason}

Conversation Summary:
{conversation_summary}

This ticket was automatically created by the AI support agent after determining that human intervention is required.
    """.strip()
    
    result = await create_support_ticket(
        ctx=ctx,
        subject=subject,
        description=description,
        category=category,
        priority=priority
    )
    
    return result


@companion_agent.tool
async def check_ticket_status(
    ctx: RunContext[CompanionDependencies],
    ticket_number: str
) -> str:
    """
    Check the status of an existing support ticket.
    
    Use this when customer asks about their ticket status.
    
    Args:
        ticket_number: Ticket number to check (format: TKT-YYYYMMDD-XXXXXXXX)
        
    Returns:
        Ticket status information
    """
    try:
        db_pool = ctx.deps.db_pool
        
        if not db_pool:
            return f"Database not available to check ticket {ticket_number}. Please contact support directly."
        
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT status, priority, category, assigned_to, resolution_notes, updated_at
                FROM support_tickets
                WHERE ticket_number = $1 AND is_deleted = false
                """,
                ticket_number
            )
            
            if not row:
                return f"Ticket {ticket_number} not found. Please verify the ticket number or contact support."
            
            status_info = f"Ticket {ticket_number} Status:\n"
            status_info += f"- Status: {row['status']}\n"
            status_info += f"- Priority: {row['priority']}\n"
            status_info += f"- Category: {row['category']}\n"
            
            if row['assigned_to']:
                status_info += f"- Assigned to: Support Agent\n"
            
            if row['resolution_notes']:
                status_info += f"\nResolution Notes:\n{row['resolution_notes']}\n"
            
            if row['updated_at']:
                status_info += f"\nLast Updated: {row['updated_at']}"
            
            return status_info
            
    except Exception as e:
        logger.error(f"Failed to check ticket status: {e}")
        return f"Could not check ticket status: {str(e)}. Please contact support directly."
