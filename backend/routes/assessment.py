from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
