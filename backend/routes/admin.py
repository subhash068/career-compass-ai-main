from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from models.database import get_db
from models.user import User
from models.skill_assessment import SkillAssessment
from models.learning_path import LearningPath
from models.learning_path_step import LearningPathStep

from models.learning_resource import LearningResource
from models.skill import Skill
from services.admin_service import AdminService
from services.learning_service import LearningService
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


# --------------------------------------------------
# ADMIN LEARNING PATH MANAGEMENT
# --------------------------------------------------

@router.get("/learning-paths")
def get_all_learning_paths(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all learning paths (admin only)
    """
    try:
        paths = db.query(LearningPath).offset(skip).limit(limit).all()
        return {
            "paths": [p.to_dict() for p in paths],
            "count": len(paths)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/learning-paths/{path_id}")
def get_learning_path_details(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get detailed information about a specific learning path (admin only)
    """
    try:
        path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
        if not path:
            raise HTTPException(status_code=404, detail="Learning path not found")
        return path.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/learning-paths/{path_id}")
def delete_learning_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a learning path (admin only)
    """
    try:
        path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
        if not path:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        db.delete(path)
        db.commit()
        
        return {"message": "Learning path deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/learning-paths/{path_id}/steps")
def get_learning_path_steps(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all steps for a learning path (admin only)
    """
    try:
        path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
        if not path:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        # Get steps through the association table
        from models.learning_path import LearningPathStepAssociation
        associations = db.query(LearningPathStepAssociation).filter(
            LearningPathStepAssociation.learning_path_id == path_id
        ).all()
        
        # Get step details for each association
        steps = []
        for assoc in associations:
            step = db.query(LearningPathStep).filter(LearningPathStep.id == assoc.step_id).first()
            if step:
                step_dict = step.to_dict()
                step_dict["order"] = assoc.order
                step_dict["is_completed"] = assoc.is_completed
                step_dict["isCompleted"] = assoc.is_completed
                step_dict["assessment_passed"] = assoc.assessment_passed
                step_dict["assessmentPassed"] = assoc.assessment_passed
                steps.append(step_dict)
        
        return {
            "steps": steps,
            "count": len(steps)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.put("/learning-paths/{path_id}/steps/{step_id}")
def update_learning_step(
    path_id: int,
    step_id: int,
    step_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update a learning path step (admin only)
    """
    try:
        step = db.query(LearningPathStep).filter(LearningPathStep.id == step_id).first()
        if not step:
            raise HTTPException(status_code=404, detail="Learning step not found")
        
        # Update fields
        if "target_level" in step_data:
            step.target_level = step_data["target_level"]
        
        if "estimated_duration" in step_data:
            step.estimated_duration = step_data["estimated_duration"]
        
        if "is_completed" in step_data:
            step.is_completed = step_data["is_completed"]
        
        if "resources" in step_data:
            step.set_resources(step_data["resources"])
        
        if "assessment_questions" in step_data:
            step.set_assessment_questions(step_data["assessment_questions"])
        
        db.commit()
        db.refresh(step)
        
        # Recalculate total duration
        LearningService.recalculate_path_duration(db, path_id)
        
        return {
            "message": "Learning step updated successfully",
            "step": step.to_dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/learning-paths/{path_id}/steps/{step_id}")
def delete_learning_step(
    path_id: int,
    step_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a learning path step (admin only)
    """
    try:
        # Check if learning path exists
        path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
        if not path:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        # Find the step
        step = db.query(LearningPathStep).filter(LearningPathStep.id == step_id).first()
        if not step:
            raise HTTPException(status_code=404, detail="Learning step not found")
        
        # Remove association first
        from models.learning_path import LearningPathStepAssociation
        association = db.query(LearningPathStepAssociation).filter(
            LearningPathStepAssociation.learning_path_id == path_id,
            LearningPathStepAssociation.step_id == step_id
        ).first()
        
        if association:
            db.delete(association)
            db.commit()
        
        # Delete the step
        db.delete(step)
        db.commit()
        
        # Recalculate total duration
        LearningService.recalculate_path_duration(db, path_id)
        
        return {"message": "Learning step deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/learning-paths/{path_id}/steps")
def create_learning_step(
    path_id: int,
    step_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new learning path step (admin only)
    """
    try:
        import traceback
        print(f"[DEBUG] Creating step for path {path_id}")
        print(f"[DEBUG] Step data: {step_data}")
        
        # Check if learning path exists
        path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
        if not path:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        # Validate required fields
        if not step_data.get("skill_name"):
            raise HTTPException(status_code=400, detail="skill_name is required")
        
        # Find or create skill by name
        skill = db.query(Skill).filter(Skill.name == step_data.get("skill_name")).first()
        if not skill:
            # Find or create a default domain for new skills
            from models.domain import Domain
            default_domain = db.query(Domain).first()
            if not default_domain:
                # Create a default domain if none exists
                default_domain = Domain(
                    name="General",
                    description="General skills domain"
                )
                db.add(default_domain)
                db.commit()
                db.refresh(default_domain)
                print(f"[DEBUG] Created default domain with ID: {default_domain.id}")
            
            # Create new skill if it doesn't exist
            skill = Skill(
                name=step_data.get("skill_name"),
                description=f"Skill for {step_data.get('skill_name')}",
                domain_id=default_domain.id,
                depends_on='[]'
            )

            db.add(skill)
            db.commit()
            db.refresh(skill)
            print(f"[DEBUG] Created new skill with ID: {skill.id}, domain_id: {skill.domain_id}")

        
        # Get the next order number
        from models.learning_path import LearningPathStepAssociation
        max_order = db.query(LearningPathStepAssociation).filter(
            LearningPathStepAssociation.learning_path_id == path_id
        ).count()
        print(f"[DEBUG] Max order for path {path_id}: {max_order}")
        
        # Create new step
        new_step = LearningPathStep(
            skill_id=skill.id,
            target_level=step_data.get("target_level", "beginner"),
            order=max_order + 1,
            estimated_duration=step_data.get("estimated_duration", ""),
            is_completed=step_data.get("is_completed", False),
        )
        
        # Set resources if provided
        if "resources" in step_data:
            new_step.set_resources(step_data["resources"])
            print(f"[DEBUG] Set resources: {step_data['resources']}")
        else:
            new_step.set_resources([])
        
        # Set dependencies if provided
        if "dependencies" in step_data:
            new_step.set_dependencies(step_data["dependencies"])
        else:
            new_step.set_dependencies([])
        
        # Set assessment questions if provided
        if "assessment_questions" in step_data:
            new_step.set_assessment_questions(step_data["assessment_questions"])
            print(f"[DEBUG] Set assessment_questions: {step_data['assessment_questions']}")
        else:
            new_step.set_assessment_questions([])
        
        db.add(new_step)
        db.commit()
        db.refresh(new_step)
        print(f"[DEBUG] Created new step with ID: {new_step.id}")
        
        # Associate step with learning path
        association = LearningPathStepAssociation(
            learning_path_id=path_id,
            step_id=new_step.id,
            order=max_order + 1
        )
        db.add(association)
        db.commit()
        print(f"[DEBUG] Created association for step {new_step.id} in path {path_id}")
        
        # Recalculate total duration
        LearningService.recalculate_path_duration(db, path_id)
        
        return {
            "message": "Learning step created successfully",
            "step": new_step.to_dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error creating learning step: {str(e)}"
        print(f"[ERROR] {error_msg}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)




# --------------------------------------------------
# ADMIN LEARNING RESOURCES MANAGEMENT
# --------------------------------------------------

@router.get("/learning-resources")
def get_all_learning_resources(
    skip: int = 0,
    limit: int = 100,
    skill_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all learning resources (admin only)
    """
    try:
        query = db.query(LearningResource)
        
        if skill_id:
            query = query.filter(LearningResource.skill_id == skill_id)
        
        resources = query.offset(skip).limit(limit).all()
        
        return {
            "resources": [r.to_dict() for r in resources],
            "count": len(resources)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/learning-resources")
def create_learning_resource(
    resource_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new learning resource (admin only)
    """
    try:
        # Validate required fields
        if not resource_data.get("title") or not resource_data.get("skill_id"):
            raise HTTPException(status_code=400, detail="Title and skill_id are required")
        
        # Check if skill exists
        skill = db.query(Skill).filter(Skill.id == resource_data.get("skill_id")).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        resource = LearningResource(
            title=resource_data.get("title"),
            description=resource_data.get("description", ""),
            type=resource_data.get("type", "article"),
            url=resource_data.get("url", ""),
            skill_id=resource_data.get("skill_id"),
            difficulty=resource_data.get("difficulty", "beginner"),
            duration=resource_data.get("duration", ""),
            provider=resource_data.get("provider", ""),
            cost=resource_data.get("cost", "free"),
            rating=resource_data.get("rating", 0),
        )
        
        db.add(resource)
        db.commit()
        db.refresh(resource)
        
        return {
            "message": "Learning resource created successfully",
            "resource": resource.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/learning-resources/{resource_id}")
def update_learning_resource(
    resource_id: int,
    resource_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update a learning resource (admin only)
    """
    try:
        resource = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
        if not resource:
            raise HTTPException(status_code=404, detail="Learning resource not found")
        
        # Update fields
        if "title" in resource_data:
            resource.title = resource_data["title"]
        
        if "description" in resource_data:
            resource.description = resource_data["description"]
        
        if "type" in resource_data:
            resource.type = resource_data["type"]
        
        if "url" in resource_data:
            resource.url = resource_data["url"]
        
        if "difficulty" in resource_data:
            resource.difficulty = resource_data["difficulty"]
        
        if "duration" in resource_data:
            resource.duration = resource_data["duration"]
        
        if "provider" in resource_data:
            resource.provider = resource_data["provider"]
        
        if "cost" in resource_data:
            resource.cost = resource_data["cost"]
        
        if "rating" in resource_data:
            resource.rating = resource_data["rating"]
        
        db.commit()
        db.refresh(resource)
        
        return {
            "message": "Learning resource updated successfully",
            "resource": resource.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/learning-resources/{resource_id}")
def delete_learning_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a learning resource (admin only)
    """
    try:
        resource = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
        if not resource:
            raise HTTPException(status_code=404, detail="Learning resource not found")
        
        db.delete(resource)
        db.commit()
        
        return {"message": "Learning resource deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
