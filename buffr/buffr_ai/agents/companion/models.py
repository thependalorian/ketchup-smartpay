"""
Main Buffr AI Companion - Pydantic Models
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request for companion chat
    
    Supports both camelCase (TypeScript) and snake_case (Python) for compatibility.
    Uses Pydantic field aliases for automatic conversion.
    """
    message: str
    user_id: Optional[str] = Field(None, alias="userId")
    session_id: Optional[str] = Field(None, alias="sessionId")
    conversation_history: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        populate_by_name = True  # Allow both field name and alias


class ChatResponse(BaseModel):
    """Response from companion chat"""
    message: str
    agents_consulted: List[str]
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    context_used: Optional[Dict[str, Any]] = None
    # Support fields
    ticket_created: bool = False
    ticket_number: Optional[str] = None
    escalated: bool = False
    knowledge_base_used: bool = False


class MultiAgentRequest(BaseModel):
    """Request for multi-agent coordination"""
    user_id: str
    query: str
    agents_needed: List[str]
    orchestration_mode: str = 'sequential'  # sequential, parallel, conditional
    session_id: Optional[str] = None


class MultiAgentResponse(BaseModel):
    """Response from multi-agent coordination"""
    query: str
    orchestration_mode: str
    agents_coordinated: List[str]
    responses: Dict[str, Any]
    synthesized_response: str
    timestamp: datetime = Field(default_factory=datetime.now)


class UserContextResponse(BaseModel):
    """User context for personalization"""
    user_id: str
    session_id: str
    recent_spending: Optional[List[Dict[str, Any]]] = None
    active_goals: Optional[List[Dict[str, Any]]] = None
    literacy_level: Optional[str] = None
    literacy_score: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.now)
