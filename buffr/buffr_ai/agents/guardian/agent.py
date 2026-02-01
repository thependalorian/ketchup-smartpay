"""
Guardian Agent - Risk Assessment & Fraud Detection

Responsibilities:
- Real-time transaction fraud detection
- Credit risk assessment for lending
- Compliance monitoring (ETA 2019, AML/CFT)
- Security threat detection
"""

from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from typing import Optional, Dict, Any
import logging

# Initialize logger before use
logger = logging.getLogger(__name__)

# Import ML models - optional (graceful degradation)
try:
    from buffr_ai.ml.fraud_detection import FraudDetectionEnsemble
    from buffr_ai.ml.credit_scoring import CreditScoringEnsemble
    ML_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ML models not available (optional): {e}")
    ML_AVAILABLE = False
    # Create dummy types for type hints
    FraudDetectionEnsemble = None
    CreditScoringEnsemble = None

from .prompts import GUARDIAN_SYSTEM_PROMPT
from .providers import get_llm_model
from .investigation_workflow import AIInvestigationWorkflow
from .consistency_tracker import ConsistencyTracker
from .fatigue_handler import FatigueHandler


@dataclass
class GuardianDependencies:
    """Dependencies for Guardian Agent"""
    session_id: str
    user_id: Optional[str] = None
    fraud_model: Optional[FraudDetectionEnsemble] = None
    credit_model: Optional[CreditScoringEnsemble] = None
    db_pool: Optional[object] = None
    neo4j_client: Optional[object] = None


# Initialize Guardian Agent
guardian_agent = Agent(
    get_llm_model(),
    deps_type=GuardianDependencies,
    retries=2,
    system_prompt=GUARDIAN_SYSTEM_PROMPT
)


async def initialize_guardian_models() -> tuple[FraudDetectionEnsemble, CreditScoringEnsemble]:
    """
    Load and initialize ML models for Guardian Agent

    Returns:
        Tuple of (fraud_model, credit_model)
    """
    if not ML_AVAILABLE:
        raise ImportError("ML models not available. Please install pandas, scikit-learn, and torch.")
    
    from buffr_ai.ml.fraud_detection import load_fraud_models
    from buffr_ai.ml.credit_scoring import load_credit_models

    logger.info("Loading Guardian Agent ML models...")

    fraud_model = await load_fraud_models()
    credit_model = await load_credit_models()

    logger.info("✓ Guardian Agent models loaded")

    return fraud_model, credit_model


async def run_guardian_agent(
    user_query: str,
    session_id: str,
    user_id: Optional[str] = None,
    fraud_model: Optional[FraudDetectionEnsemble] = None,
    credit_model: Optional[CreditScoringEnsemble] = None
) -> Any:
    """
    Execute Guardian Agent with ML model dependencies

    Args:
        user_query: User's query or task
        session_id: Session identifier
        user_id: Optional user identifier
        fraud_model: Pre-loaded fraud detection model
        credit_model: Pre-loaded credit scoring model

    Returns:
        Agent result with risk assessment and recommendations
    """
    # Initialize models if not provided
    if fraud_model is None or credit_model is None:
        fraud_model, credit_model = await initialize_guardian_models()

    # Initialize DB connections (if needed)
    from .db_utils import get_db_pool
    db_pool = await get_db_pool()

    # Create dependencies
    deps = GuardianDependencies(
        session_id=session_id,
        user_id=user_id,
        fraud_model=fraud_model,
        credit_model=credit_model,
        db_pool=db_pool
    )

    # Run agent
    result = await guardian_agent.run(user_query, deps=deps)

    return result


# Initialize SOC AI components
_consistency_tracker = ConsistencyTracker()
_fatigue_handler = FatigueHandler()
_investigation_workflow = None


def get_investigation_workflow(db_pool=None, knowledge_graph=None) -> AIInvestigationWorkflow:
    """
    Get or create investigation workflow instance
    
    Args:
        db_pool: Database connection pool
        knowledge_graph: Neo4j knowledge graph client
        
    Returns:
        AIInvestigationWorkflow instance
    """
    global _investigation_workflow
    
    if _investigation_workflow is None:
        _investigation_workflow = AIInvestigationWorkflow(
            agent=guardian_agent,
            db_pool=db_pool,
            knowledge_graph=knowledge_graph
        )
    
    return _investigation_workflow


async def investigate_security_alert(
    alert_id: str,
    alert_data: Dict[str, Any],
    user_context: Optional[Dict[str, Any]] = None,
    db_pool=None,
    knowledge_graph=None
) -> Dict[str, Any]:
    """
    Investigate security alert with AI assistance
    
    Based on SOC benchmarking study:
    - 45-61% faster investigations
    - 22-29% higher accuracy
    - Maintains completeness under fatigue
    - Greater consistency
    
    Args:
        alert_id: Unique alert identifier
        alert_data: Alert data dictionary
        user_context: Optional user context information
        db_pool: Database connection pool
        knowledge_graph: Neo4j knowledge graph client
        
    Returns:
        Investigation result with risk assessment and recommendations
    """
    # Check fatigue
    fatigue_status = _fatigue_handler.check_fatigue()
    
    # Get investigation workflow
    workflow = get_investigation_workflow(db_pool, knowledge_graph)
    
    # Adjust workflow for fatigue
    workflow_config = _fatigue_handler.adjust_workflow({})
    
    # Investigate
    result = await workflow.investigate_alert(
        alert_id,
        alert_data,
        user_context
    )
    
    # Track consistency
    alert_type = alert_data.get("type", "unknown")
    consistency = _consistency_tracker.get_consistency_score(
        alert_type,
        result
    )
    result["consistency_score"] = consistency
    
    # Record investigation
    _consistency_tracker.record_investigation(
        alert_type,
        result
    )
    _fatigue_handler.record_investigation()
    
    # Add fatigue info
    result["fatigue_status"] = fatigue_status
    
    return result


def get_investigation_stats() -> Dict[str, Any]:
    """Get statistics about investigations"""
    workflow = get_investigation_workflow()
    workflow_stats = workflow.get_investigation_stats()
    
    fatigue_status = _fatigue_handler.check_fatigue()
    
    return {
        **workflow_stats,
        "fatigue_level": fatigue_status["fatigue_level"],
        "investigation_count": fatigue_status["investigation_count"],
        "is_fatigued": fatigue_status["is_fatigued"]
    }
