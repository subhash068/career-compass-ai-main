from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import re

from sqlalchemy.orm import Session

from models.chat_session import ChatSession
from models.chat_message import ChatMessage
from models.user_skill import UserSkill

from services.skills_service import SkillsService
from services.career_service import CareerService
from ai.intent_classifier import IntentClassifier
from ai.rag.rag_service import RAGService
from ai.embeddings.vector_store import VectorStore


# Global vector store (in production, this would be persisted)
GLOBAL_VECTOR_STORE = VectorStore()


class ChatbotService:
    """
    Rule-based chatbot service with intent detection.
    Can be extended to LLM-based responses later.
    """

    # --------------------------------------------------
    # PUBLIC ENTRY POINT (USED BY ROUTES)
    # --------------------------------------------------
    @staticmethod
    def process_query(
        db: Session,
        user_id: int,
        query: str,
        session_id: Optional[int] = None
    ) -> Dict[str, Any]:

        # -------------------------
        # Get or create chat session
        # -------------------------
        session = None
        if session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            ).first()

        if not session:
            session = ChatSession(user_id=user_id)
            db.add(session)
            db.flush()

        # -------------------------
        # Detect intent
        # -------------------------
        intent = IntentClassifier.classify_intent(query)

        # -------------------------
        # Build user context
        # -------------------------
        context = ChatbotService._build_user_context(db, user_id)

        # -------------------------
        # Generate response
        # -------------------------
        if intent in {"career", "learning"}:
            if GLOBAL_VECTOR_STORE.index.ntotal == 0:
                response_text = "I don't have enough verified data yet. Please update your profile."
            else:
                response_text = RAGService.answer(
                    query=query,
                    vector_store=GLOBAL_VECTOR_STORE,
                    structured_context=context,
                )
        else:
            response_text = ChatbotService._generate_response(
                intent=intent,
                query=query,
                context=context
            )

        # -------------------------
        # Persist messages
        # -------------------------
        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=query,
            context=json.dumps({"intent": intent})
        )

        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_text,
            context=json.dumps(context)
        )

        db.add(user_message)
        db.add(assistant_message)
        db.commit()

        return {
            "session_id": session.id,
            "intent": intent,
            "message": response_text,
            "timestamp": assistant_message.timestamp,
        }



    # --------------------------------------------------
    # CONTEXT BUILDER
    # --------------------------------------------------
    @staticmethod
    def _build_user_context(
        db: Session,
        user_id: int
    ) -> Dict[str, Any]:

        skills_analysis = SkillsService.analyze_skills(db, user_id)
        career_matches = CareerService.recommend_careers(db, user_id)

        # Enhanced context with AI insights
        context = {
            "skills_count": skills_analysis.get("total_skills", 0),
            "average_skill_score": skills_analysis.get("average_score", 0),
            "top_skills": skills_analysis.get("top_skills", [])[:3],
            "career_matches": career_matches[:3] if career_matches else [],
            "inferred_skills": skills_analysis.get("inferred_skills", []),
            "skill_insights": skills_analysis.get("skill_insights", {}),
            "recent_skills": [s["skill_id"] for s in skills_analysis.get("top_skills", [])[:3]]
        }

        return context

    # --------------------------------------------------
    # RESPONSE GENERATOR
    # --------------------------------------------------
    @staticmethod
    def _generate_response(
        intent: str,
        query: str,
        context: Dict[str, Any]
    ) -> str:

        if intent in {"career", "learning"}:
            # Check if vector store has data
            if GLOBAL_VECTOR_STORE.index.ntotal == 0:
                return "I don't have enough verified data yet. Please update your profile."
            rag_response = RAGService.answer(
                query=query,
                vector_store=GLOBAL_VECTOR_STORE,
                structured_context=context,
            )
            return rag_response

        if intent == "skills":
            return ChatbotService._skills_response(context)

        if intent == "assessment":
            return ChatbotService._assessment_response()

        return ChatbotService._general_response()

    # --------------------------------------------------
    # RESPONSE HANDLERS
    # --------------------------------------------------
    @staticmethod
    def _career_response(context: Dict[str, Any]) -> str:
        matches = context.get("career_matches", [])

        if not matches:
            return (
                "I need more information about your skills before suggesting careers. "
                "Please complete a skill assessment first."
            )

        top = matches[0]
        score = top.get("match_percentage", 0)

        msg = f"Your top career match is **{top['title']}** with a {score:.1f}% match. "

        if score >= 80:
            msg += "This is an excellent fit for your current skill set."
        elif score >= 60:
            msg += "This is a good match, with some skills to improve."
        else:
            msg += "This role could be a future target with focused learning."

        return msg

    @staticmethod
    def _skills_response(context: Dict[str, Any]) -> str:
        count = context.get("skills_count", 0)
        avg = context.get("average_skill_score", 0)

        if count == 0:
            return (
                "You haven't completed any skill assessments yet. "
                "Start with an assessment so I can analyze your strengths."
            )

        msg = f"You have assessed {count} skills with an average score of {avg:.1f}%. "

        top = context.get("top_skills", [])
        if top:
            names = [str(s["skill_id"]) for s in top]
            msg += f"Your strongest skills are IDs: {', '.join(names)}."

        return msg

    @staticmethod
    def _learning_response(context: Dict[str, Any]) -> str:
        matches = context.get("career_matches", [])

        if not matches:
            return (
                "Tell me which career you're aiming for, "
                "and I can generate a learning path for you."
            )

        role = matches[0]["title"]
        return (
            f"To become a {role}, you should focus on closing your skill gaps. "
            "I can generate a personalized learning path when you're ready."
        )

    @staticmethod
    def _assessment_response() -> str:
        return (
            "Skill assessments help me understand your abilities. "
            "You can assess multiple skills and update them over time."
        )

    @staticmethod
    def _general_response() -> str:
        return (
            "I can help with career recommendations, skill analysis, "
            "learning paths, and assessments. What would you like to explore?"
        )
