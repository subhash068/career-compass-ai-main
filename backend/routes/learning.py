from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models.database import get_db
from models.user import User
from services.learning_service import LearningService
from routes.auth_fastapi import get_current_user

router = APIRouter(prefix="/learning", tags=["Learning"])


class GeneratePathRequest(BaseModel):
    roleId: int


@router.get("/paths")
def get_learning_paths(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get learning paths for current user
    """
    try:
        return LearningService.get_paths(
            db=db,
            user_id=current_user.id,
        )
    except ValueError:
        # No learning paths found - return empty list
        return {"paths": [], "count": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/paths")
def generate_learning_path(
    request: GeneratePathRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a new learning path for a target role
    """
    try:
        return LearningService.generate_learning_path(
            db=db,
            user_id=current_user.id,
            target_role_id=request.roleId,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/path/{path_id}")
def get_learning_path_details(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information about a specific learning path
    """
    try:
        return LearningService.get_path_details(
            db=db,
            user_id=current_user.id,
            path_id=path_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/path/{path_id}/step/{step_id}/complete")
def complete_learning_step(
    path_id: int,
    step_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a learning step as completed
    """
    try:
        return LearningService.complete_step(
            db=db,
            user_id=current_user.id,
            path_id=path_id,
            step_id=step_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
