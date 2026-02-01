"""
Crafter Agent - LLM Provider Configuration
"""

import os
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
    """Get LLM model configuration for Crafter Agent"""
    provider = os.getenv("CRAFTER_LLM_PROVIDER", "deepseek")  # Default to deepseek

    if provider == "deepseek":
        model_name = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
        api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("LLM_API_KEY")
        if not api_key:
            raise ValueError("DEEPSEEK_API_KEY or LLM_API_KEY environment variable not set")
        provider_obj = OpenAIProvider(base_url=base_url, api_key=api_key)
        return OpenAIModel(model_name, provider=provider_obj)
    elif provider == "anthropic":
        model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1")
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        provider_obj = OpenAIProvider(base_url=base_url, api_key=api_key)
        return OpenAIModel(model_name, provider=provider_obj)
    else:
        model_name = os.getenv("OPENAI_MODEL", "gpt-4")
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY or LLM_API_KEY environment variable not set")
        provider_obj = OpenAIProvider(base_url=base_url, api_key=api_key)
        return OpenAIModel(model_name, provider=provider_obj)
