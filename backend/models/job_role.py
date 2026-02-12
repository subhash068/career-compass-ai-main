from .database import Base
from sqlalchemy import Column, Integer, String, Text, Float, Index, text
from sqlalchemy.orm import relationship
import json


class JobRole(Base):
    __tablename__ = "job_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)

    title = Column(
        String(255),
        nullable=False,
        unique=True,
    )

    description = Column(Text, nullable=True)

    level = Column(
        String(50),
        nullable=False,
        server_default=text("'mid'"),
    )

    average_salary = Column(
        Text,
        nullable=True,
    )

    demand_score = Column(
        Float,
        nullable=False,
        server_default=text("0"),
    )

    growth_rate = Column(
        Float,
        nullable=False,
        server_default=text("0"),
    )

    # Relationships
    learning_paths = relationship("LearningPath", back_populates="target_role")
    role_skill_requirements = relationship(
        "RoleSkillRequirement",
        back_populates="job_role",
        cascade="all, delete-orphan",
    )

    @classmethod
    def find_all(cls, db):
        return db.query(cls).all()

    @classmethod
    def find_by_id(cls, db, role_id):
        return db.query(cls).filter(cls.id == role_id).first()

    __table_args__ = (
        Index("idx_job_role_title", "title"),
        Index("idx_job_role_level", "level"),
    )

    # -------------------------
    # JSON helpers
    # -------------------------
    def get_average_salary(self):
        return json.loads(self.average_salary) if self.average_salary else {}

    def set_average_salary(self, salary_dict):
        self.average_salary = json.dumps(salary_dict)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "level": self.level,
            "average_salary": self.get_average_salary(),
            "demand_score": self.demand_score,
            "growth_rate": self.growth_rate,
        }
