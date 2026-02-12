"""
LLM Router for model abstraction and switching.
Supports multiple LLM providers (OpenAI, LLaMA, Mistral, etc.).
"""

from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
import os
import openai
from ai.config.ai_settings import AISettings


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    def generate_response(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is available and configured."""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            openai.api_key = self.api_key

    def generate_response(self, prompt: str, **kwargs) -> str:
        """Generate response using OpenAI API."""
        if not self.is_available():
            raise ValueError("OpenAI API key not configured")

        config = AISettings.get_llm_config()
        config.update(kwargs)

        try:
            response = openai.ChatCompletion.create(
                model=config["model"],
                messages=[{"role": "user", "content": prompt}],
                temperature=config["temperature"],
                max_tokens=config["max_tokens"]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {str(e)}")

    def is_available(self) -> bool:
        """Check if OpenAI is configured."""
        return bool(self.api_key)


class LocalLLMProvider(LLMProvider):
    """Placeholder for local LLM providers like LLaMA."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.getenv("LOCAL_LLM_MODEL_PATH")

    def generate_response(self, prompt: str, **kwargs) -> str:
        """Generate response using local LLM (placeholder implementation)."""
        if not self.is_available():
            raise ValueError("Local LLM model path not configured")

        # Placeholder - would integrate with transformers or llama.cpp
        # For now, return a mock response
        return f"[Local LLM Response] Based on: {prompt[:100]}..."

    def is_available(self) -> bool:
        """Check if local LLM is configured."""
        return bool(self.model_path) and os.path.exists(self.model_path)


class MockProvider(LLMProvider):
    """Mock provider for testing and fallback."""

    def generate_response(self, prompt: str, **kwargs) -> str:
        """Return a mock response."""
        return f"Mock response for prompt: {prompt[:50]}... (This is a fallback response)"

    def is_available(self) -> bool:
        """Mock provider is always available."""
        return True


class LLMRouter:
    """
    Router for LLM providers.
    Handles model switching and provides unified interface.
    """

    def __init__(self):
        self.providers: Dict[str, LLMProvider] = {
            "openai": OpenAIProvider(),
            "local": LocalLLMProvider(),
            "mock": MockProvider()
        }
        self.current_provider = self._select_provider()

    def _select_provider(self) -> str:
        """Select the best available provider based on configuration."""
        preferred_model = AISettings.LLM_MODEL.lower()

        if "gpt" in preferred_model and self.providers["openai"].is_available():
            return "openai"
        elif "llama" in preferred_model and self.providers["local"].is_available():
            return "local"
        elif AISettings.ENABLE_LLM and self.providers["openai"].is_available():
            return "openai"
        elif AISettings.ENABLE_LLM and self.providers["local"].is_available():
            return "local"
        else:
            return "mock"  # Fallback to mock

    def generate_response(self, prompt: str, **kwargs) -> str:
        """Generate a response using the current provider."""
        provider = self.providers[self.current_provider]
        return provider.generate_response(prompt, **kwargs)

    def switch_provider(self, provider_name: str):
        """Switch to a different provider."""
        if provider_name not in self.providers:
            raise ValueError(f"Unknown provider: {provider_name}")

        if not self.providers[provider_name].is_available():
            raise ValueError(f"Provider {provider_name} is not available")

        self.current_provider = provider_name

    def get_available_providers(self) -> List[str]:
        """Get list of available providers."""
        return [name for name, provider in self.providers.items() if provider.is_available()]

    def get_current_provider(self) -> str:
        """Get the name of the current provider."""
        return self.current_provider

    def test_provider(self, provider_name: str, test_prompt: str = "Hello, test message") -> bool:
        """Test if a provider can generate responses."""
        if provider_name not in self.providers:
            return False

        try:
            self.providers[provider_name].generate_response(test_prompt)
            return True
        except Exception:
            return False


# Global router instance
llm_router = LLMRouter()
