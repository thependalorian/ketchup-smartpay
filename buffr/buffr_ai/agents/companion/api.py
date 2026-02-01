"""
Main Buffr AI Companion - FastAPI Router
"""

import logging
import uuid
import json
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from .agent import run_companion_agent, companion_agent, CompanionDependencies
from .models import (
    ChatRequest,
    ChatResponse,
    MultiAgentRequest,
    MultiAgentResponse,
    UserContextResponse
)
from .tools import get_user_context, coordinate_multi_agent
from .db_utils import get_db_pool, store_conversation, get_conversation_history
from pydantic_ai import RunContext

logger = logging.getLogger(__name__)

companion_router = APIRouter(prefix="/companion", tags=["Main Buffr AI Companion"])


@companion_router.post("/chat/stream")
async def chat_with_companion_stream(request: ChatRequest):
    """
    Streaming chat endpoint using Server-Sent Events (SSE).
    
    Provides real-time streaming responses for better UX in mobile apps.
    Matches TypeScript backend format: { chunk, done, fullMessage, sessionId }
    
    Request format (supports both camelCase and snake_case):
    - message: str (required)
    - sessionId or session_id: str (optional)
    - userId or user_id: str (optional)
    """
    try:
        # Support both camelCase and snake_case (TypeScript compatibility)
        session_id = request.session_id or str(uuid.uuid4())
        user_id = request.user_id
        
        if not request.message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        db_pool = await get_db_pool()
        
        # Get conversation history
        history = await get_conversation_history(db_pool, session_id, limit=10)
        
        async def generate_stream():
            """Generate streaming response using agent.iter() pattern."""
            try:
                # Create dependencies
                deps = CompanionDependencies(
                    session_id=session_id,
                    user_id=user_id,
                    db_pool=db_pool,
                    conversation_history=history
                )
                
                full_response = ""
                agents_consulted = []
                
                # Stream using agent.iter() pattern
                async with companion_agent.iter(request.message, deps=deps) as run:
                    async for node in run:
                        if companion_agent.is_model_request_node(node):
                            # Stream tokens from the model
                            async with node.stream(run.ctx) as request_stream:
                                async for event in request_stream:
                                    from pydantic_ai.messages import PartStartEvent, PartDeltaEvent, TextPartDelta
                                    
                                    if isinstance(event, PartStartEvent) and event.part.part_kind == 'text':
                                        delta_content = event.part.content
                                        yield f"data: {json.dumps({'chunk': delta_content, 'done': False})}\n\n"
                                        full_response += delta_content
                                        
                                    elif isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                                        delta_content = event.delta.content_delta
                                        yield f"data: {json.dumps({'chunk': delta_content, 'done': False})}\n\n"
                                        full_response += delta_content
                
                # Extract agents consulted and detect support actions from result
                result = run.result
                agents_consulted = []
                ticket_created = False
                ticket_number = None
                escalated = False
                knowledge_base_used = False
                
                if hasattr(result, 'data'):
                    response_data = result.data
                    if isinstance(response_data, dict):
                        agents_consulted = response_data.get('agents_consulted', [])
                
                # Parse tool results to detect ticket creation, escalation, and knowledge base usage
                if hasattr(result, 'all_messages'):
                    for msg in result.all_messages:
                        if hasattr(msg, 'tool_calls'):
                            for tool_call in msg.tool_calls:
                                if tool_call.name == 'search_knowledge_base':
                                    knowledge_base_used = True
                                elif tool_call.name in ['create_support_ticket', 'escalate_to_admin']:
                                    ticket_created = True
                                    escalated = tool_call.name == 'escalate_to_admin'
                                    if hasattr(tool_call, 'result'):
                                        result_str = str(tool_call.result)
                                        match = re.search(r'TKT-\d{8}-[A-Z0-9]+', result_str)
                                        if match:
                                            ticket_number = match.group()
                
                # Store conversation
                if user_id:
                    await store_conversation(
                        db_pool,
                        session_id,
                        user_id,
                        request.message,
                        full_response,
                        agents_consulted
                    )
                    
                    # Also store in support_conversations if ticket was created
                    if ticket_created and db_pool:
                        try:
                            async with db_pool.acquire() as conn:
                                await conn.execute(
                                    """
                                    INSERT INTO support_conversations (
                                        id, session_id, user_id, user_message, assistant_response,
                                        ticket_number, knowledge_base_used, escalated, created_at
                                    ) VALUES (
                                        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()
                                    )
                                    """,
                                    session_id, user_id, request.message, full_response,
                                    ticket_number, knowledge_base_used, escalated
                                )
                        except Exception as support_error:
                            logger.warning(f"Failed to store support conversation (non-critical): {support_error}")
                
                # Send final message with metadata (matches TypeScript format with support fields)
                final_message = {
                    'chunk': '',
                    'done': True,
                    'fullMessage': full_response,
                    'sessionId': session_id,
                    'ticketCreated': ticket_created,
                    'ticketNumber': ticket_number,
                    'escalated': escalated,
                    'knowledgeBaseUsed': knowledge_base_used
                }
                yield f"data: {json.dumps(final_message)}\n\n"
                
            except Exception as e:
                logger.error(f"Stream error: {e}", exc_info=True)
                error_chunk = {
                    "chunk": "",
                    "done": True,
                    "error": f"Failed to process chat: {str(e)}"
                }
                yield f"data: {json.dumps(error_chunk)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Streaming chat failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@companion_router.post("/chat", response_model=ChatResponse)
