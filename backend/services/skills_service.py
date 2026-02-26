from typing import Dict, Any, List, Optional

from datetime import datetime

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from sqlalchemy.orm import Session

from models.user_skill import UserSkill
from models.skill import Skill
from models.skill_assessment import SkillAssessment, SkillAssessmentSkill
from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement
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
        # Get latest skill assessment scores from SkillAssessmentSkill table
        # This table has correct scores (percentages), unlike UserSkill which has corrupted data
        from sqlalchemy import func, and_
        from models.skill_assessment import SkillAssessmentSkill, SkillAssessment
        
        print(f"[DEBUG] analyze_skills called for user {user_id}")
        
        # Get the latest assessment for each skill using a proper subquery
        # that gets only the most recent record per skill
        subquery = db.query(
            SkillAssessmentSkill.skill_id,
            func.max(SkillAssessmentSkill.id).label('max_id')
        ).join(SkillAssessment).filter(
            SkillAssessment.user_id == user_id
        ).group_by(SkillAssessmentSkill.skill_id).subquery()
        
        latest_assessments = db.query(SkillAssessmentSkill).join(
            subquery,
            SkillAssessmentSkill.id == subquery.c.max_id
        ).all()
        
        print(f"[DEBUG] Found {len(latest_assessments)} latest assessment records")
        for asm in latest_assessments:
            skill_name = asm.skill.name if asm.skill else f"Skill {asm.skill_id}"
            print(f"[DEBUG] AssessmentSkill - {skill_name}: score={asm.score}, level={asm.level}")

        # Get user's assessed domain from their actual skills (not from assessment record)
        # This ensures we use the correct domain based on what skills they actually assessed
        user_domain_id = None
        if latest_assessments:
            # Get domain from the first assessed skill's actual domain
            # This is more accurate than the assessment record's domain_id
            first_skill_id = latest_assessments[0].skill_id
            first_skill = db.query(Skill).filter_by(id=first_skill_id).first()
            if first_skill and first_skill.domain_id:
                user_domain_id = first_skill.domain_id
                print(f"[DEBUG] Detected domain ID {user_domain_id} from user's actual skills")
            else:
                # Fallback to assessment record domain if skill domain not found
                latest_assessment = db.query(SkillAssessment).filter(
                    SkillAssessment.user_id == user_id
                ).order_by(SkillAssessment.created_at.desc()).first()
                if latest_assessment:
                    user_domain_id = latest_assessment.domain_id
                    print(f"[DEBUG] Fallback: Using assessment domain ID: {user_domain_id}")


        # Use assessment skills if found, otherwise fallback to UserSkill
        if latest_assessments:
            print("[DEBUG] Using assessment skills with correct scores")
            enhanced_skills = latest_assessments
            user_skills = latest_assessments  # For counting in response
        else:
            # Fallback to UserSkill if no assessments found
            print("[DEBUG] No assessment records found, falling back to UserSkill")
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
                    "skills": [],
                    "gaps": [],
                    "recommendations": []
                }
            
            # Convert UserSkill objects to match the expected format
            enhanced_skills = user_skills




        # Detect hidden/inferred skills (with fallback)
        inferred_skills = []
        try:
            hidden_skills_result = SkillInference.detect_hidden_skills(db, user_id)
            inferred_skills = hidden_skills_result.get("inferred_skills", [])
        except Exception as e:
            print(f"Hidden skills detection failed: {e}")
            inferred_skills = []

        # Generate insights
        insights = SkillsService._generate_skill_insights(enhanced_skills, inferred_skills)

        # Calculate detailed skill gaps based on job role requirements
        # Include unattempted domain skills as 100% gaps
        detailed_gaps = SkillsService._calculate_skill_gaps_with_unattempted(
            db, enhanced_skills, user_domain_id
        )


        # Format skills for frontend
        skills_data = []
        for skill_record in enhanced_skills:
            # Handle both UserSkill and SkillAssessmentSkill objects
            skill_name = skill_record.skill.name if skill_record.skill else f"Skill {skill_record.skill_id}"
            category = skill_record.skill.category if skill_record.skill else None
            
            # Get assessed_at - different fields for different models
            if hasattr(skill_record, 'assessed_at'):
                assessed_at = skill_record.assessed_at.isoformat() if skill_record.assessed_at else None
            else:
                assessed_at = skill_record.created_at.isoformat() if skill_record.created_at else None
            
            skills_data.append({
                "skill_id": skill_record.skill_id,
                "skill_name": skill_name,
                "category": category,
                "score": skill_record.score,
                "confidence": skill_record.confidence,
                "level": skill_record.level,
                "assessed_at": assessed_at,
            })


        return {
            "user_id": user_id,
            "total_skills": len(user_skills),
            "inferred_skills": len(inferred_skills),
            "insights": insights,
            "skill_breakdown": {
                "strengths": insights["strengths"],
                "gaps": [gap["skill"]["name"] for gap in detailed_gaps],
            },
            "skills": skills_data,
            "gaps": detailed_gaps,
            "recommendations": insights["recommendations"]
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

    @staticmethod
    def _calculate_skill_gaps(
        db: Session,
        user_skills: List[UserSkill]
    ) -> List[Dict[str, Any]]:
        """
        Calculate detailed skill gaps by comparing user skills against job role requirements.
        Returns list of gap objects with scores, levels, and severity.
        Shows ALL user skills, not just those matching job requirements.
        """
        return SkillsService._calculate_skill_gaps_with_unattempted(db, user_skills, None)

    @staticmethod
    def _calculate_skill_gaps_with_unattempted(
        db: Session,
        user_skills: List[UserSkill],
        user_domain_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Calculate detailed skill gaps including unattempted domain skills as 100% gaps.
        This ensures gap analysis shows 100% gap when user hasn't attempted all domain skills.
        """
        print(f"[DEBUG] _calculate_skill_gaps_with_unattempted called with {len(user_skills)} user skills, domain_id={user_domain_id}")
        
        # Build user skill map for quick lookup
        user_skill_map = {us.skill_id: us for us in user_skills}
        print(f"[DEBUG] User skill map: {list(user_skill_map.keys())}")

        # Get all job roles and their requirements
        try:
            roles = db.query(JobRole).all()
            print(f"[DEBUG] Found {len(roles)} job roles")
        except Exception as e:
            print(f"[ERROR] Failed to query job roles: {e}")
            roles = []

        # Collect all skill requirements from all roles
        all_requirements = {}
        for role in roles:
            try:
                requirements = db.query(RoleSkillRequirement).filter_by(role_id=role.id).all()
                print(f"[DEBUG] Role '{role.title}' (ID: {role.id}) has {len(requirements)} requirements")
                for req in requirements:
                    # Store the highest required level for each skill
                    if req.skill_id not in all_requirements:
                        all_requirements[req.skill_id] = req.required_level
                    else:
                        # Keep the higher level requirement
                        current_level = all_requirements[req.skill_id]
                        level_scores = {"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}
                        if level_scores.get(req.required_level, 0) > level_scores.get(current_level, 0):
                            all_requirements[req.skill_id] = req.required_level
            except Exception as e:
                print(f"[ERROR] Failed to query requirements for role {role.id}: {e}")
                continue

        print(f"[DEBUG] Total unique skill requirements collected: {len(all_requirements)}")

        # Get all skills in user's domain (if domain_id provided)
        domain_skills = []
        if user_domain_id:
            try:
                domain_skills = db.query(Skill).filter_by(domain_id=user_domain_id).all()
                print(f"[DEBUG] Found {len(domain_skills)} skills in user's domain (ID: {user_domain_id})")
            except Exception as e:
                print(f"[ERROR] Failed to query domain skills: {e}")

        # Create gaps for ALL domain skills (attempted + unattempted)
        gaps = []
        processed_skill_ids = set()

        # First, process all domain skills to include unattempted ones
        for domain_skill in domain_skills:
            skill_id = domain_skill.id
            
            if skill_id in processed_skill_ids:
                continue
            processed_skill_ids.add(skill_id)

            # Check if user has attempted this skill
            user_skill = user_skill_map.get(skill_id)
            
            if user_skill:
                # User attempted this skill - calculate gap normally
                current_score = user_skill.score
                current_level = SkillsService._score_to_level(current_score)
                
                # Determine required level
                if skill_id in all_requirements:
                    required_level = all_requirements[skill_id]
                else:
                    required_level = "advanced"
                
                required_score = SkillsService._level_to_score(required_level)
                gap_score = required_score - current_score
                
                # Determine severity based on gap
                if gap_score > 50:
                    severity = "high"
                    priority = 10
                elif gap_score > 25:
                    severity = "medium"
                    priority = 7
                elif gap_score > 5:
                    severity = "low"
                    priority = 4
                else:
                    severity = "none"
                    priority = 0
                    gap_score = 0
            else:
                # User has NOT attempted this skill - mark as 100% gap
                current_score = 0
                current_level = "none"
                
                # Determine required level
                if skill_id in all_requirements:
                    required_level = all_requirements[skill_id]
                else:
                    required_level = "advanced"
                
                required_score = SkillsService._level_to_score(required_level)
                gap_score = required_score  # 100% of required score is the gap
                severity = "high"  # Unattempted = high severity
                priority = 10  # Highest priority

            # Create gap entry
            gaps.append({
                "skillId": str(skill_id),
                "skill": {
                    "id": str(skill_id),
                    "name": domain_skill.name,
                    "description": domain_skill.description or "",
                    "categoryId": domain_skill.domain_id if domain_skill.domain_id else None,
                    "demandLevel": 5
                },
                "currentLevel": current_level,
                "requiredLevel": required_level,
                "currentScore": current_score,
                "requiredScore": required_score,
                "gapScore": gap_score,
                "severity": severity,
                "priority": priority,
                "isUnattempted": user_skill is None  # Flag to identify unattempted skills
            })

            status = "unattempted" if user_skill is None else f"attempted (score={current_score:.1f}%)"
            print(f"[DEBUG] Added skill '{domain_skill.name}': {status}, required={required_score}%, gap={gap_score:.1f}, severity={severity}")

        # If no domain_id provided, fall back to processing only user skills (original behavior)
        if not user_domain_id:
            for user_skill in user_skills:
                skill_id = user_skill.skill_id
                
                if skill_id in processed_skill_ids:
                    continue
                processed_skill_ids.add(skill_id)

                current_score = user_skill.score
                current_level = SkillsService._score_to_level(current_score)
                
                if skill_id in all_requirements:
                    required_level = all_requirements[skill_id]
                else:
                    required_level = "advanced"
                
                required_score = SkillsService._level_to_score(required_level)
                gap_score = required_score - current_score
                
                if gap_score > 50:
                    severity = "high"
                    priority = 10
                elif gap_score > 25:
                    severity = "medium"
                    priority = 7
                elif gap_score > 5:
                    severity = "low"
                    priority = 4
                else:
                    severity = "none"
                    priority = 0
                    gap_score = 0

                try:
                    skill = db.query(Skill).filter_by(id=skill_id).first()
                    if skill:
                        gaps.append({
                            "skillId": str(skill_id),
                            "skill": {
                                "id": str(skill_id),
                                "name": skill.name,
                                "description": skill.description or "",
                                "categoryId": skill.domain_id if skill.domain_id else None,
                                "demandLevel": 5
                            },
                            "currentLevel": current_level,
                            "requiredLevel": required_level,
                            "currentScore": current_score,
                            "requiredScore": required_score,
                            "gapScore": gap_score,
                            "severity": severity,
                            "priority": priority,
                            "isUnattempted": False
                        })
                except Exception as e:
                    print(f"[ERROR] Failed to get skill details for skill_id {skill_id}: {e}")

        # Sort by priority (highest first), then by gap score (highest first)
        gaps.sort(key=lambda x: (-x["priority"], -x["gapScore"]))
        
        unattempted_count = len([g for g in gaps if g.get("isUnattempted")])
        complete_count = len([g for g in gaps if g['severity'] == 'none'])
        print(f"[DEBUG] Returning {len(gaps)} skills total ({unattempted_count} unattempted, {complete_count} complete)")

        return gaps


    @staticmethod
    def _score_to_level(score: float) -> str:
        """
        Convert numerical score to skill level.
        """
        if score >= 87.5:
            return "expert"
        elif score >= 62.5:
            return "advanced"
        elif score >= 37.5:
            return "intermediate"
        else:
            return "beginner"

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
