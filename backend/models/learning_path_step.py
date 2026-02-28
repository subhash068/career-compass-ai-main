from .database import Base
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    Index,
    text,
)
from sqlalchemy.orm import relationship
import json


class LearningPathStep(Base):
    __tablename__ = "learning_path_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)

    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    target_level = Column(
        String(50),
        nullable=False,
        server_default=text("'beginner'"),
    )

    order = Column(
        "order",
        Integer,
        nullable=False,
        server_default=text("0"),
    )

    estimated_duration = Column(String(100), nullable=True)

    resources = Column(
        Text,
        nullable=False,
    )

    dependencies = Column(
        Text,
        nullable=False,
    )

    assessment_questions = Column(
        Text,
        nullable=True,
    )

    is_completed = Column(
        Boolean,
        nullable=False,
        server_default=text("0"),
    )


    # Relationships
    skill = relationship("Skill", back_populates="learning_path_steps")
    learning_path_associations = relationship(
        "LearningPathStepAssociation",
        back_populates="step",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_learning_path_step_skill_id", "skill_id"),
        Index("idx_learning_path_step_order", "order"),
    )

    # -------------------------
    # JSON helpers
    # -------------------------
    def get_resources(self):
        return json.loads(self.resources) if self.resources else []

    def set_resources(self, resources_list):
        self.resources = json.dumps(resources_list)

    def get_dependencies(self):
        return json.loads(self.dependencies) if self.dependencies else []

    def set_dependencies(self, dependencies_list):
        self.dependencies = json.dumps(dependencies_list)

    def get_assessment_questions(self):
        return json.loads(self.assessment_questions) if self.assessment_questions else []

    def set_assessment_questions(self, questions_list):
        self.assessment_questions = json.dumps(questions_list)

    def to_dict(self) -> dict:

        try:
            resources = self.get_resources() if self.resources else []
        except Exception:
            resources = []
        
        try:
            dependencies = self.get_dependencies() if self.dependencies else []
        except Exception:
            dependencies = []
        
        try:
            assessment_questions = self.get_assessment_questions() if self.assessment_questions else []
        except Exception:
            assessment_questions = []
        
        # Safely serialize skill information
        skill_dict = None
        try:
            if self.skill:
                skill_dict = {
                    "id": self.skill.id,
                    "name": getattr(self.skill, 'name', None),
                    "description": getattr(self.skill, 'description', None),
                }
        except Exception:
            skill_dict = None
        
        return {
            "id": self.id,
            "skill_id": self.skill_id,
            "skill": skill_dict,
            "target_level": self.target_level,
            "targetLevel": self.target_level,  # camelCase for frontend
            "order": self.order,
            "estimated_duration": self.estimated_duration,
            "estimatedDuration": self.estimated_duration,  # camelCase for frontend
            "resources": resources,
            "assessment_questions": assessment_questions,
            "assessmentQuestions": assessment_questions,  # camelCase for frontend
            "dependencies": dependencies,
            "is_completed": self.is_completed,
            "isCompleted": self.is_completed,  # camelCase for frontend
        }
