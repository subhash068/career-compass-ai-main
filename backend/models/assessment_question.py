from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey('assessments.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('skill_questions.id'), nullable=False)
    skill_id = Column(Integer, ForeignKey('skills.id'), nullable=False)

    # Relationships
    assessment = relationship("Assessment", back_populates="assessment_questions")
    question = relationship("SkillQuestion", back_populates="assessment_questions")
    skill = relationship("Skill", back_populates="assessment_questions")

    def to_dict(self):
        return {
            "id": self.id,
            "assessment_id": self.assessment_id,
            "question_id": self.question_id,
            "skill_id": self.skill_id,
        }
