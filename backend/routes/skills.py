from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from models.database import get_db
from models.user import User
from models.skill import Skill
from models.domain import Domain
from models.assessment import Assessment
from models.assessment_question import AssessmentQuestion
from models.assessment_answer import AssessmentAnswer
from models.skill_question import SkillQuestion
from services.skills_service import SkillsService
from routes.auth_fastapi import get_current_user

router = APIRouter(tags=["Skills"])


# ----------------------------
# Pydantic Schemas
# ----------------------------
class SkillsData(BaseModel):
    skills: List[Dict[str, Any]]


class SingleSkillUpdate(BaseModel):
    skill_id: int
    level: str
    confidence: int


class QuizRequest(BaseModel):
    skill_ids: List[int]


class QuizAnswer(BaseModel):
    question_id: int
    answer: str


class QuizSubmission(BaseModel):
    answers: Dict[str, List[QuizAnswer]]  # skill_id -> list of answers


class AssessmentStartRequest(BaseModel):
    user_id: int
    skill_ids: List[int]


class AssessmentSubmitRequest(BaseModel):
    assessment_id: int
    answers: Dict[int, str]  # question_id -> answer
    written_assessments: Optional[Dict[str, str]] = None  # skill_id -> written assessment text



# ----------------------------
# Routes
# ----------------------------

@router.get("/user")
def get_user_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all skills for current user
    """
    try:
        result = SkillsService.get_user_skills(
            db=db,
            user_id=current_user.id,
        )
        return result.get("skills", [])
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analyze")
def analyze_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze user's skills - returns format matching frontend expectations
    """
    try:
        result = SkillsService.analyze_skills(
            db=db,
            user_id=current_user.id,
        )

        # Transform to match frontend SkillAnalysisResponse format
        # The frontend expects: { skills: [], gaps: [], recommendations: [] }
        return {
            "skills": result.get("skills", []),
            "gaps": result.get("gaps", []),
            "recommendations": result.get("recommendations", [])
        }
    except Exception as e:
        import traceback
        print(f"Error in analyze_skills route: {e}")
        print(traceback.format_exc())
        # Return fallback response instead of error
        return {
            "skills": [],
            "gaps": [],
            "recommendations": []
        }


