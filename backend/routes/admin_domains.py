"""
Admin Domain & Skills Management Routes
Handles CRUD operations for domains and skills
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from models.database import get_db
from models.user import User
from models.domain import Domain
from models.skill import Skill
from routes.auth_fastapi import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Domain & Skills Management"])


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ==================== DOMAIN MANAGEMENT ====================

@router.get("/domains")
def get_all_domains(
    include_skills: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all domains with optional skills inclusion
    """
    try:
        domains = db.query(Domain).all()
        
        result = []
        for domain in domains:
            domain_data = domain.to_dict()
            
            if include_skills:
                skills = db.query(Skill).filter(Skill.domain_id == domain.id).all()
                domain_data["skills"] = [
                    {
                        "id": skill.id,
                        "name": skill.name,
                        "description": skill.description,
                        "demand_level": skill.demand_level,
                    }
                    for skill in skills
                ]
            
            result.append(domain_data)
        
        return {"domains": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/domains/{domain_id}")
def get_domain_by_id(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get a specific domain with its skills
    """
    try:
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        skills = db.query(Skill).filter(Skill.domain_id == domain_id).all()
        
        return {
            "domain": domain.to_dict(),
            "skills": [
                {
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                    "demand_level": skill.demand_level,
                }
                for skill in skills
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domains")
def create_domain(
    domain_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new domain
    """
    try:
        # Validate required fields
        if not domain_data.get("name"):
            raise HTTPException(status_code=400, detail="Domain name is required")
        
        # Check if domain already exists
        existing = db.query(Domain).filter(Domain.name == domain_data["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Domain with this name already exists")
        
        # Create new domain
        new_domain = Domain(name=domain_data["name"])
        db.add(new_domain)
        db.commit()
        db.refresh(new_domain)
        
        return {
            "message": "Domain created successfully",
            "domain": new_domain.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/domains/{domain_id}")
def update_domain(
    domain_id: int,
    domain_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update an existing domain
    """
    try:
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        # Check if new name already exists (if changing name)
        if "name" in domain_data and domain_data["name"] != domain.name:
            existing = db.query(Domain).filter(Domain.name == domain_data["name"]).first()
            if existing:
                raise HTTPException(status_code=400, detail="Domain with this name already exists")
            domain.name = domain_data["name"]
        
        db.commit()
        db.refresh(domain)
        
        return {
            "message": "Domain updated successfully",
            "domain": domain.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/domains/{domain_id}")
def delete_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a domain and all its associated skills
    """
    try:
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        # Get count of skills that will be deleted
        skills_count = db.query(Skill).filter(Skill.domain_id == domain_id).count()
        
        # Delete domain (cascade will delete associated skills)
        db.delete(domain)
        db.commit()
        
        return {
            "message": f"Domain deleted successfully. {skills_count} associated skills were also removed.",
            "deleted_domain_id": domain_id,
            "deleted_skills_count": skills_count
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SKILL MANAGEMENT ====================

@router.get("/skills")
def get_all_skills(
    domain_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all skills, optionally filtered by domain
    """
    try:
        query = db.query(Skill)
        
        if domain_id:
            query = query.filter(Skill.domain_id == domain_id)
        
        skills = query.all()
        
        return {
            "skills": [
                {
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                    "domain_id": skill.domain_id,
                    "domain_name": skill.domain.name if skill.domain else None,
                    "demand_level": skill.demand_level,
                }
                for skill in skills
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/skills/{skill_id}")
def get_skill_by_id(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get a specific skill by ID
    """
    try:
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        return {
            "skill": {
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "domain_id": skill.domain_id,
                "domain_name": skill.domain.name if skill.domain else None,
                "demand_level": skill.demand_level,
                "depends_on": skill.get_depends_on(),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills")
def create_skill(
    skill_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new skill under a domain
    """
    try:
        # Validate required fields
        if not skill_data.get("name"):
            raise HTTPException(status_code=400, detail="Skill name is required")
        
        if not skill_data.get("domain_id"):
            raise HTTPException(status_code=400, detail="Domain ID is required")
        
        # Validate domain exists
        domain = db.query(Domain).filter(Domain.id == skill_data["domain_id"]).first()
        if not domain:
            raise HTTPException(status_code=400, detail="Domain not found")
        
        # Check if skill already exists with same name in this domain
        existing = db.query(Skill).filter(
            Skill.name == skill_data["name"],
            Skill.domain_id == skill_data["domain_id"]
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Skill with this name already exists in this domain"
            )
        
        # Create new skill
        new_skill = Skill(
            name=skill_data["name"],
            description=skill_data.get("description"),
            domain_id=skill_data["domain_id"],
            demand_level=skill_data.get("demand_level", 0),
        )
        
        # Set dependencies if provided
        if "depends_on" in skill_data:
            new_skill.set_depends_on(skill_data["depends_on"])
        
        db.add(new_skill)
        db.commit()
        db.refresh(new_skill)
        
        return {
            "message": "Skill created successfully",
            "skill": {
                "id": new_skill.id,
                "name": new_skill.name,
                "description": new_skill.description,
                "domain_id": new_skill.domain_id,
                "domain_name": domain.name,
                "demand_level": new_skill.demand_level,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/skills/{skill_id}")
def update_skill(
    skill_id: int,
    skill_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update an existing skill
    """
    try:
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        # Update name if provided
        if "name" in skill_data:
            # Check if new name conflicts with existing skill in same domain
            existing = db.query(Skill).filter(
                Skill.name == skill_data["name"],
                Skill.domain_id == skill.domain_id,
                Skill.id != skill_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=400, 
                    detail="Another skill with this name already exists in this domain"
                )
            skill.name = skill_data["name"]
        
        # Update description if provided
        if "description" in skill_data:
            skill.description = skill_data["description"]
        
        # Update demand level if provided
        if "demand_level" in skill_data:
            skill.demand_level = skill_data["demand_level"]
        
        # Update domain if provided
        if "domain_id" in skill_data and skill_data["domain_id"] != skill.domain_id:
            domain = db.query(Domain).filter(Domain.id == skill_data["domain_id"]).first()
            if not domain:
                raise HTTPException(status_code=400, detail="Domain not found")
            
            # Check for name conflict in new domain
            existing = db.query(Skill).filter(
                Skill.name == skill.name,
                Skill.domain_id == skill_data["domain_id"],
                Skill.id != skill_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=400, 
                    detail="A skill with this name already exists in the target domain"
                )
            
            skill.domain_id = skill_data["domain_id"]
        
        # Update dependencies if provided
        if "depends_on" in skill_data:
            skill.set_depends_on(skill_data["depends_on"])
        
        db.commit()
        db.refresh(skill)
        
        return {
            "message": "Skill updated successfully",
            "skill": {
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "domain_id": skill.domain_id,
                "domain_name": skill.domain.name if skill.domain else None,
                "demand_level": skill.demand_level,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/skills/{skill_id}")
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a skill
    """
    try:
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        skill_name = skill.name
        db.delete(skill)
        db.commit()
        
        return {
            "message": f"Skill '{skill_name}' deleted successfully",
            "deleted_skill_id": skill_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
