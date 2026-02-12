from .database import Base
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Index,
    Boolean,
    text,
)
from sqlalchemy.orm import relationship


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    target_role_id = Column(
        Integer,
        ForeignKey("job_roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    total_duration = Column(String(100), nullable=True)

    progress = Column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP"),
    )

    # Relationships
    user = relationship("User", back_populates="learning_paths")
    target_role = relationship("JobRole", back_populates="learning_paths")

    steps = relationship(
        "LearningPathStepAssociation",
        back_populates="learning_path",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_learning_path_user_id", "user_id"),
        Index("idx_learning_path_target_role_id", "target_role_id"),
        Index("idx_learning_path_created_at", "created_at"),
    )

    def to_dict(self) -> dict:
        # Safely serialize steps, handling potential lazy loading issues
        steps_list = []
        try:
            for ps in self.steps:
                step_dict = {}
                if ps.step:
                    try:
                        step_dict = ps.step.to_dict()
                    except Exception:
                        # If step.to_dict() fails, use basic info
                        step_dict = {"id": ps.step_id, "skill_id": getattr(ps.step, 'skill_id', None)}
                steps_list.append({
                    **step_dict,
                    "order": ps.order,
                    "is_completed": ps.is_completed,
                })
        except Exception:
            # If steps can't be loaded, return empty list
            steps_list = []

        return {
            "id": self.id,
            "user_id": self.user_id,
            "target_role_id": self.target_role_id,
            "steps": steps_list,
            "total_duration": self.total_duration,
            "progress": self.progress,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }



class LearningPathStepAssociation(Base):
    __tablename__ = "learning_path_step_associations"

    id = Column(Integer, primary_key=True, autoincrement=True)

    learning_path_id = Column(
        Integer,
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    step_id = Column(
        Integer,
        ForeignKey("learning_path_steps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    order = Column(
        "order",
        Integer,
        nullable=False,
        server_default=text("0"),
    )

    is_completed = Column(
        Boolean,
        nullable=False,
        server_default=text("0"),
    )

    step = relationship("LearningPathStep", back_populates="learning_path_associations")
    learning_path = relationship("LearningPath", back_populates="steps")

    __table_args__ = (
        Index("idx_path_step_assoc_learning_path_id", "learning_path_id"),
        Index("idx_path_step_assoc_step_id", "step_id"),
    )
