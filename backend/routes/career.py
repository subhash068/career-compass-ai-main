from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db
from models.user import User
from models.job_role import JobRole
from services.career_service import CareerService
from routes.auth_fastapi import get_current_user

router = APIRouter(prefix="/career", tags=["Career"])


@router.get("/roles")
def get_all_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all available job roles
    """
    try:
        roles = db.query(JobRole).all()
        return [role.to_dict() for role in roles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches")
def get_career_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get career matches for current user
    """
    try:
        return CareerService.get_matches(
            db=db,
            user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/details/{job_role_id}")
def get_career_details(
    job_role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information about a specific career
    """
    try:
        return CareerService.get_details(
            db=db,
            user_id=current_user.id,
            job_role_id=job_role_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
def compare_careers(
    role_ids: list[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Compare multiple career options side by side
    """
    try:
        return CareerService.compare_careers(
            db=db,
            user_id=current_user.id,
            role_ids=role_ids,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trending")
def get_trending_careers(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get trending careers based on market growth and demand
    """
    try:
        return CareerService.get_trending_careers(
            db=db,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
