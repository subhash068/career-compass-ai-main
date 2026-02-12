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
