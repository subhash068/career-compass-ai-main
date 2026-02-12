from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.user import User
from models.skill import Skill
from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement



class AdminService:
    """
    Admin-only operations for managing
    skills, roles, and role-skill mappings.
    """

    # --------------------------------------------------
    # AUTHORIZATION
    # --------------------------------------------------
    @staticmethod
    def _require_admin(db: Session, user_id: int) -> None:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.role != "admin":
            raise PermissionError("Admin permissions required")

    # --------------------------------------------------
    # SKILLS
    # --------------------------------------------------
    @staticmethod
    def create_skill(
        db: Session,
        admin_user_id: int,
        name: str,
        description: Optional[str] = None,
        category_id: Optional[str] = None,
        depends_on: Optional[List[int]] = None,
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        if not name or not name.strip():
            raise ValueError("Skill name is required")

        if db.query(Skill).filter(Skill.name == name.strip()).first():
            raise ValueError("Skill with this name already exists")

        skill = Skill(
            name=name.strip(),
            description=description.strip() if description else None,
            category_id=category_id,
        )

        if depends_on is not None:
            skill.set_depends_on(depends_on)

        db.add(skill)
        db.commit()
        db.refresh(skill)

        return {"skill": skill.to_dict()}

    @staticmethod
    def update_skill(
        db: Session,
        admin_user_id: int,
        skill_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        category_id: Optional[str] = None,
        depends_on: Optional[List[int]] = None,
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            raise ValueError("Skill not found")

        if name is not None:
            name = name.strip()
            if not name:
                raise ValueError("Skill name cannot be empty")
            if db.query(Skill).filter(Skill.name == name, Skill.id != skill_id).first():
                raise ValueError("Skill name already exists")
            skill.name = name

        if description is not None:
            skill.description = description.strip() if description else None

        if category_id is not None:
            skill.category_id = category_id

        if depends_on is not None:
            skill.set_depends_on(depends_on)

        db.commit()
        db.refresh(skill)

        return {"skill": skill.to_dict()}

    @staticmethod
    def delete_skill(
        db: Session,
        admin_user_id: int,
        skill_id: int
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            raise ValueError("Skill not found")

        if db.query(RoleSkillRequirement).filter(
            RoleSkillRequirement.skill_id == skill_id
        ).first():
            raise ValueError("Skill is used in job roles")

        db.delete(skill)
        db.commit()

        return {"message": "Skill deleted successfully"}

    # --------------------------------------------------
    # JOB ROLES
    # --------------------------------------------------
    @staticmethod
    def create_job_role(
        db: Session,
        admin_user_id: int,
        title: str,
        description: Optional[str] = None,
        salary_range: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        title = title.strip()
        if not title:
            raise ValueError("Role title required")

        if db.query(JobRole).filter(JobRole.title == title).first():
            raise ValueError("Role already exists")

        role = JobRole(
            title=title,
            description=description.strip() if description else None,
        )

        if salary_range:
            role.set_average_salary(salary_range)

        db.add(role)
        db.commit()
        db.refresh(role)

        return {"role": role.to_dict()}
    
    @staticmethod
    def update_job_role(
        db: Session,
        admin_user_id: int,
        role_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        level: Optional[str] = None,
        salary_range: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        role = db.query(JobRole).filter(JobRole.id == role_id).first()
        if not role:
            raise ValueError("Job role not found")

        if title is not None:
            title = title.strip()
            if not title:
                raise ValueError("Role title cannot be empty")
            if db.query(JobRole).filter(
                JobRole.title == title,
                JobRole.id != role_id
            ).first():
                raise ValueError("Role title already exists")
            role.title = title

        if description is not None:
            role.description = description.strip() if description else None

        if level is not None:
            valid_levels = {"junior", "mid", "senior"}
            if level not in valid_levels:
                raise ValueError("Invalid role level")
            role.level = level

        if salary_range is not None:
            role.set_average_salary(salary_range)

        db.commit()
        db.refresh(role)

        return {"role": role.to_dict()}

    @staticmethod
    def delete_job_role(
        db: Session,
        admin_user_id: int,
        role_id: int
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        role = db.query(JobRole).filter(JobRole.id == role_id).first()
        if not role:
            raise ValueError("Role not found")

        if db.query(RoleSkillRequirement).filter(
            RoleSkillRequirement.role_id == role_id
        ).first():
            raise ValueError("Role has skill requirements")

        db.delete(role)
        db.commit()

        return {"message": "Job role deleted"}

    # --------------------------------------------------
    # ROLE–SKILL REQUIREMENTS
    # --------------------------------------------------
    @staticmethod
    def add_skill_requirement(
        db: Session,
        admin_user_id: int,
        role_id: int,
        skill_id: int,
        required_level: str,
        weight: float,
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        if not (0.0 <= weight <= 1.0):
            raise ValueError("Weight must be between 0.0 and 1.0")

        valid_levels = {"beginner", "intermediate", "advanced", "expert"}
        if required_level not in valid_levels:
            raise ValueError("Invalid required level")

        if db.query(RoleSkillRequirement).filter_by(
            role_id=role_id,
            skill_id=skill_id
        ).first():
            raise ValueError("Requirement already exists")

        req = RoleSkillRequirement(
            role_id=role_id,
            skill_id=skill_id,
            required_level=required_level,
            weight=weight,
        )

        db.add(req)
        db.commit()
        db.refresh(req)

        return {"requirement": req.to_dict()}

    @staticmethod
    def update_skill_weight(
        db: Session,
        admin_user_id: int,
        role_id: int,
        skill_id: int,
        weight: float,
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        if not (0.0 <= weight <= 1.0):
            raise ValueError("Weight must be between 0.0 and 1.0")

        req = db.query(RoleSkillRequirement).filter_by(
            role_id=role_id,
            skill_id=skill_id
        ).first()

        if not req:
            raise ValueError("Requirement not found")

        req.weight = weight
        db.commit()
        db.refresh(req)

        return {"requirement": req.to_dict()}

    @staticmethod
    def remove_skill_requirement(
        db: Session,
        admin_user_id: int,
        role_id: int,
        skill_id: int
    ) -> Dict[str, Any]:

        AdminService._require_admin(db, admin_user_id)

        req = db.query(RoleSkillRequirement).filter_by(
            role_id=role_id,
            skill_id=skill_id
        ).first()

        if not req:
            raise ValueError("Requirement not found")

        db.delete(req)
        db.commit()

        return {"message": "Requirement removed"}

    # --------------------------------------------------
    # USER MANAGEMENT
    # --------------------------------------------------
    @staticmethod
    def get_users(
        db: Session,
        skip: int = 0,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """
        Get all users with pagination
        """
        users = db.query(User).offset(skip).limit(limit).all()
        total = db.query(User).count()
        
        return {
            "users": [
                {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "currentRole": getattr(user, 'currentRole', None),
                    "created_at": getattr(user, 'created_at', None),
                    "updated_at": getattr(user, 'updated_at', None),
                }
                for user in users
            ],
            "total": total,
            "page": (skip // limit) + 1,
            "limit": limit
        }

    @staticmethod
    def get_user_details(
        db: Session,
        user_id: int,
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific user
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get user's skills
        from models.user_skill import UserSkill
        user_skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
        
        # Get user's assessments
        from models.skill_assessment import SkillAssessment
        assessments = db.query(SkillAssessment).filter(SkillAssessment.user_id == user_id).all()

        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "currentRole": getattr(user, 'currentRole', None),
            "created_at": getattr(user, 'created_at', None),
            "updated_at": getattr(user, 'updated_at', None),
            "skills": [
                {
                    "name": skill.skill.name if hasattr(skill, 'skill') else f"Skill {skill.skill_id}",
                    "level": skill.inferred_level,
                    "confidence": skill.confidence
                }
                for skill in user_skills
            ],
            "assessments": [
                {
                    "id": assessment.id,
                    "status": assessment.status,
                    "completed_at": assessment.completed_at,
                    "skills": []  # Would need to fetch assessment skills
                }
                for assessment in assessments
            ],
            "careerRecommendations": [],  # Placeholder
            "learningPath": None  # Placeholder
        }

    @staticmethod
    def update_user_role(
        db: Session,
        user_id: int,
        new_role: str,
    ) -> Dict[str, Any]:
        """
        Update a user's role
        """
        if new_role not in ["user", "admin"]:
            raise ValueError("Invalid role. Must be 'user' or 'admin'")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        user.role = new_role
        db.commit()
        db.refresh(user)

        return {
            "message": "User role updated successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role
            }
        }

    # --------------------------------------------------
    # ASSESSMENTS
    # --------------------------------------------------
    @staticmethod
    def get_assessments(
        db: Session,
        skip: int = 0,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """
        Get all skill assessments with pagination
        """
        from models.skill_assessment import SkillAssessment
        
        assessments = db.query(SkillAssessment).offset(skip).limit(limit).all()
        total = db.query(SkillAssessment).count()

        return {
            "assessments": [
                {
                    "id": assessment.id,
                    "user_id": assessment.user_id,
                    "user_name": assessment.user.name if hasattr(assessment, 'user') and assessment.user else "Unknown",
                    "user_email": assessment.user.email if hasattr(assessment, 'user') and assessment.user else "Unknown",
                    "skill_name": assessment.skill.name if hasattr(assessment, 'skill') and assessment.skill else "Unknown",
                    "score": getattr(assessment, 'score', 0),
                    "status": assessment.status,
                    "completed_at": assessment.completed_at,
                }
                for assessment in assessments
            ],
            "total": total,
            "page": (skip // limit) + 1,
            "limit": limit
        }

    # --------------------------------------------------
    # SYSTEM STATS
    # --------------------------------------------------
    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        """
        Get system statistics
        """
        total_users = db.query(User).count()
        total_skills = db.query(Skill).count()
        total_roles = db.query(JobRole).count()
        
        from models.skill_assessment import SkillAssessment
        total_assessments = db.query(SkillAssessment).count()
        completed_assessments = db.query(SkillAssessment).filter(
            SkillAssessment.status == "completed"
        ).count()

        return {
            "total_users": total_users,
            "total_skills": total_skills,
            "total_roles": total_roles,
            "total_assessments": total_assessments,
            "completed_assessments": completed_assessments,
            "system_health": "healthy"
        }
