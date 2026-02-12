from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models.user_skill import UserSkill
from models.role_skill_requirement import RoleSkillRequirement
from .skill_similarity import SkillSimilarity
from .skill_inference import SkillInference
from .config.ai_settings import AISettings
from .evaluation.rag_metrics import RAGMetrics
from .memory.conversation_memory import ConversationMemory



class CareerScoring:
    """
    Multi-factor career scoring with explainable AI output.
    Phase 3A: Enhanced with embeddings, inference, evaluation, and memory.
    """

    @staticmethod
    def calculate_multi_factor_score(
        db: Session,
        user_id: int,
        role_requirements: List[RoleSkillRequirement],
        conversation_memory: Optional[ConversationMemory] = None
    ) -> Dict[str, Any]:
        """
        Calculate career match using multiple factors with Phase 3A enhancements:
        - Skill match (50%)
        - Inferred skills (15%)
        - Skill trend from memory (15%)
        - Growth rate from history (10%)
        - Learning speed estimation (10%)
        """
        user_skills = db.query(UserSkill).filter(
            UserSkill.user_id == user_id
        ).all()
        user_skill_map = {us.skill_id: us for us in user_skills}

        # Calculate skill match percentage
        skill_match_pct = CareerScoring._calculate_skill_match(
            user_skill_map, role_requirements
        )

        # Enhanced factors using Phase 3A capabilities
        inferred_skills_bonus = CareerScoring._calculate_inferred_skills_bonus(
            db, user_id, role_requirements
        )

        skill_trend = CareerScoring._calculate_skill_trend(conversation_memory)
        growth_rate = CareerScoring._calculate_growth_rate(conversation_memory)
        learning_speed = CareerScoring._estimate_learning_speed(user_skills, conversation_memory)

        # Weighted final score with enhanced factors
        final_score = (
            skill_match_pct * 0.5 +
            inferred_skills_bonus * 0.15 +
            skill_trend * 0.15 +
            growth_rate * 0.1 +
            learning_speed * 0.1
        )

        # Classify missing skill severity with inference
        missing_severity = CareerScoring._classify_missing_skills(
            user_skill_map, role_requirements, db, user_id
        )

        # Explainable output with evaluation
        explanation = CareerScoring._generate_explanation(
            skill_match_pct, missing_severity, inferred_skills_bonus
        )

        # Quality evaluation
        quality_metrics = CareerScoring._evaluate_scoring_quality(
            final_score, skill_match_pct, inferred_skills_bonus
        )

        return {
            "final_score": round(final_score, 1),
            "skill_match": skill_match_pct,
            "inferred_bonus": inferred_skills_bonus,
            "skill_trend": skill_trend,
            "growth_rate": growth_rate,
            "learning_speed": learning_speed,
            "missing_severity": missing_severity,
            "explanation": explanation,
            "key_skills": CareerScoring._get_key_skills(role_requirements),
            "improvement_priority": CareerScoring._get_improvement_priority(missing_severity),
            "quality_metrics": quality_metrics,
            "confidence_level": quality_metrics.get("overall_confidence", 0.5)
        }

    @staticmethod
    def _calculate_skill_match(
        user_skills: Dict[int, UserSkill],
        requirements: List[RoleSkillRequirement]
    ) -> float:
        """Calculate enhanced skill match percentage with similarity bonuses."""
        if not requirements:
            return 0.0

        total_weight = sum(req.weight for req in requirements)
        matched_weight = 0.0
        similarity_bonuses = []

        for req in requirements:
            user_skill = user_skills.get(req.skill_id)
            current_score = user_skill.score if user_skill else 0
            required_score = CareerScoring._level_to_score(req.required_level)

            # Base matching
            if current_score >= required_score:
                matched_weight += req.weight
            elif current_score >= required_score * 0.8:  # Partial match
                matched_weight += req.weight * 0.5

            # Add similarity bonus if skill exists but score is low
            if user_skill and current_score < required_score:
                # Find similar skills that might compensate
                skill_descriptions = [req.skill.description or req.skill.name]
                target_desc = user_skill.skill.description or user_skill.skill.name

                if AISettings.ENABLE_RAG:
                    similarities = SkillSimilarity.compute_similarity(
                        skill_descriptions, target_desc, top_n=1
                    )
                    if similarities:
                        bonus = similarities[0]["similarity"] * 0.1 * req.weight
                        matched_weight += bonus
                        similarity_bonuses.append({
                            "skill": req.skill.name,
                            "bonus": bonus,
                            "reason": "similar_skill_compensation"
                        })

        base_score = (matched_weight / total_weight) * 100 if total_weight > 0 else 0.0

        return min(base_score, 100.0)  # Cap at 100%

    @staticmethod
    def _calculate_inferred_skills_bonus(
        db: Session,
        user_id: int,
        role_requirements: List[RoleSkillRequirement]
    ) -> float:
        """Calculate bonus from inferred skills that match requirements."""
        if not AISettings.ENABLE_RAG:
            return 0.0

        try:
            inference_result = SkillInference.detect_hidden_skills(db, user_id)
            inferred_skills = inference_result.get("inferred_skills", [])

            if not inferred_skills:
                return 0.0

            # Check which inferred skills match role requirements
            req_skill_ids = {req.skill_id for req in role_requirements}
            matching_inferred = [
                skill for skill in inferred_skills
                if skill["skill_id"] in req_skill_ids
            ]

            if not matching_inferred:
                return 0.0

            # Calculate weighted bonus
            total_weight = sum(req.weight for req in role_requirements)
            bonus_weight = sum(
                next((req.weight for req in role_requirements if req.skill_id == skill["skill_id"]), 0)
                for skill in matching_inferred
            )

            # Apply confidence multiplier
            avg_confidence = sum(s["confidence"] for s in matching_inferred) / len(matching_inferred)
            bonus_percentage = (bonus_weight / total_weight) * avg_confidence * 50  # Max 50% bonus

            return min(bonus_percentage, 50.0)

        except Exception:
            # Fallback to no bonus if inference fails
            return 0.0

    @staticmethod
    def _calculate_skill_trend(conversation_memory: Optional[ConversationMemory]) -> float:
        """Calculate skill improvement trend from conversation memory."""
        if not conversation_memory or not AISettings.ENABLE_MEMORY:
            return 0.5  # Neutral

        skill_progression = conversation_memory.memory.get("skill_progression", {})
        if not skill_progression:
            return 0.5

        # Calculate average improvement across all tracked skills
        total_improvement = 0
        skill_count = 0

        for skill_data in skill_progression.values():
            if len(skill_data) > 1:
                # Calculate trend slope (simplified)
                improvements = [entry.get("improvement", 0) for entry in skill_data[-5:]]  # Last 5 entries
                if improvements:
                    avg_improvement = sum(improvements) / len(improvements)
                    total_improvement += avg_improvement
                    skill_count += 1

        if skill_count == 0:
            return 0.5

        avg_trend = total_improvement / skill_count
        # Convert to 0-1 scale (negative trends = 0, strong positive = 1)
        return max(0, min(1, 0.5 + avg_trend / 20))  # Assume 20 points = full positive

    @staticmethod
    def _calculate_growth_rate(conversation_memory: Optional[ConversationMemory]) -> float:
        """Calculate growth rate from historical data."""
        if not conversation_memory:
            return 0.5

        # Simplified: based on number of skills with recent improvements
        skill_progression = conversation_memory.memory.get("skill_progression", {})
        recent_improvements = 0
        total_skills = len(skill_progression)

        if total_skills == 0:
            return 0.5

        for skill_data in skill_progression.values():
            if skill_data and skill_data[-1].get("improvement", 0) > 0:
                recent_improvements += 1

        return recent_improvements / total_skills

    @staticmethod
    def _estimate_learning_speed(
        user_skills: List[UserSkill],
        conversation_memory: Optional[ConversationMemory]
    ) -> float:
        """Estimate learning speed based on skill acquisition rate."""
        if not user_skills:
            return 0.5

        # Base estimation on number of skills and average scores
        avg_score = sum(skill.score for skill in user_skills) / len(user_skills)
        skill_count = len(user_skills)

        # Higher skill count and scores suggest faster learning
        base_speed = min(1.0, (skill_count / 20) + (avg_score / 200))  # Max at 20 skills + high scores

        # Adjust based on memory if available
        if conversation_memory:
            conversation_count = len(conversation_memory.memory.get("conversation_history", []))
            if conversation_count > 10:  # Active learner
                base_speed = min(1.0, base_speed * 1.2)

        return base_speed

    @staticmethod
    def _classify_missing_skills(
        user_skills: Dict[int, UserSkill],
        requirements: List[RoleSkillRequirement],
        db: Session,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Classify missing skills by severity with inference consideration."""
        severity_list = []

        for req in requirements:
            user_skill = user_skills.get(req.skill_id)
            current_score = user_skill.score if user_skill else 0
            required_score = CareerScoring._level_to_score(req.required_level)

            gap = required_score - current_score
            if gap > 0:
                # Check if inference might help
                inferred_bonus = 0
                if AISettings.ENABLE_RAG:
                    try:
                        inference_result = SkillInference.detect_hidden_skills(db, user_id)
                        inferred_skill = next(
                            (s for s in inference_result.get("inferred_skills", [])
                             if s["skill_id"] == req.skill_id), None
                        )
                        if inferred_skill:
                            inferred_bonus = inferred_skill["confidence"] * required_score * 0.5
                    except Exception:
                        pass

                effective_gap = max(0, gap - inferred_bonus)

                if effective_gap <= 25:
                    severity = "low"
                    description = "Can learn quickly" + (" (inferred skills help)" if inferred_bonus > 0 else "")
                elif effective_gap <= 50:
                    severity = "medium"
                    description = "Needs structured learning" + (" (partial inference)" if inferred_bonus > 0 else "")
                else:
                    severity = "high"
                    description = "Core skill missing" + (" (inference may not suffice)" if inferred_bonus > 0 else "")

                severity_list.append({
                    "skill_name": req.skill.name,
                    "gap": gap,
                    "effective_gap": effective_gap,
                    "severity": severity,
                    "description": description,
                    "inferred_bonus": inferred_bonus
                })

        return severity_list

    @staticmethod
    def _generate_explanation(
        skill_match: float,
        missing_severity: List[Dict[str, Any]],
        inferred_bonus: float
    ) -> str:
        """Generate human-readable explanation with Phase 3A insights."""
        if skill_match >= 80:
            base = "Excellent match for your current skill set."
        elif skill_match >= 60:
            base = "Good match with some skills to improve."
        else:
            base = "Significant skill development needed."

        if inferred_bonus > 0:
            base += f" Your inferred skills provide a {inferred_bonus:.1f}% boost to this assessment."

        if missing_severity:
            high_priority = [s for s in missing_severity if s["severity"] == "high"]
            if high_priority:
                base += f" Focus on core skills like {high_priority[0]['skill_name']}."

        return base

    @staticmethod
    def _get_key_skills(requirements: List[RoleSkillRequirement]) -> List[str]:
        """Get most important skills for the role."""
        sorted_reqs = sorted(requirements, key=lambda x: x.weight, reverse=True)
        return [req.skill.name for req in sorted_reqs[:3]]

    @staticmethod
    def _get_improvement_priority(missing_severity: List[Dict[str, Any]]) -> List[str]:
        """Prioritize skills to improve with severity consideration."""
        high_severity = [s["skill_name"] for s in missing_severity if s["severity"] == "high"]
        medium_severity = [s["skill_name"] for s in missing_severity if s["severity"] == "medium"]
        return high_severity + medium_severity

    @staticmethod
    def _level_to_score(level: str) -> int:
        """Convert skill level to numerical score."""
        return {
            "beginner": 25,
            "intermediate": 50,
            "advanced": 75,
            "expert": 100,
        }.get(level.lower(), 25)

    @staticmethod
    def _evaluate_scoring_quality(
        final_score: float,
        skill_match: float,
        inferred_bonus: float
    ) -> Dict[str, Any]:
        """Evaluate the quality and confidence of the scoring."""
        # Calculate confidence based on factors
        factors_used = 1  # Base skill match
        confidence = 0.7  # Base confidence

        if inferred_bonus > 0:
            factors_used += 1
            confidence += 0.1

        if AISettings.ENABLE_MEMORY:
            factors_used += 1
            confidence += 0.1

        # Adjust confidence based on score consistency
        score_consistency = 1 - abs(final_score - skill_match) / 100
        confidence *= score_consistency

        return {
            "factors_used": factors_used,
            "overall_confidence": min(confidence, 1.0),
            "score_consistency": score_consistency,
            "method_used": "phase_3a_enhanced" if AISettings.ENABLE_RAG else "basic"
        }
