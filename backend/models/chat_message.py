from .database import Base

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, text
from sqlalchemy.orm import relationship
import json


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)

    session_id = Column(
        Integer,
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role = Column(String(50), nullable=False)

    content = Column(Text, nullable=False)

    timestamp = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    context = Column(
        Text,
        nullable=False,
    )

    # Relationships
    chat_session = relationship(
        "ChatSession",
        back_populates="messages",
    )

    __table_args__ = (
        Index("idx_chat_message_session_id", "session_id"),
        Index("idx_chat_message_timestamp", "timestamp"),
    )

    # -------------------------
    # JSON helpers
    # -------------------------
    def get_context(self):
        return json.loads(self.context) if self.context else {}

    def set_context(self, context_dict):
        self.context = json.dumps(context_dict)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "context": self.get_context(),
        }
