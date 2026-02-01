"""
Guardian Agent - LLM Provider Configuration
"""

import os
from typing import Union
import logging
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.models.openai import OpenAIModel
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables - try parent .env.local first (buffr root), then local
parent_env_path = Path(__file__).parent.parent.parent / '.env.local'
local_env_path = Path(__file__).parent.parent.parent / 'buffr_ai' / '.env.local'
if parent_env_path.exists():
    load_dotenv(parent_env_path, override=True)
elif local_env_path.exists():
    load_dotenv(local_env_path, override=True)
else:
    load_dotenv()  # Fallback to default .env

logger = logging.getLogger(__name__)


def get_llm_model() -> OpenAIModel:
    """
    Get LLM model configuration for Guardian Agent
    
    Uses DeepSeek only (no OpenAI or Anthropic models).

    Returns:
        Configured OpenAIModel instance using DeepSeek
    """
    provider = os.getenv("GUARDIAN_LLM_PROVIDER", "deepseek")
    
    if provider != "deepseek":
        logger.warning(f"Provider '{provider}' not supported. Using DeepSeek instead.")
        provider = "deepseek"

    model_name = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("LLM_API_KEY")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY or LLM_API_KEY environment variable not set")
    logger.info(f"Using DeepSeek model: {model_name}")
    provider_obj = OpenAIProvider(base_url=base_url, api_key=api_key)
    return OpenAIModel(model_name, provider=provider_obj)


def get_embedding_model() -> str:
    """
    Get embedding model for Guardian Agent
    
    Uses DeepSeek embedding model (OpenAI-compatible API).

    Returns:
        Embedding model identifier
    """
    # Using DeepSeek embedding via OpenAI-compatible API
    embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    embedding_base_url = os.getenv("EMBEDDING_BASE_URL", os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"))
    return f"{embedding_base_url}:{embedding_model}"


# Model configurations for different tasks
GUARDIAN_MODEL_CONFIG = {
    "fraud_detection": {
        "temperature": 0.1,  # Low temperature for consistent risk assessment
        "max_tokens": 1000,
        "top_p": 0.9
    },
    "credit_assessment": {
        "temperature": 0.2,
        "max_tokens": 1500,
        "top_p": 0.9
    },
    "compliance_check": {
        "temperature": 0.0,  # Zero temperature for deterministic compliance
        "max_tokens": 800,
        "top_p": 1.0
    },
    "general": {
        "temperature": 0.3,
        "max_tokens": 2000,
        "top_p": 0.95
    }
}


def get_model_config(task_type: str = "general") -> dict:
    """
    Get model configuration for specific task type

    Args:
        task_type: Type of task (fraud_detection, credit_assessment, etc.)

    Returns:
        Model configuration dictionary
    """
    return GUARDIAN_MODEL_CONFIG.get(task_type, GUARDIAN_MODEL_CONFIG["general"])
