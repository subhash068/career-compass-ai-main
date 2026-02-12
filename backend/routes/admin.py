from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from models.database import get_db
from models.user import User
from models.skill_assessment import SkillAssessment
from models.learning_path import LearningPath
from services.admin_service import AdminService
from routes.auth_fastapi import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)):
    """
    Dependency to require admin role
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/users")
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all users (admin only)
    """
    try:
        return AdminService.get_users(
            db=db,
            skip=skip,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}")
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get detailed information about a specific user (admin only)
    """
    try:
        return AdminService.get_user_details(
            db=db,
            user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users")
def create_user(
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new user (admin only)
    """
    try:
        from services.auth_service import AuthService
        from schemas.assessment import UserCreate
        
        # Check if email already exists
        existing = db.query(User).filter(User.email == user_data.get("email")).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user using auth service
        user_create = UserCreate(
            email=user_data.get("email"),
            name=user_data.get("name"),
            password=user_data.get("password"),
            role=user_data.get("role", "user")
        )
        
        new_user = AuthService.create_user(db, user_create)
        
        # Update additional fields if provided
        if user_data.get("currentRole"):
            new_user.currentRole = user_data.get("currentRole")
            db.commit()
        
        return {
            "message": "User created successfully",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "name": new_user.name,
                "role": new_user.role,
                "currentRole": new_user.currentRole
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update user details (admin only)
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update fields
        if "name" in user_data:
            user.name = user_data["name"]
        
        if "role" in user_data:
            user.role = user_data["role"]
        
        if "currentRole" in user_data:
            user.currentRole = user_data["currentRole"]
        
        # Update password if provided
        if "password" in user_data and user_data["password"]:
            from services.auth_service import AuthService
            user.hashed_password = AuthService.get_password_hash(user_data["password"])
        
        db.commit()
        db.refresh(user)
        
        return {
            "message": "User updated successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "currentRole": user.currentRole
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a user (admin only)
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent deleting yourself
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        db.delete(user)
        db.commit()
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update user role (admin only)
    """
    try:
        return AdminService.update_user_role(
            db=db,
            user_id=user_id,
            new_role=new_role,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessments")
def get_all_assessments(

    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all skill assessments (admin only)
    """
    try:
        return AdminService.get_assessments(
            db=db,
            skip=skip,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get system statistics (admin only)
    """
    try:
        return AdminService.get_stats(
            db=db,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
def get_health():
    """
    Get system health status (public endpoint for monitoring)
    """
    import time
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "1.0.0"
    }


@router.get("/metrics")
def get_metrics():
    """
    Get system metrics (public endpoint for monitoring)
    """
    import psutil
    import time
    
    return {
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage_percent": psutil.disk_usage('/').percent,
            "uptime_seconds": int(time.time() - psutil.boot_time())
        },
        "timestamp": int(time.time())
    }


@router.get("/overview-metrics")
def get_overview_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get platform overview metrics (admin only)
    """
    try:
        from models.user import User
        from models.skill_assessment import SkillAssessment
        from models.chat_session import ChatSession
        
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.role == "user").count()
        total_assessments = db.query(SkillAssessment).count()
        total_chatbot_queries = db.query(ChatSession).count()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_assessments": total_assessments,
            "total_career_recommendations": 0,  # Placeholder
            "total_chatbot_queries": total_chatbot_queries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
