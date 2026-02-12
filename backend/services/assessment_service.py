import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.skill import Skill
from models.skill_question import SkillQuestion
from models.skill_assessment import SkillAssessment, SkillAssessmentSkill, UserAnswer
from models.user_skill import UserSkill
from models.domain import Domain
from schemas.assessment import (
    InitializeAssessmentRequest,
    StartSkillQuizRequest,
    SubmitQuizRequest,
    SelectedSkillsResponse,
    StartQuizResponse,
    SubmitQuizResponse,
    AssessmentResultResponse,
    SkillInfo,
    QuestionResponse,
    QuizResult
)


class AssessmentService:

    @staticmethod
    def initialize_assessment(
        db: Session,
        user_id: int,
        request: InitializeAssessmentRequest
    ) -> SelectedSkillsResponse:
        """
        Initialize assessment by validating domain and skills
        """
        # Validate domain exists
        domain = db.query(Domain).filter(Domain.id == request.domain_id).first()
        if not domain:
            raise ValueError(f"Domain {request.domain_id} not found")

        # Validate all skills exist and belong to the domain
        skills = db.query(Skill).filter(
            and_(Skill.id.in_(request.skill_ids), Skill.domain_id == request.domain_id)
        ).all()

        if len(skills) != len(request.skill_ids):
            found_ids = {skill.id for skill in skills}
            missing_ids = set(request.skill_ids) - found_ids
            raise ValueError(f"Skills not found or not in domain: {list(missing_ids)}")

        # Create assessment record
        assessment = SkillAssessment(
            user_id=user_id,
            status='initialized'
        )
        db.add(assessment)
        db.flush()  # Get assessment ID

        # Convert to response format
        skill_infos = [
            SkillInfo(
                id=skill.id,
                name=skill.name,
                description=skill.description
            ) for skill in skills
        ]

        db.commit()

        return SelectedSkillsResponse(
            skills=skill_infos,
            assessment_id=assessment.id
        )

    @staticmethod
    def get_selected_skills(
        db: Session,
        user_id: int,
        assessment_id: Optional[int] = None
    ) -> SelectedSkillsResponse:
        """
        Get selected skills for current assessment
        """
        if assessment_id:
            assessment = db.query(SkillAssessment).filter(
                and_(SkillAssessment.id == assessment_id, SkillAssessment.user_id == user_id)
            ).first()
            if not assessment:
                raise ValueError("Assessment not found")

            # Get skills from assessment_skills
            skill_ids = [s.skill_id for s in assessment.assessment_skills]
        else:
            # Get from session storage (not available in backend)
            # This would need to be stored in assessment record
            raise ValueError("Assessment ID required")

        skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()

        skill_infos = [
            SkillInfo(
                id=skill.id,
                name=skill.name,
                description=skill.description
            ) for skill in skills
        ]

        return SelectedSkillsResponse(
            skills=skill_infos,
            assessment_id=assessment_id
        )

    @staticmethod
    def start_skill_quiz(
        db: Session,
        user_id: int,
        request: StartSkillQuizRequest
    ) -> StartQuizResponse:
        """
        Start quiz for a specific skill with randomized questions
        """
        # Validate skill exists
        skill = db.query(Skill).filter(Skill.id == request.skill_id).first()
        if not skill:
            raise ValueError(f"Skill {request.skill_id} not found")

        # Check if user has access to this skill (has it in their assessment)
        # For now, allow all skills - in production, check assessment record

        # Get random 10 questions for the skill
        questions = db.query(SkillQuestion).filter(
            SkillQuestion.skill_id == request.skill_id
        ).all()

        if len(questions) < 10:
            raise ValueError(f"Insufficient questions for skill {request.skill_id}")

        # Randomize and limit to 10
        selected_questions = random.sample(questions, 10)

        # Convert to response format
        question_responses = [
            QuestionResponse(
                id=q.id,
                question_text=q.question_text,
                options=q.get_options(),
                difficulty=q.difficulty
            ) for q in selected_questions
        ]

        return StartQuizResponse(
            skill_id=request.skill_id,
            skill_name=skill.name,
            questions=question_responses,
            time_limit=600  # 10 minutes
        )

    @staticmethod
    def submit_quiz(
        db: Session,
        user_id: int,
        request: SubmitQuizRequest
    ) -> SubmitQuizResponse:
        """
        Submit quiz answers, calculate score, and update confidence
        """
        # Validate skill_id is present
        if not request.skill_id:
            raise ValueError("Skill ID is required to submit quiz")
        
        # Validate skill exists
        skill = db.query(Skill).filter(Skill.id == request.skill_id).first()
        if not skill:
            raise ValueError(f"Skill {request.skill_id} not found")


        # Get all questions for this skill
        questions = db.query(SkillQuestion).filter(
            SkillQuestion.skill_id == request.skill_id
        ).all()

        # Create or get assessment
        assessment = db.query(SkillAssessment).filter(
            and_(SkillAssessment.user_id == user_id, SkillAssessment.status == 'in_progress')
        ).first()

        if not assessment:
            assessment = SkillAssessment(
                user_id=user_id,
                status='in_progress'
            )
            db.add(assessment)
            db.flush()

        # Calculate score
        total_questions = len(request.answers)
        correct_answers = 0

        # Store answers
        for question_id, user_answer in request.answers.items():
            question = next((q for q in questions if q.id == question_id), None)
            if not question:
                continue

            is_correct = user_answer == question.correct_answer

            if is_correct:
                correct_answers += 1

            # Store user answer
            user_answer_record = UserAnswer(
                assessment_id=assessment.id,
                skill_id=request.skill_id,
                question_id=question_id,
                user_answer=user_answer,
                is_correct='true' if is_correct else 'false'
            )
            db.add(user_answer_record)

        percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0

        # Determine level
        if percentage <= 40:
            level = "Beginner"
        elif percentage <= 70:
            level = "Intermediate"
        else:
            level = "Advanced"

        # Update or create user skill record
        user_skill = db.query(UserSkill).filter(
            and_(UserSkill.user_id == user_id, UserSkill.skill_id == request.skill_id)
        ).first()

        confidence_updated = False
        if user_skill:
            # Update confidence using formula: new_confidence = (old_confidence * 0.4) + (percentage * 0.6)
            old_confidence = user_skill.confidence
            new_confidence = int((old_confidence * 0.4) + (percentage * 0.6))
            new_confidence = max(0, min(100, new_confidence))  # Clamp to 0-100

            user_skill.confidence = new_confidence
            user_skill.score = percentage
            user_skill.level = level.lower()
            user_skill.assessed_at = datetime.utcnow()
            confidence_updated = True
        else:
            # Create new user skill record
            user_skill = UserSkill(
                user_id=user_id,
                skill_id=request.skill_id,
                level=level.lower(),
                confidence=int(percentage),
                score=percentage
            )
            db.add(user_skill)

        # Store assessment skill result
        assessment_skill = SkillAssessmentSkill(
            assessment_id=assessment.id,
            skill_id=request.skill_id,
            level=level.lower(),
            confidence=user_skill.confidence,
            score=percentage
        )
        db.add(assessment_skill)

        # Update assessment status if all skills completed
        # For now, mark as completed since we're handling one skill at a time

        db.commit()

        # Create quiz result
        quiz_result = QuizResult(
            skill_id=request.skill_id,
            skill_name=skill.name,
            total_questions=total_questions,
            correct_answers=correct_answers,
            percentage=percentage,
            level=level,
            time_taken=request.time_taken
        )

        # Calculate overall score (simplified - just this skill's score)
        overall_score = percentage
        overall_level = level

        return SubmitQuizResponse(
            assessment_id=assessment.id,
            skill_results=[quiz_result],
            overall_score=overall_score,
            overall_level=overall_level,
            confidence_updated=confidence_updated
        )

    @staticmethod
    def get_assessment_result(
        db: Session,
        user_id: int,
        skill_id: int
    ) -> AssessmentResultResponse:
        """
        Get assessment result for a specific skill
        """
        # Get latest assessment for this user and skill
        assessment_skill = db.query(SkillAssessmentSkill).join(SkillAssessment).filter(
            and_(
                SkillAssessment.user_id == user_id,
                SkillAssessmentSkill.skill_id == skill_id
            )
        ).order_by(SkillAssessment.created_at.desc()).first()

        if not assessment_skill:
            raise ValueError(f"No assessment found for skill {skill_id}")

        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            raise ValueError(f"Skill {skill_id} not found")

        return AssessmentResultResponse(
            skill_id=skill_id,
            skill_name=skill.name,
            score=assessment_skill.score,
            percentage=assessment_skill.score,
            level=assessment_skill.level.title(),
            confidence=assessment_skill.confidence,
            completed_at=assessment_skill.created_at
        )
