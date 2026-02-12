from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey('assessments.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('skill_questions.id'), nullable=False)
    user_answer = Column(String(500), nullable=False)
    is_correct = Column(Boolean, nullable=False)

    # Relationships
    assessment = relationship("Assessment", back_populates="assessment_answers")
    question = relationship("SkillQuestion", back_populates="assessment_answers")

    def to_dict(self):
        return {
            "id": self.id,
            "assessment_id": self.assessment_id,
            "question_id": self.question_id,
            "user_answer": self.user_answer,
            "is_correct": self.is_correct,
        }
