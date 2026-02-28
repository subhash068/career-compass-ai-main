"""
AI Configuration Settings
Toggles for enabling/disabling AI features and fallback mechanisms.
"""

import os
from typing import Optional


class AISettings:
    """
    Configuration class for AI features.
    Provides kill switches and settings for LLM, RAG, and fallback to rules.
    """

    # LLM Settings
    ENABLE_LLM: bool = os.getenv("ENABLE_LLM", "true").lower() == "true"
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-3.5-turbo")  # Default to GPT-3.5
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "1000"))

    # RAG Settings
    ENABLE_RAG: bool = os.getenv("ENABLE_RAG", "true").lower() == "true"
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))  # Number of documents to retrieve
    RAG_SIMILARITY_THRESHOLD: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.7"))

    # Fallback Settings
    FALLBACK_TO_RULES: bool = os.getenv("FALLBACK_TO_RULES", "true").lower() == "true"

    # Embedding Settings
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))

    # Evaluation Settings
    ENABLE_EVALUATION: bool = os.getenv("ENABLE_EVALUATION", "true").lower() == "true"
    EVALUATION_METRICS: list = ["relevance", "grounding", "hallucination", "user_feedback"]

    # Memory Settings
    ENABLE_MEMORY: bool = os.getenv("ENABLE_MEMORY", "true").lower() == "true"
    MEMORY_MAX_HISTORY: int = int(os.getenv("MEMORY_MAX_HISTORY", "10"))

    # Skill Inference Settings
    SKILL_INFERENCE_THRESHOLD: float = float(os.getenv("SKILL_INFERENCE_THRESHOLD", "0.6"))

    @classmethod
    def is_ai_enabled(cls) -> bool:
        """Check if any AI features are enabled."""
        return cls.ENABLE_LLM or cls.ENABLE_RAG

    @classmethod
    def should_use_llm(cls) -> bool:
        """Determine if LLM should be used for responses."""
        return cls.ENABLE_LLM

    @classmethod
    def should_use_rag(cls) -> bool:
        """Determine if RAG should be used for retrieval."""
        return cls.ENABLE_RAG

    @classmethod
    def should_fallback_to_rules(cls) -> bool:
        """Determine if fallback to rule-based responses is enabled."""
        return cls.FALLBACK_TO_RULES

    @classmethod
    def get_llm_config(cls) -> dict:
        """Get LLM configuration as a dictionary."""
        return {
            "model": cls.LLM_MODEL,
            "temperature": cls.LLM_TEMPERATURE,
            "max_tokens": cls.LLM_MAX_TOKENS
        }

    @classmethod
    def get_rag_config(cls) -> dict:
        """Get RAG configuration as a dictionary."""
        return {
            "top_k": cls.RAG_TOP_K,
            "similarity_threshold": cls.RAG_SIMILARITY_THRESHOLD
        }

    @classmethod
    def get_embedding_config(cls) -> dict:
        """Get embedding configuration as a dictionary."""
        return {
            "model": cls.EMBEDDING_MODEL,
            "dimension": cls.EMBEDDING_DIMENSION
        }
