from .database import Base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, text
from sqlalchemy.orm import relationship
import json


class SkillQuestion(Base):
    __tablename__ = 'skill_questions'

    id = Column(Integer, primary_key=True, autoincrement=True)

    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_text = Column(Text, nullable=False)

    options = Column(
        Text,
        nullable=False
    )  # JSON array of options

    correct_answer = Column(String(255), nullable=False)  # The correct option text

    difficulty = Column(
        String(50),
        nullable=False,
        server_default=text("'medium'"),
    )

    # Relationships
    skill = relationship("Skill", back_populates="questions")

    assessment_questions = relationship(
        "AssessmentQuestion",
        back_populates="question",
        cascade="all, delete-orphan",
    )

    assessment_answers = relationship(
        "AssessmentAnswer",
        back_populates="question",
        cascade="all, delete-orphan",
    )

    # -----------------
    # Helper methods
    # -----------------
    def get_options(self):
        return json.loads(self.options) if self.options else []

    def set_options(self, options_list):
        self.options = json.dumps(options_list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "skill_id": self.skill_id,
            "question_text": self.question_text,
            "options": self.get_options(),
            "correct_answer": self.correct_answer,
            "difficulty": self.difficulty,
        }

    @classmethod
    def find_by_skill(cls, db, skill_id):
        return db.query(cls).filter(cls.skill_id == skill_id).all()

    @classmethod
    def find_random_by_skill(cls, db, skill_id, limit=10):
        # For now, just get all and limit; in production, randomize
        questions = db.query(cls).filter(cls.skill_id == skill_id).limit(limit).all()
        return questions
