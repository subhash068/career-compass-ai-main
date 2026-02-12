from .database import Base
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Index, text
from sqlalchemy.orm import relationship


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
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
    user = relationship("User", back_populates="chat_sessions")

    messages = relationship(
        "ChatMessage",
        back_populates="chat_session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.timestamp",
    )

    __table_args__ = (
        Index("idx_chat_session_user_id", "user_id"),
        Index("idx_chat_session_created_at", "created_at"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "messages": [m.to_dict() for m in self.messages],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def create(cls, db, user_id):
        from datetime import datetime
        session = cls(user_id=user_id, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @classmethod
    def find_by_id(cls, db, session_id):
        return db.query(cls).filter(cls.id == session_id).first()

    def add_message(self, message):
        self.messages.append(message)
        self.updated_at = message.timestamp

    def save(self):
        # This would be called after adding messages, but since we're using SQLAlchemy,
        # the session will handle the commit
        pass