@router.get("/{domain_id}")
def get_skills_by_domain(domain_id: int, db: Session = Depends(get_db)):
    """
    Get all skills for a specific domain
    """
    try:
        skills = db.query(Skill).filter_by(domain_id=domain_id).all()
        return [skill.to_dict() for skill in skills]
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/assessment/start")
def start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Start a new assessment for selected skills
    """
    try:
        assessment = Assessment(user_id=current_user.id)
        db.add(assessment)
        db.flush()  # Get the assessment ID

        questions_data = {}

        for skill_id in request.skill_ids:
            # Get skill info
            skill = db.query(Skill).filter_by(id=skill_id).first()
            if not skill:
                raise HTTPException(status_code=404, detail=f"Skill {skill_id} not found")

            # Get questions for this skill with difficulty distribution
            easy_questions = db.query(SkillQuestion).filter_by(skill_id=skill_id, difficulty="easy").limit(3).all()
            medium_questions = db.query(SkillQuestion).filter_by(skill_id=skill_id, difficulty="medium").limit(4).all()
            hard_questions = db.query(SkillQuestion).filter_by(skill_id=skill_id, difficulty="hard").limit(3).all()

            skill_questions = easy_questions + medium_questions + hard_questions

            # Shuffle questions
            import random
            random.shuffle(skill_questions)

            questions_data[str(skill_id)] = {
                "skill_name": skill.name,
                "questions": [
                    {
                        "id": q.id,
                        "question_text": q.question_text,
                        "options": q.get_options(),
                        "difficulty": q.difficulty
                    } for q in skill_questions
                ]
            }

            # Link questions to assessment
            for question in skill_questions:
                assessment_question = AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_id=question.id,
                    skill_id=skill_id
                )
                db.add(assessment_question)

        db.commit()

        return {
            "assessment_id": assessment.id,
            "total_skills": len(request.skill_ids),
            "questions": questions_data
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/assessment/submit")
def submit_assessment(request: AssessmentSubmitRequest, db: Session = Depends(get_db)):
    """
    Submit assessment answers and calculate results
    """
    try:
        # Get assessment
        assessment = db.query(Assessment).filter_by(id=request.assessment_id).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")

        skill_scores = {}
        total_correct = 0
        total_questions = 0

        # Get all assessment questions grouped by skill
        assessment_questions = db.query(AssessmentQuestion).filter_by(assessment_id=request.assessment_id).all()

        skill_question_map = {}
        for aq in assessment_questions:
            if aq.skill_id not in skill_question_map:
                skill_question_map[aq.skill_id] = []
            skill_question_map[aq.skill_id].append(aq.question_id)

        # Process answers for each skill
        for skill_id, question_ids in skill_question_map.items():
            skill_correct = 0
            skill_total = len(question_ids)

            for question_id in question_ids:
                if question_id in request.answers:
                    user_answer = request.answers[question_id]

                    # Get correct answer
                    question = db.query(SkillQuestion).filter_by(id=question_id).first()
                    if question:
                        is_correct = user_answer == question.correct_answer

                        # Save answer
                        answer_record = AssessmentAnswer(
                            assessment_id=request.assessment_id,
                            question_id=question_id,
                            user_answer=user_answer,
                            is_correct=is_correct
                        )
                        db.add(answer_record)

                        if is_correct:
                            skill_correct += 1
                            total_correct += 1

            total_questions += skill_total
            percentage = (skill_correct / skill_total) * 100 if skill_total > 0 else 0

            # Determine level and gap
            if percentage <= 40:
                level = "Beginner"
                gap = "High"
            elif percentage <= 70:
                level = "Intermediate"
                gap = "Medium"
            else:
                level = "Advanced"
                gap = "Low"

            # Get skill name
            skill = db.query(Skill).filter_by(id=skill_id).first()
            skill_name = skill.name if skill else f"Skill {skill_id}"

            skill_scores[skill_name] = {
                "score": percentage,
                "percentage": percentage,
                "level": level,
                "gap": gap,
                "correct_answers": skill_correct,
                "total_questions": skill_total
            }

        overall_score = (total_correct / total_questions) * 100 if total_questions > 0 else 0

        db.commit()

        return {
            "assessment_id": request.assessment_id,
            "overall_score": overall_score,
            "skill_scores": skill_scores
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/results/{user_id}")
def get_assessment_results(user_id: int, db: Session = Depends(get_db)):
    """
    Get the latest assessment results for a user
    """
    try:
        # Get the most recent assessment for the user
        assessment = (
            db.query(Assessment)
            .filter_by(user_id=user_id)
            .order_by(Assessment.created_at.desc())
            .first()
        )

        if not assessment:
            raise HTTPException(status_code=404, detail="No assessment found for this user")

        # Get assessment answers
        answers = db.query(AssessmentAnswer).filter_by(assessment_id=assessment.id).all()

        # Calculate skill-wise scores
        skill_scores = {}
        total_correct = 0
        total_questions = len(answers)

        # Group answers by skill
        skill_answers = {}
        for answer in answers:
            question = db.query(SkillQuestion).filter_by(id=answer.question_id).first()
            if question:
                skill_id = question.skill_id
                if skill_id not in skill_answers:
                    skill_answers[skill_id] = []
                skill_answers[skill_id].append(answer)

        for skill_id, skill_answer_list in skill_answers.items():
            skill_correct = sum(1 for a in skill_answer_list if a.is_correct)
            skill_total = len(skill_answer_list)
            percentage = (skill_correct / skill_total) * 100 if skill_total > 0 else 0

            # Determine level and gap
            if percentage <= 40:
                level = "Beginner"
                gap = "High"
            elif percentage <= 70:
                level = "Intermediate"
                gap = "Medium"
            else:
                level = "Advanced"
                gap = "Low"

            # Get skill name
            skill = db.query(Skill).filter_by(id=skill_id).first()
            skill_name = skill.name if skill else f"Skill {skill_id}"

            skill_scores[skill_name] = {
                "score": percentage,
                "percentage": percentage,
                "level": level,
                "gap": gap,
                "correct_answers": skill_correct,
                "total_questions": skill_total
            }

            total_correct += skill_correct

        overall_score = (total_correct / total_questions) * 100 if total_questions > 0 else 0

        # Generate recommendations based on weak skills
        weak_skills = [skill for skill, data in skill_scores.items() if data["gap"] == "High"]
        strong_skills = [skill for skill, data in skill_scores.items() if data["gap"] == "Low"]

        recommendations = []
        learning_path = []

        for skill_name in weak_skills:
            if "Database" in skill_name:
                recommendations.append(f"Learn SQL joins, indexing, and normalization for {skill_name}")
                learning_path.extend([
                    "Complete SQL basics course",
                    "Practice database design with normalization",
                    "Build projects with complex queries"
                ])
            elif "Python" in skill_name:
                recommendations.append(f"Master Python fundamentals and libraries for {skill_name}")
                learning_path.extend([
                    "Learn Python data structures and algorithms",
                    "Study pandas and numpy libraries",
                    "Build data analysis projects"
                ])
            else:
                recommendations.append(f"Focus on core concepts and practical applications for {skill_name}")
                learning_path.append(f"Complete comprehensive {skill_name} training")

        return {
            "overall_score": overall_score,
            "skill_scores": skill_scores,
            "recommendations": recommendations,
            "strong_skills": strong_skills,
            "weak_skills": weak_skills,
            "learning_path": learning_path[:5]  # Limit to 5 steps
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_assessment(
    request: SkillsData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit full skill assessment
    """
    try:
        return SkillsService.submit_assessment(
            db=db,
            user_id=current_user.id,
            assessment_payload=request.dict(),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/quiz")
def get_quiz_questions(
    request: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get quiz questions for selected skills
    """
    try:
        return SkillsService.get_quiz_questions(
            db=db,
            skill_ids=request.skill_ids,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/quiz/submit")
def submit_quiz_answers(
    request: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit quiz answers and get assessment results
    """
    try:
        return SkillsService.submit_quiz_answers(
            db=db,
            user_id=current_user.id,
            quiz_answers=request.dict(),
        )
    except ValueError as e:
       raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/update", status_code=status.HTTP_200_OK)
def update_single_skill(
    request: SingleSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update or create a single skill
    """
    try:
        return SkillsService.update_single_skill(
            db=db,
            user_id=current_user.id,
            skill_id=request.skill_id,
            level=request.level,
            confidence=request.confidence,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/")
def get_all_skills(
    db: Session = Depends(get_db),
):
    """
    Get all available skills
    """
    try:
        skills = db.query(Skill).all()
        return [skill.to_dict() for skill in skills]
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/skill_selection/assessment")
def get_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user's latest skill assessment
    """
    try:
        from models.skill_assessment import SkillAssessment
        assessment = (
            db.query(SkillAssessment)
            .filter_by(user_id=current_user.id)
            .order_by(SkillAssessment.created_at.desc())
            .first()
        )
        if not assessment:
            raise HTTPException(status_code=404, detail="No assessment found")
        return assessment.to_dict()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
