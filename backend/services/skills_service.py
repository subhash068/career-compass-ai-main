from typing import Dict, Any, List
from datetime import datetime

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from sqlalchemy.orm import Session

from models.user_skill import UserSkill
from models.skill import Skill
from models.skill_assessment import SkillAssessment, SkillAssessmentSkill
from ai.skill_similarity import SkillSimilarity
from ai.skill_inference import SkillInference


class SkillsService:
    """
    Handles:
    - Skill assessment submission
    - User skill updates with versioning
    - Skill analysis
    - Similar skill discovery (TF-IDF)
    """

    # -----------------------------------------------------
    # SUBMIT FULL SKILL ASSESSMENT
    # -----------------------------------------------------
    @staticmethod
    def submit_assessment(
        db: Session,
        user_id: int,
        assessment_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        skills_data = assessment_payload.get("skills", [])

        if not skills_data:
            raise ValueError("No skills provided for assessment")

        valid_levels = {"beginner", "intermediate", "advanced", "expert"}

        # -----------------------------
        # INPUT VALIDATION (STRICT)
        # -----------------------------
        for item in skills_data:
            if "skill_id" not in item or "level" not in item:
                raise ValueError("Each skill must contain skill_id and level")

            skill = db.query(Skill).filter(Skill.id == item["skill_id"]).first()
            if not skill:
                raise ValueError(f"Skill {item['skill_id']} does not exist")

            if item["level"] not in valid_levels:
                raise ValueError(f"Invalid level: {item['level']}")

            confidence = item.get("confidence", 50)
            if not isinstance(confidence, int) or not (0 <= confidence <= 100):
                raise ValueError("Confidence must be integer between 0 and 100")

        # -----------------------------
        # CREATE ASSESSMENT SESSION
        # -----------------------------
        assessment = SkillAssessment(user_id=user_id)
        db.add(assessment)
        db.flush()  # ensures assessment.id exists

        # -----------------------------
        # PROCESS EACH SKILL
        # -----------------------------
        for item in skills_data:
            skill_id = item["skill_id"]
            level = item["level"]
            confidence = item.get("confidence", 50)

            # Calculate base score from level
            base_score = SkillsService._level_to_score(level)

            # Apply AI confidence calibration
            calibration_result = SkillInference.calibrate_confidence(
                base_score, confidence
            )
            calibrated_score = calibration_result["calibrated_score"]

            # Create or update user skill
            user_skill = db.query(UserSkill).filter_by(
                user_id=user_id, skill_id=skill_id
            ).first()

            if user_skill:
                # Update existing skill with versioning
                user_skill.score = calibrated_score
                user_skill.confidence = confidence
                user_skill.assessed_at = datetime.utcnow()
            else:
                # Create new user skill
                user_skill = UserSkill(
                    user_id=user_id,
                    skill_id=skill_id,
                    score=calibrated_score,
                    confidence=confidence,
                )
                db.add(user_skill)

            # Record in assessment session
            assessment_skill = SkillAssessmentSkill(
                assessment_id=assessment.id,
                skill_id=skill_id,
                level=level,
                confidence=confidence,
                score=calibrated_score,
            )
            db.add(assessment_skill)

        db.commit()

        return {
            "message": "Assessment submitted successfully",
            "assessment_id": assessment.id,
            "skills_processed": len(skills_data),
        }

    # -----------------------------------------------------
    # UPDATE SINGLE SKILL
    # -----------------------------------------------------
    @staticmethod
    def update_single_skill(
        db: Session,
        user_id: int,
        skill_id: int,
        level: str,
        confidence: int,
    ) -> Dict[str, Any]:
        valid_levels = {"beginner", "intermediate", "advanced", "expert"}

        if level not in valid_levels:
            raise ValueError(f"Invalid level: {level}")

        if not isinstance(confidence, int) or not (0 <= confidence <= 100):
            raise ValueError("Confidence must be integer between 0 and 100")

        # Verify skill exists
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            raise ValueError(f"Skill {skill_id} does not exist")

        # Calculate score
        base_score = SkillsService._level_to_score(level)

        # Apply AI calibration
        calibration_result = SkillInference.calibrate_confidence(
            base_score, confidence
        )
        calibrated_score = calibration_result["calibrated_score"]

        # Update or create user skill
        user_skill = db.query(UserSkill).filter_by(
            user_id=user_id, skill_id=skill_id
        ).first()

        if user_skill:
            user_skill.score = calibrated_score
            user_skill.confidence = confidence
            user_skill.assessed_at = datetime.utcnow()
        else:
            user_skill = UserSkill(
                user_id=user_id,
                skill_id=skill_id,
                score=calibrated_score,
                confidence=confidence,
            )
            db.add(user_skill)

        db.commit()
        db.refresh(user_skill)

        return {
            "message": "Skill updated successfully",
            "skill_id": skill_id,
            "skill_name": skill.name,
            "score": calibrated_score,
            "confidence": confidence,
        }

    # -----------------------------------------------------
    # GET USER SKILLS
    # -----------------------------------------------------
    @staticmethod
    def get_user_skills(
        db: Session,
        user_id: int
    ) -> Dict[str, Any]:
        user_skills = (
            db.query(UserSkill)
            .filter_by(user_id=user_id)
            .all()
        )

        skills_data = []
        for user_skill in user_skills:
            skills_data.append({
                "skill_id": user_skill.skill_id,
                "skill_name": user_skill.skill.name,
                "category": user_skill.skill.category,
                "score": user_skill.score,
                "confidence": user_skill.confidence,
                "assessed_at": user_skill.assessed_at.isoformat() if user_skill.assessed_at else None,
            })

        return {
            "user_id": user_id,
            "total_skills": len(skills_data),
            "skills": skills_data,
        }

    # -----------------------------------------------------
    # ANALYZE SKILLS (AI ENHANCED)
    # -----------------------------------------------------
    @staticmethod
    def analyze_skills(
        db: Session,
        user_id: int
    ) -> Dict[str, Any]:
        # Get user skills
        user_skills = (
            db.query(UserSkill)
            .filter_by(user_id=user_id)
            .all()
        )

        if not user_skills:
            return {
                "user_id": user_id,
                "message": "No skills found for analysis",
                "insights": {},
            }

        # Apply AI enhancements
        enhanced_skills = SkillsService._apply_ai_enhancements(db, user_skills)

        # Detect hidden/inferred skills
        hidden_skills_result = SkillInference.detect_hidden_skills(db, user_id)
        inferred_skills = hidden_skills_result.get("inferred_skills", [])

        # Generate insights
        insights = SkillsService._generate_skill_insights(enhanced_skills, inferred_skills)

        return {
            "user_id": user_id,
            "total_skills": len(user_skills),
            "inferred_skills": len(inferred_skills),
            "insights": insights,
            "skill_breakdown": {
                "strengths": insights["strengths"],
                "gaps": insights["gaps"],
            },
        }

    # -----------------------------------------------------
    # FIND SIMILAR SKILLS (TF-IDF)
    # -----------------------------------------------------
    @staticmethod
    def find_similar_skills(
        db: Session,
        skill_id: int,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find similar skills using TF-IDF and cosine similarity.
        """
        # Get all skills
        all_skills = db.query(Skill).all()
        if not all_skills:
            return []

        # Get target skill
        target_skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not target_skill:
            raise ValueError(f"Skill {skill_id} not found")

        # Prepare text data
        skill_texts = [
            f"{s.name} {s.description or ''} {s.category or ''}"
            for s in all_skills
        ]
        target_text = f"{target_skill.name} {target_skill.description or ''} {target_skill.category or ''}"

        # Compute TF-IDF
        try:
            vectorizer = TfidfVectorizer(stop_words="english")
            tfidf_matrix = vectorizer.fit_transform(skill_texts + [target_text])

            similarity_scores = cosine_similarity(
                tfidf_matrix[-1:], tfidf_matrix[:-1]
            )[0]

            # Get top N similar skills (excluding self)
            similar_indices = np.argsort(similarity_scores)[::-1]
            results = []

            for idx in similar_indices:
                if all_skills[idx].id == skill_id:
                    continue
                if len(results) >= top_n:
                    break

                score = float(similarity_scores[idx])
                if score > 0.1:  # Threshold for relevance
                    results.append({
                        "skill_id": all_skills[idx].id,
                        "skill_name": all_skills[idx].name,
                        "similarity_score": score,
                        "category": all_skills[idx].category,
                    })

            return results
        except Exception:
            # Fallback: return empty list if sklearn not available
            return []

    # -----------------------------------------------------
    # AI ENHANCED HELPERS
    # -----------------------------------------------------
    @staticmethod
    def _apply_ai_enhancements(
        db: Session,
        user_skills: List[UserSkill]
    ) -> List[UserSkill]:
        """
        Apply AI enhancements to user skills:
        - Confidence calibration
        - Similarity bonuses
        """
        enhanced_skills = []

        for user_skill in user_skills:
            # Calibrate confidence
            calibration_result = SkillInference.calibrate_confidence(
                user_skill.score, user_skill.confidence
            )
            calibrated_score = calibration_result["calibrated_score"]

            # Apply similarity bonus (placeholder - would need all skills context)
            # For now, just use calibrated score
            user_skill.score = calibrated_score
            enhanced_skills.append(user_skill)

        return enhanced_skills

    @staticmethod
    def _generate_skill_insights(
        user_skills: List[UserSkill],
        inferred_skills: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate insights about user's skill profile.
        """
        insights = {
            "strengths": [],
            "gaps": [],
            "recommendations": []
        }

        # Identify strengths (high-scoring skills)
        for skill in user_skills:
            if skill.score >= 75:
                insights["strengths"].append(skill.skill.name)

        # Identify gaps (low-scoring skills)
        for skill in user_skills:
            if skill.score < 50:
                insights["gaps"].append(skill.skill.name)

        # Add inferred skills as recommendations
        if inferred_skills:
            insights["recommendations"] = [
                f"Consider assessing {inf['name']} (inferred from {inf['inferred_from']})"
                for inf in inferred_skills[:3]
            ]

        return insights

    # -----------------------------------------------------
    # GET QUIZ QUESTIONS FOR SKILLS
    # -----------------------------------------------------
    @staticmethod
    def get_quiz_questions(
        db: Session,
        skill_ids: List[int]
    ) -> Dict[str, Any]:
        """
        Get quiz questions for selected skills (10 questions per skill)
        """
        questions_by_skill = {}

        for skill_id in skill_ids:
            # Verify skill exists
            skill = db.query(Skill).filter(Skill.id == skill_id).first()
            if not skill:
                continue

            # Get random 10 questions for this skill
            questions = SkillQuestion.find_random_by_skill(db, skill_id, limit=10)

            questions_by_skill[str(skill_id)] = {
                "skill_name": skill.name,
                "questions": [q.to_dict() for q in questions]
            }

        return {
            "total_skills": len(questions_by_skill),
            "questions": questions_by_skill
        }

    # -----------------------------------------------------
    # SUBMIT QUIZ ANSWERS
    # -----------------------------------------------------
    @staticmethod
    def submit_quiz_answers(
        db: Session,
        user_id: int,
        quiz_answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Submit quiz answers and calculate scores
        """
        skill_answers = quiz_answers.get("answers", {})
        skill_scores = {}

        for skill_id_str, answers in skill_answers.items():
            skill_id = int(skill_id_str)
            correct_count = 0
            total_questions = len(answers)

            for answer_data in answers:
                question_id = answer_data["question_id"]
                user_answer = answer_data["answer"]

                # Get question and check answer
                question = db.query(SkillQuestion).filter(SkillQuestion.id == question_id).first()
                if question and question.correct_answer == user_answer:
                    correct_count += 1

            # Calculate score (0-100)
            score = (correct_count / total_questions) * 100 if total_questions > 0 else 0

            # Map score to level
            level = SkillsService._score_to_level(score)

            # Calculate confidence based on consistency (simplified)
            confidence = min(100, correct_count * 10)

            skill_scores[str(skill_id)] = {
                "score": score,
                "level": level,
                "confidence": confidence,
                "correct_answers": correct_count,
                "total_questions": total_questions
            }

        # Create assessment with quiz results
        assessment_data = []
        for skill_id_str, score_data in skill_scores.items():
            assessment_data.append({
                "skill_id": int(skill_id_str),
                "level": score_data["level"],
                "confidence": score_data["confidence"],
                "score": score_data["score"]
            })

        # Submit assessment
        assessment_result = SkillsService.submit_assessment(
            db=db,
            user_id=user_id,
            assessment_payload={"skills": assessment_data}
        )

        return {
            "message": "Quiz submitted successfully",
            "assessment_id": assessment_result["assessment_id"],
            "skill_scores": skill_scores,
            "overall_score": sum(s["score"] for s in skill_scores.values()) / len(skill_scores) if skill_scores else 0
        }

    # -----------------------------------------------------
    # INTERNAL HELPER
    # -----------------------------------------------------
    @staticmethod
    def _level_to_score(level: str) -> float:
        return {
            "beginner": 25,
            "intermediate": 50,
            "advanced": 75,
            "expert": 100
        }.get(level, 25)

    @staticmethod
    def _score_to_level(score: float) -> str:
        if score >= 87.5:
            return "expert"
        elif score >= 62.5:
            return "advanced"
        elif score >= 37.5:
            return "intermediate"
        else:
            return "beginner"
