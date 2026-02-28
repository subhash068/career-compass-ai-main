from sqlalchemy import Column, Integer, String, DateTime, text
from sqlalchemy.orm import relationship
import bcrypt

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(50),
        nullable=False,
        server_default=text("'user'")
    )

    current_role = Column(
        String(255),
        nullable=False,
        server_default=text("''")
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP")
    )

    # -------------------------
    # Relationships (recommended)
    # -------------------------
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("SkillAssessment", back_populates="user", cascade="all, delete-orphan")
    assessment_records = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    learning_paths = relationship("LearningPath", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("UserNote", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")


    # -------------------------
    # Password helpers
    # -------------------------


    def set_password(self, password: str) -> None:
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        self.password_hash = hashed.decode("utf-8")

    def verify_password(self, password: str) -> bool:
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"),
                self.password_hash.encode("utf-8")
            )
        except ValueError:
            # Handle invalid salt/hash gracefully
            return False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "phone": self.phone,
            "role": self.role,
            "currentRole": self.current_role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def create(cls, db, email, name, password, role='user', current_role=''):
        user = cls(email=email, name=name, role=role, current_role=current_role)
        user.set_password(password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @classmethod
    def find_by_email(cls, db, email):
        return db.query(cls).filter(cls.email == email).first()

    @classmethod
    def find_by_id(cls, db, user_id):
        return db.query(cls).filter(cls.id == user_id).first()
