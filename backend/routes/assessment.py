from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional


from models.database import get_db
from models.user import User
from routes.auth_fastapi import get_current_user
from schemas.assessment import (
    InitializeAssessmentRequest,
    StartSkillQuizRequest,
    SubmitQuizRequest,
    SelectedSkillsResponse,
    StartQuizResponse,
    SubmitQuizResponse,
    AssessmentResultResponse,
    ErrorResponse
)
from services.assessment_service import AssessmentService

router = APIRouter(prefix="/api/assessment", tags=["Assessment"])


@router.post("/initialize", response_model=SelectedSkillsResponse)
async def initialize_assessment(
    request: InitializeAssessmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initialize assessment by selecting domain and skills
    """
    try:
        return AssessmentService.initialize_assessment(db, current_user.id, request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize assessment: {str(e)}"
        )


@router.get("/selected-skills", response_model=SelectedSkillsResponse)
async def get_selected_skills(
    assessment_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get selected skills for current assessment
    """
    try:
        return AssessmentService.get_selected_skills(db, current_user.id, assessment_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get selected skills: {str(e)}"
        )


@router.get("/start/{skill_id}", response_model=StartQuizResponse)
async def start_skill_quiz(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start quiz for a specific skill
    """
    try:
        request = StartSkillQuizRequest(skill_id=skill_id)
        return AssessmentService.start_skill_quiz(db, current_user.id, request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start quiz: {str(e)}"
        )


@router.post("/submit", response_model=SubmitQuizResponse)
async def submit_quiz(
    request: SubmitQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit quiz answers and get results
    """
    try:
        return AssessmentService.submit_quiz(db, current_user.id, request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit quiz: {str(e)}"
        )


@router.get("/result/{skill_id}", response_model=AssessmentResultResponse)
async def get_assessment_result(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get assessment result for a specific skill
    """
    try:
        return AssessmentService.get_assessment_result(db, current_user.id, skill_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get assessment result: {str(e)}"
        )


@router.delete("/delete/{skill_id}")
async def delete_assessment(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a skill assessment for the current user
    """
    try:
        from models.skill_assessment import SkillAssessmentSkill, SkillAssessment
        from models.user_skill import UserSkill
        
        # Delete from SkillAssessmentSkill (assessment records)
        assessment_skills = db.query(SkillAssessmentSkill).join(
            SkillAssessment
        ).filter(
            SkillAssessment.user_id == current_user.id,
            SkillAssessmentSkill.skill_id == skill_id
        ).all()
        
        for asm in assessment_skills:
            db.delete(asm)
        
        # Delete from UserSkill (user skill records)
        user_skills = db.query(UserSkill).filter(
            UserSkill.user_id == current_user.id,
            UserSkill.skill_id == skill_id
        ).all()
        
        for us in user_skills:
            db.delete(us)
        
        db.commit()
        
        return {
            "message": f"Assessment for skill {skill_id} deleted successfully",
            "skill_id": skill_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete assessment: {str(e)}"
        )



@router.get("/completed")
async def get_completed_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all completed assessments for the current user
    """
    try:
        from models.skill import Skill
        from models.skill_assessment import SkillAssessmentSkill, SkillAssessment
        from sqlalchemy import desc, func
        
        # DEBUG: Log what we're fetching
        print(f"DEBUG: Fetching completed assessments for user {current_user.id}")
        
        # Get latest assessment skill for each skill from skill_assessment_skills
        # This table has the correct scores (user_skills has corrupted data)
        subquery = db.query(
            SkillAssessmentSkill.skill_id,
            func.max(SkillAssessmentSkill.created_at).label('max_created_at')
        ).join(SkillAssessment).filter(
            SkillAssessment.user_id == current_user.id
        ).group_by(SkillAssessmentSkill.skill_id).subquery()
        
        latest_assessments = db.query(SkillAssessmentSkill).join(
            subquery,
            and_(
                SkillAssessmentSkill.skill_id == subquery.c.skill_id,
                SkillAssessmentSkill.created_at == subquery.c.max_created_at
            )
        ).join(SkillAssessment).filter(
            SkillAssessment.user_id == current_user.id
        ).all()
        
        print(f"DEBUG: Found {len(latest_assessments)} latest assessment records")
        for asm in latest_assessments:
            print(f"DEBUG: AssessmentSkill - Skill {asm.skill_id}: score={asm.score}, confidence={asm.confidence}")
        
        # Get skill names and format response
        result = []
        for asm in latest_assessments:
            skill = db.query(Skill).filter(Skill.id == asm.skill_id).first()
            result.append({
                "skill_id": asm.skill_id,
                "skill_name": skill.name if skill else "Unknown Skill",
                "score": asm.score,
                "level": asm.level.title() if asm.level else "Beginner",
                "confidence": asm.confidence,
                "completed_at": asm.created_at.isoformat() if asm.created_at else None
            })
        
        print(f"DEBUG: Returning {len(result)} assessments")
        for r in result:
            print(f"DEBUG: Response - {r['skill_name']}: score={r['score']}")
        
        return {"assessments": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get completed assessments: {str(e)}"
        )
