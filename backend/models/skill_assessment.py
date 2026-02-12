from .database import Base

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Index,
    Float,
    text,
)
from sqlalchemy.orm import relationship


class SkillAssessment(Base):
    __tablename__ = "skill_assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(
        String(50),
        nullable=False,
        server_default=text("'completed'"),
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # Relationships
    user = relationship("User", back_populates="assessments")

    assessment_skills = relationship(
        "SkillAssessmentSkill",
        back_populates="assessment",
        cascade="all, delete-orphan",
    )

    user_answers = relationship(
        "UserAnswer",
        back_populates="assessment",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_skill_assessment_user_id", "user_id"),
        Index("idx_skill_assessment_created_at", "created_at"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "status": self.status,
            "skills": [
                {
                    "skill_id": s.skill_id,
                    "level": s.level,
                    "confidence": s.confidence,
                    "score": s.score,
                    "written_assessment": s.written_assessment,
                }
                for s in self.assessment_skills
            ],
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def create(cls, db, user_id, skills_data):
        from datetime import datetime
        assessment = cls(
            user_id=user_id,
            status='completed',
            completed_at=datetime.utcnow()
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        # Add skills to assessment
        for skill_data in skills_data:
            assessment_skill = SkillAssessmentSkill(
                assessment_id=assessment.id,
                skill_id=skill_data['skill_id'],
                level=skill_data['level'],
                confidence=skill_data['confidence'],
                score=skill_data['score']
            )
            db.add(assessment_skill)

        db.commit()
        return assessment

    @classmethod
    def find_by_user(cls, db, user_id):
        return db.query(cls).filter(cls.user_id == user_id).all()


class SkillAssessmentSkill(Base):
    __tablename__ = "skill_assessment_skills"

    id = Column(Integer, primary_key=True, autoincrement=True)

    assessment_id = Column(
        Integer,
        ForeignKey("skill_assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    level = Column(
        String(50),
        nullable=False,
        server_default=text("'beginner'"),
    )

    confidence = Column(
        Integer,
        nullable=False,
        server_default=text("50"),
    )

    score = Column(
        Float,
        nullable=False,
        server_default=text("0"),
    )

    written_assessment = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

    skill = relationship("Skill", back_populates="skill_assessment_skills")
    assessment = relationship("SkillAssessment", back_populates="assessment_skills")

    __table_args__ = (
        Index("idx_assessment_skill_assessment_id", "assessment_id"),
        Index("idx_assessment_skill_skill_id", "skill_id"),
    )


class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)

    assessment_id = Column(
        Integer,
        ForeignKey("skill_assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_id = Column(
        Integer,
        ForeignKey("skill_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_answer = Column(String(500), nullable=False)
    is_correct = Column(String(10), nullable=False, server_default=text("'false'"))

    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    assessment = relationship("SkillAssessment", back_populates="user_answers")
    skill = relationship("Skill")
    question = relationship("SkillQuestion")

    __table_args__ = (
        Index("idx_user_answer_assessment_id", "assessment_id"),
        Index("idx_user_answer_skill_id", "skill_id"),
        Index("idx_user_answer_question_id", "question_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "assessment_id": self.assessment_id,
            "skill_id": self.skill_id,
            "question_id": self.question_id,
            "user_answer": self.user_answer,
            "is_correct": self.is_correct,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
