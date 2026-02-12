from .database import Base
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, Index, text
from sqlalchemy.orm import relationship


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, autoincrement=True)

    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)

    type = Column(
        String(50),
        nullable=False,
        server_default=text("'course'"),
    )

    provider = Column(String(255), nullable=True)

    url = Column(Text, nullable=True)

    duration = Column(String(100), nullable=True)

    difficulty = Column(
        String(50),
        nullable=False,
        server_default=text("'beginner'"),
    )

    rating = Column(
        Float,
        nullable=False,
        server_default=text("0"),
    )

    cost = Column(
        String(50),
        nullable=False,
        server_default=text("'free'"),
    )

    # Relationship
    skill = relationship("Skill", back_populates="learning_resources")

    __table_args__ = (
        Index("idx_learning_resource_skill_id", "skill_id"),
        Index("idx_learning_resource_type", "type"),
        Index("idx_learning_resource_difficulty", "difficulty"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "skill_id": self.skill_id,
            "title": self.title,
            "type": self.type,
            "provider": self.provider,
            "url": self.url,
            "duration": self.duration,
            "difficulty": self.difficulty,
            "rating": self.rating,
            "cost": self.cost,
        }
