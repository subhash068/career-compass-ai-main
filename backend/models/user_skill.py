from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, text
from sqlalchemy.orm import relationship
from .database import Base


class UserSkill(Base):
    __tablename__ = 'user_skills'

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey('skills.id'), nullable=False, index=True)

    level = Column(
        String(50),
        nullable=False,
        server_default=text("'beginner'")
    )

    confidence = Column(
        Integer,
        nullable=False,
        server_default=text("50")
    )

    score = Column(
        Float,
        nullable=False,
        server_default=text("0")
    )

    assessed_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    version = Column(
        Integer,
        nullable=False,
        server_default=text("1")
    )

    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="user_skills")

    __table_args__ = (
        Index('idx_user_skill_user_id', 'user_id'),
        Index('idx_user_skill_skill_id', 'skill_id'),
        Index('idx_user_skill_user_skill', 'user_id', 'skill_id', unique=True),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "skill_id": self.skill_id,
            "level": self.level,
            "confidence": self.confidence,
            "score": self.score,
            "assessed_at": self.assessed_at.isoformat() if self.assessed_at else None,
            "version": self.version,
        }


    @classmethod
    def create(cls, db, user_id, skill_id, level, confidence, score):
        from datetime import datetime
        user_skill = cls(
            user_id=user_id,
            skill_id=skill_id,
            level=level,
            confidence=confidence,
            score=score,
            assessed_at=datetime.utcnow()
        )
        db.add(user_skill)
        db.commit()
        db.refresh(user_skill)
        return user_skill

    @classmethod
    def find_by_user(cls, db, user_id):
        return db.query(cls).filter(cls.user_id == user_id).all()
