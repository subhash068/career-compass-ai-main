"""
Routes package for Career Compass AI.
"""

from .auth_fastapi import router as auth_router
from .skills import router as skills_router
from .career import router as career_router
from .learning import router as learning_router
from .chatbot import router as chatbot_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "skills_router",
    "career_router",
    "learning_router",
    "chatbot_router",
    "admin_router",
]
