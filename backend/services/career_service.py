from typing import List, Dict, Any
from sqlalchemy.orm import Session

from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement
from models.user_skill import UserSkill
from ai.career_scoring import CareerScoring


class CareerService:
    """
    Handles career recommendations using
    weighted skill-role matching.
    """

    @staticmethod
    def get_matches(
        db: Session,
        user_id: int,
        top_n: int = 5
    ) -> Dict[str, Any]:
        """
        Get career matches for a user.
        Returns recommendations in the format expected by the API.
        """
        recommendations = CareerService.recommend_careers(
            db=db,
            user_id=user_id,
            top_n=top_n
        )

        return {
            "recommendations": recommendations,
            "topMatches": recommendations[:3] if recommendations else []
        }

    @staticmethod
    def recommend_careers(
        db: Session,
        user_id: int,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        user_skills = db.query(UserSkill).filter(
            UserSkill.user_id == user_id
        ).all()

        user_skill_map = {us.skill_id: us for us in user_skills}

        roles = db.query(JobRole).all()
        recommendations = []

        for role in roles:
            requirements = db.query(RoleSkillRequirement).filter(
                RoleSkillRequirement.role_id == role.id
            ).all()

            if not requirements:
                continue

            # Use AI-enhanced multi-factor scoring
            scoring_result = CareerScoring.calculate_multi_factor_score(
                db, user_id, requirements
            )

            # Get matched/missing skills for backward compatibility
            match_pct, matched, missing = CareerService._calculate_match_score(
                user_skill_map, requirements
            )

            recommendation = {
                "role_id": role.id,
                "title": role.title,
                "level": role.level,
                "match_percentage": scoring_result["final_score"],
                "matched_skills": matched,
                "missing_skills": missing,
                "explanation": scoring_result["explanation"],
                "key_skills": scoring_result["key_skills"],
                "improvement_priority": scoring_result["improvement_priority"],
                "missing_severity": scoring_result["missing_severity"]
            }

            recommendations.append(recommendation)

        recommendations.sort(
            key=lambda x: x["match_percentage"],
            reverse=True
        )

        return recommendations[:top_n]

    @staticmethod
    def _calculate_match_score(
        user_skills: Dict[int, UserSkill],
        requirements: List[RoleSkillRequirement]
    ) -> tuple[int, List[str], List[str]]:

        total_weight = 0.0
        matched_weight = 0.0
        matched_skills = []
        missing_skills = []

        for req in requirements:
            total_weight += req.weight

            user_skill = user_skills.get(req.skill_id)
            current_score = user_skill.score if user_skill else 0
            required_score = CareerService._level_to_score(req.required_level)

            skill_name = req.skill.name if req.skill else f"Skill {req.skill_id}"

            if current_score >= required_score:
                matched_weight += req.weight
                matched_skills.append(skill_name)
            else:
                missing_skills.append(skill_name)

        if total_weight == 0:
            return 0, [], []

        match_percentage = int((matched_weight / total_weight) * 100)
        match_percentage = max(0, min(100, match_percentage))

        return match_percentage, matched_skills, missing_skills

    @staticmethod
    def _level_to_score(level: str) -> int:
        return {
            "beginner": 25,
            "intermediate": 50,
            "advanced": 75,
            "expert": 100,
        }.get(level, 25)
