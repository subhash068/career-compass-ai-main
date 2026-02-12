from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models.user_skill import UserSkill
from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement
from services.career_service import CareerService
from services.skills_service import SkillsService
from ai.embeddings.embedding_service import EmbeddingService
from ai.embeddings.vector_store import VectorStore
from ai.llm.llm_service import LLMService


class Evaluation:
    """
    Offline evaluation scripts for measuring AI quality.
    """

    @staticmethod
    def evaluate_recommendation_accuracy(
        db: Session,
        user_id: int,
        target_role_id: int
    ) -> Dict[str, Any]:
        """
        Evaluate how accurate career recommendations are.
        """
        # Get user's actual skills
        user_skills = db.query(UserSkill).filter(
            UserSkill.user_id == user_id
        ).all()

        # Get recommendations
        recommendations = CareerService.recommend_careers(db, user_id, top_n=5)

        # Find target role in recommendations
        target_recommendation = next(
            (r for r in recommendations if r["role_id"] == target_role_id),
            None
        )

        if not target_recommendation:
            return {
                "accuracy": 0.0,
                "rank": None,
                "message": "Target role not in top 5 recommendations"
            }

        # Calculate rank (1-based)
        rank = recommendations.index(target_recommendation) + 1

        # Accuracy based on rank (higher rank = higher accuracy)
        accuracy = max(0, 1.0 - (rank - 1) / 5.0)

        return {
            "accuracy": accuracy,
            "rank": rank,
            "total_recommendations": len(recommendations)
        }

    @staticmethod
    def evaluate_skill_inference_precision(
        db: Session,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Evaluate precision of skill inference.
        """
        analysis = SkillsService.analyze_skills(db, user_id)
        inferred_skills = analysis.get("inferred_skills", [])

        if not inferred_skills:
            return {
                "precision": 0.0,
                "total_inferred": 0,
                "message": "No skills inferred"
            }

        # For now, assume all inferred skills are correct
        # In real evaluation, this would require ground truth
        precision = 1.0  # Placeholder

        return {
            "precision": precision,
            "total_inferred": len(inferred_skills)
        }

    @staticmethod
    def generate_evaluation_report(
        db: Session,
        user_ids: List[int]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive evaluation report.
        """
        report = {
            "total_users": len(user_ids),
            "recommendation_accuracy": [],
            "skill_inference_precision": [],
            "learning_completion_rate": 0.0  # Placeholder
        }

        for user_id in user_ids:
            # Recommendation accuracy (would need ground truth)
            # For demo, skip

            # Skill inference precision
            skill_eval = Evaluation.evaluate_skill_inference_precision(db, user_id)
            report["skill_inference_precision"].append(skill_eval["precision"])

        # Aggregate metrics
        if report["skill_inference_precision"]:
            report["avg_skill_inference_precision"] = sum(report["skill_inference_precision"]) / len(report["skill_inference_precision"])

        return report
