from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models.skill import Skill
from models.user_skill import UserSkill
from .skill_similarity import SkillSimilarity
from .config.ai_settings import AISettings
from .evaluation.ai_quality import AIQualityMetrics
from .memory.conversation_memory import ConversationMemory


class SkillInference:
    """
    Handles confidence calibration and hidden skill detection.
    Phase 3A: Enhanced with embeddings, configurable thresholds, and evaluation.
    """

    @staticmethod
    def calibrate_confidence(
        base_score: float,
        user_confidence: int,
        conversation_memory: Optional[ConversationMemory] = None
    ) -> Dict[str, Any]:
        """
        Calibrate final score using user confidence and historical data.
        Reduces bias from overconfident users and incorporates learning trends.
        """
        confidence_factor = user_confidence / 100.0

        # Adjust based on historical performance if available
        historical_adjustment = 1.0
        if conversation_memory:
            skill_trends = conversation_memory.memory.get("skill_progression", {})
            if skill_trends:
                # Calculate average improvement rate
                improvements = []
                for skill_data in skill_trends.values():
                    if len(skill_data) > 1:
                        latest = skill_data[-1]
                        improvements.append(latest.get("improvement", 0))
                if improvements:
                    avg_improvement = sum(improvements) / len(improvements)
                    historical_adjustment = 1 + (avg_improvement / 100)  # Boost for consistent improvement

        calibrated_score = base_score * confidence_factor * historical_adjustment
        calibrated_score = min(max(calibrated_score, 0), 100)  # Clamp to 0-100

        return {
            "calibrated_score": calibrated_score,
            "confidence_factor": confidence_factor,
            "historical_adjustment": historical_adjustment,
            "adjustment_reason": "historical_performance" if historical_adjustment != 1.0 else "none"
        }

    @staticmethod
    def detect_hidden_skills(
        db: Session,
        user_id: int,
        threshold: Optional[float] = None,
        conversation_memory: Optional[ConversationMemory] = None
    ) -> Dict[str, Any]:
        """
        Infer skills based on similar skills the user already has.
        Uses embeddings for semantic similarity.
        """
        if threshold is None:
            threshold = AISettings.SKILL_INFERENCE_THRESHOLD

        # Get user's current skills
        user_skills = db.query(UserSkill).filter_by(user_id=user_id).all()
        user_skill_ids = {us.skill_id for us in user_skills}

        # Get all available skills
        all_skills = db.query(Skill).all()

        # Build descriptions for similarity comparison
        user_skill_descriptions = [
            f"{us.skill.name} {us.skill.description or ''}"
            for us in user_skills
        ]

        inferred_skills = []
        evaluation_metrics = {
            "total_candidates": 0,
            "passed_threshold": 0,
            "high_confidence": 0
        }

        for candidate_skill in all_skills:
            if candidate_skill.id in user_skill_ids:
                continue  # Skip skills user already has

            candidate_desc = f"{candidate_skill.name} {candidate_skill.description or ''}"

            # Use embeddings for similarity
            similarities = SkillSimilarity.compute_similarity(
                user_skill_descriptions,
                candidate_desc,
                top_n=3,
                use_embeddings=AISettings.ENABLE_RAG
            )

            if not similarities:
                continue

            evaluation_metrics["total_candidates"] += 1

            # Calculate weighted confidence based on top similarities
            top_similarity = similarities[0]["similarity"]
            avg_similarity = sum(s["similarity"] for s in similarities) / len(similarities)

            # Confidence score combines top match and average
            confidence = (top_similarity * 0.7 + avg_similarity * 0.3)

            if confidence >= threshold:
                evaluation_metrics["passed_threshold"] += 1

                # Quality check the inference
                quality_check = AIQualityMetrics.evaluate_ai_response(
                    f"Infer skill {candidate_skill.name}",
                    f"Confidence: {confidence:.2f} based on {len(similarities)} similar skills",
                    [s["skill_description"] for s in similarities],
                    user_feedback=None
                )

                if quality_check.get("passes_quality_check", False):
                    evaluation_metrics["high_confidence"] += 1

                inferred_skills.append({
                    "skill_id": candidate_skill.id,
                    "name": candidate_skill.name,
                    "confidence": confidence,
                    "inferred_from": [
                        {
                            "skill_id": us.skill_id,
                            "similarity": s["similarity"]
                        }
                        for us, s in zip(
                            [us for us in user_skills if any(
                                sim["index"] == i for sim in similarities
                            )],
                            similarities
                        )
                    ],
                    "quality_score": quality_check.get("quality_score", 0.5)
                })

        # Sort by confidence
        inferred_skills.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "inferred_skills": inferred_skills,
            "total_candidates": len(inferred_skills),
            "evaluation_metrics": evaluation_metrics,
            "threshold_used": threshold,
            "method_used": "embeddings" if AISettings.ENABLE_RAG else "tfidf"
        }

    @staticmethod
    def apply_similarity_bonus(
        user_skill: UserSkill,
        similar_skills: List[Dict[str, Any]],
        bonus_multiplier: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Apply bonus to score based on similar skills with evaluation.
        """
        if bonus_multiplier is None:
            bonus_multiplier = 0.1

        total_bonus = sum(sim["similarity"] for sim in similar_skills) * bonus_multiplier
        original_score = user_skill.score
        new_score = min(original_score + total_bonus, 100.0)

        # Evaluate the bonus application
        quality_check = AIQualityMetrics.evaluate_ai_response(
            f"Applying similarity bonus to {user_skill.skill.name}",
            f"Score updated from {original_score} to {new_score}",
            [],  # No retrieved docs for this evaluation
            user_feedback=None
        )

        return {
            "original_score": original_score,
            "new_score": new_score,
            "bonus_applied": total_bonus,
            "similar_skills_used": len(similar_skills),
            "quality_check": quality_check,
            "passes_quality": quality_check.get("passes_quality_check", False)
        }

    @staticmethod
    def get_inference_stats(
        db: Session,
        user_id: int
    ) -> Dict[str, Any]:
        """Get statistics about skill inference performance."""
        analysis = SkillInference.detect_hidden_skills(db, user_id)

        if not analysis["inferred_skills"]:
            return {"error": "No skills inferred"}

        confidences = [s["confidence"] for s in analysis["inferred_skills"]]
        qualities = [s["quality_score"] for s in analysis["inferred_skills"]]

        return {
            "total_inferred": len(analysis["inferred_skills"]),
            "avg_confidence": sum(confidences) / len(confidences),
            "avg_quality": sum(qualities) / len(qualities),
            "method_used": analysis["method_used"],
            "threshold_used": analysis["threshold_used"]
        }
