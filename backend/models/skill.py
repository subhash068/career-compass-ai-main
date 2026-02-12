from .database import Base
from sqlalchemy import Column, Integer, String, Text, text, ForeignKey
from sqlalchemy.orm import relationship
import json

# Import Domain for relationship
from .domain import Domain


class Skill(Base):
    __tablename__ = 'skills'

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(
        String(255),
        nullable=False,
        unique=True
    )

    description = Column(Text, nullable=True)

    domain_id = Column(Integer, ForeignKey('domains.id'), nullable=False)

    demand_level = Column(
        Integer,
        nullable=False,
        server_default=text("0")
    )

    depends_on = Column(
        Text,
        nullable=False
    )

    # Relationships
    domain = relationship("Domain", back_populates="skills")
    role_skill_requirements = relationship(
        "RoleSkillRequirement",
        back_populates="skill",
        cascade="all, delete-orphan",
    )

    learning_path_steps = relationship(
        "LearningPathStep",
        back_populates="skill",
        cascade="all, delete-orphan",
    )

    learning_resources = relationship(
        "LearningResource",
        back_populates="skill",
        cascade="all, delete-orphan",
    )

    skill_assessment_skills = relationship(
        "SkillAssessmentSkill",
        back_populates="skill",
        cascade="all, delete-orphan",
    )

    user_skills = relationship(
        "UserSkill",
        back_populates="skill",
        cascade="all, delete-orphan",
    )

    questions = relationship(
        "SkillQuestion",
        back_populates="skill",
        cascade="all, delete-orphan",
    )

    assessment_questions = relationship(
        "AssessmentQuestion",
        back_populates="skill",
        cascade="all, delete-orphan",
    )



    # -------------------------
    # Helper methods
    # -------------------------
    def get_depends_on(self):
        return json.loads(self.depends_on) if self.depends_on else []

    def set_depends_on(self, depends_on_list):
        self.depends_on = json.dumps(depends_on_list)

    # Property to provide compatibility with code expecting 'category'
    @property
    def category(self):
        return self.domain.name if self.domain else None

    def to_dict(self) -> dict:

        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "domainId": self.domain_id,
            "category": self.category,
            "demandLevel": self.demand_level,
            "depends_on": self.get_depends_on(),
        }

    @classmethod
    def find_all(cls, db):
        return db.query(cls).all()

    @classmethod
    def find_by_id(cls, db, skill_id):
        return db.query(cls).filter(cls.id == skill_id).first()
