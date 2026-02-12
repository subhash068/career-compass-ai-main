from .database import Base
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Index, text
from sqlalchemy.orm import relationship


class RoleSkillRequirement(Base):
    __tablename__ = "role_skill_requirements"

    id = Column(Integer, primary_key=True, autoincrement=True)

    role_id = Column(
        Integer,
        ForeignKey("job_roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    required_level = Column(
        String(50),
        nullable=False,
        server_default=text("'beginner'"),
    )

    importance = Column(
        String(50),
        nullable=False,
        server_default=text("'preferred'"),
    )

    weight = Column(
        Float,
        nullable=False,
        server_default=text("0.5"),
    )

    # Relationships
    job_role = relationship("JobRole", back_populates="role_skill_requirements")
    skill = relationship("Skill", back_populates="role_skill_requirements")

    __table_args__ = (
        Index("idx_role_skill_req_role_id", "role_id"),
        Index("idx_role_skill_req_skill_id", "skill_id"),
        Index(
            "idx_role_skill_req_role_skill",
            "role_id",
            "skill_id",
            unique=True,
        ),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "role_id": self.role_id,
            "skill_id": self.skill_id,
            "required_level": self.required_level,
            "importance": self.importance,
            "weight": self.weight,
        }