async def chat_with_companion(request: ChatRequest):
    """
    Main conversational interface for Buffr AI Companion.

    Orchestrates all specialized agents:
    - Guardian: Fraud detection & credit scoring
    - Transaction Analyst: Spending analysis & budgeting
    Note: Scout, Mentor, and Crafter agents have been removed as they are not relevant to G2P voucher platform.

    Examples:
    - "Can I afford a NAD 5,000 laptop?" → Multi-agent coordination
    - "Is this transaction safe?" → Guardian agent
    - "Is this voucher transaction safe?" → Guardian + Transaction Analyst agents
    - "Where am I spending most?" → Transaction Analyst agent
    """
    try:
        session_id = request.session_id or str(uuid.uuid4())
        db_pool = await get_db_pool()

        # Get conversation history (gracefully handle if table doesn't exist)
        try:
            history = await get_conversation_history(db_pool, session_id)
        except Exception as db_error:
            # Log but don't fail if conversations table doesn't exist
            logger.warning(f"Failed to get conversation history (non-critical): {db_error}")
            history = []

        # Run companion orchestrator
        result = await run_companion_agent(
            user_query=request.message,
            session_id=session_id,
            user_id=request.user_id,
            conversation_history=history
        )

        # Extract agents consulted and detect support actions from result
        agents_consulted = []
        ticket_created = False
        ticket_number = None
        escalated = False
        knowledge_base_used = False
        
        if hasattr(result, 'data'):
            response_data = result.data
            if isinstance(response_data, dict):
                agents_consulted = response_data.get('agents_consulted', [])
                message = response_data.get('message', str(response_data))
            else:
                message = str(response_data)
        else:
            message = str(result)
        
        # Parse tool results to detect ticket creation, escalation, and knowledge base usage
        if hasattr(result, 'all_messages'):
            for msg in result.all_messages:
                if hasattr(msg, 'tool_calls'):
                    for tool_call in msg.tool_calls:
                        # Detect knowledge base usage
                        if tool_call.name == 'search_knowledge_base':
                            knowledge_base_used = True
                        
                        # Detect ticket creation/escalation
                        if tool_call.name in ['create_support_ticket', 'escalate_to_admin']:
                            ticket_created = True
                            escalated = tool_call.name == 'escalate_to_admin'
                            if hasattr(tool_call, 'result'):
                                result_str = str(tool_call.result)
                                # Extract ticket number (format: TKT-YYYYMMDD-XXXXXXXX)
                                match = re.search(r'TKT-\d{8}-[A-Z0-9]+', result_str)
                                if match:
                                    ticket_number = match.group()

        # Store conversation (gracefully handle if table doesn't exist)
        try:
            await store_conversation(
                db_pool,
                session_id,
                request.user_id,
                request.message,
                message,
                agents_consulted
            )
            
            # Also store in support_conversations if ticket was created
            if ticket_created and db_pool:
                try:
                    async with db_pool.acquire() as conn:
                        await conn.execute(
                            """
                            INSERT INTO support_conversations (
                                id, session_id, user_id, user_message, assistant_response,
                                ticket_number, knowledge_base_used, escalated, created_at
                            ) VALUES (
                                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()
                            )
                            """,
                            session_id, request.user_id, request.message, message,
                            ticket_number, knowledge_base_used, escalated
                        )
                except Exception as support_error:
                    logger.warning(f"Failed to store support conversation (non-critical): {support_error}")
        except Exception as db_error:
            # Log but don't fail if conversations table doesn't exist
            logger.warning(f"Failed to store conversation (non-critical): {db_error}")

        # Return ChatResponse model structure (matches response_model decorator)
        return ChatResponse(
            message=message,
            agents_consulted=agents_consulted,
            session_id=session_id,
            timestamp=datetime.utcnow(),
            ticket_created=ticket_created,
            ticket_number=ticket_number,
            escalated=escalated,
            knowledge_base_used=knowledge_base_used
        )
    except Exception as e:
        logger.error(f"Companion chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@companion_router.post("/multi-agent", response_model=MultiAgentResponse)
async def multi_agent_coordination(request: MultiAgentRequest):
    """
    Coordinate multiple specialized agents for complex queries.

    Orchestration modes:
    - sequential: Execute agents in order (results feed forward)
    - parallel: Execute agents concurrently (faster, independent)
    - conditional: Execute based on previous results

    Example:
    {
        "user_id": "user123",
        "query": "Can I afford a NAD 5,000 laptop?",
        "agents_needed": ["guardian", "transaction_analyst"],
        "orchestration_mode": "sequential"
    }
    """
    try:
        from .agent import CompanionDependencies
        from pydantic_ai import RunContext

        session_id = request.session_id or str(uuid.uuid4())
        db_pool = await get_db_pool()

        deps = CompanionDependencies(
            session_id=session_id,
            user_id=request.user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await coordinate_multi_agent(
            ctx,
            request.query,
            request.agents_needed,
            request.orchestration_mode
        )

        # Synthesize response from multiple agents
        synthesized = "Based on insights from multiple specialized agents:\n\n"
        for agent_name, agent_response in result.get('responses', {}).items():
            if 'error' not in agent_response:
                synthesized += f"**{agent_name.replace('_', ' ').title()}**: "
                synthesized += f"{agent_response.get('response', 'No response')}\n\n"

        return MultiAgentResponse(
            query=request.query,
            orchestration_mode=request.orchestration_mode,
            agents_coordinated=request.agents_needed,
            responses=result.get('responses', {}),
            synthesized_response=synthesized
        )
    except Exception as e:
        logger.error(f"Multi-agent coordination failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@companion_router.get("/context/{user_id}", response_model=UserContextResponse)
async def get_user_comprehensive_context(user_id: str):
    """
    Get comprehensive user context for personalized assistance.

    Returns:
    - Recent spending patterns
    - Active financial goals
    - Financial literacy level
    - Active workflows
    """
    try:
        from .agent import CompanionDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = CompanionDependencies(
            session_id=f"context_{user_id}",
            user_id=user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await get_user_context(ctx, user_id)

        return UserContextResponse(**result)
    except Exception as e:
        logger.error(f"Failed to get user context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@companion_router.get("/history/{session_id}")
async def get_session_history(session_id: str, limit: int = 10):
    """
    Get conversation history for a session.
    """
    try:
        db_pool = await get_db_pool()
        history = await get_conversation_history(db_pool, session_id, limit)

        return {
            "session_id": session_id,
            "history": history,
            "count": len(history)
        }
    except Exception as e:
        logger.error(f"Failed to get session history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@companion_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent": "companion",
        "orchestrator": True,
        "specialized_agents": [
            "guardian",
            "transaction_analyst",
            # Scout, Mentor, and Crafter agents removed - not relevant to G2P vouchers
        ],
        "capabilities": [
            "multi_agent_orchestration",
            "intelligent_routing",
            "conversation_memory",
            "user_context_awareness",
            "sequential_orchestration",
            "parallel_orchestration",
            "conditional_orchestration"
        ]
    }
