from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class UserNote(Base):
    """
    Model for storing user notes and code snippets while learning.
    """
    __tablename__ = "user_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Note title
    title = Column(String(255), nullable=False)
    
    # Note content (can be plain text or markdown)
    content = Column(Text, nullable=False)
    
    # Optional: Code snippet
    code_snippet = Column(Text, nullable=True)
    
    # Programming language for syntax highlighting (e.g., 'python', 'javascript')
    code_language = Column(String(50), nullable=True)
    
    # Optional: Link to a specific learning resource or step
    learning_resource_id = Column(Integer, ForeignKey("learning_resources.id"), nullable=True)
    learning_path_step_id = Column(Integer, ForeignKey("learning_path_steps.id"), nullable=True)
    
    # Tags for categorization (comma-separated)
    tags = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notes")
    learning_resource = relationship("LearningResource")
    learning_path_step = relationship("LearningPathStep")
    
    __table_args__ = (
        Index("idx_user_note_user_id", "user_id"),
        Index("idx_user_note_created_at", "created_at"),
        Index("idx_user_note_resource_id", "learning_resource_id"),
    )
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "content": self.content,
            "code_snippet": self.code_snippet,
            "code_language": self.code_language,
            "learning_resource_id": self.learning_resource_id,
            "learning_path_step_id": self.learning_path_step_id,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @classmethod
    def create(cls, db, user_id, title, content, code_snippet=None, 
               code_language=None, learning_resource_id=None, 
               learning_path_step_id=None, tags=None):
        """Create a new user note."""
        note = cls(
            user_id=user_id,
            title=title,
            content=content,
            code_snippet=code_snippet,
            code_language=code_language,
            learning_resource_id=learning_resource_id,
            learning_path_step_id=learning_path_step_id,
            tags=tags
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return note
    
    @classmethod
    def find_by_user(cls, db, user_id, limit=None, offset=None):
        """Get all notes for a specific user."""
        query = db.query(cls).filter(cls.user_id == user_id).order_by(cls.created_at.desc())
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)
        return query.all()
    
    @classmethod
    def find_by_id(cls, db, note_id, user_id=None):
        """Get a specific note by ID, optionally filtering by user."""
        query = db.query(cls).filter(cls.id == note_id)
        if user_id:
            query = query.filter(cls.user_id == user_id)
        return query.first()
    
    @classmethod
    def search_by_tags(cls, db, user_id, tags):
        """Search notes by tags."""
        from sqlalchemy import or_
        tag_filters = [cls.tags.ilike(f"%{tag}%") for tag in tags]
        return db.query(cls).filter(
            cls.user_id == user_id,
            or_(*tag_filters)
        ).order_by(cls.created_at.desc()).all()
