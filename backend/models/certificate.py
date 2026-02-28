from .database import Base
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Index,
    Text,
    Float,
    Boolean,
    text,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import hashlib
import secrets


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    learning_path_id = Column(
        Integer,
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role_title = Column(
        String(255),
        nullable=False,
    )

    user_name = Column(
        String(255),
        nullable=False,
    )

    # Enhanced certificate fields
    certificate_unique_id = Column(
        String(50),
        nullable=True,
        unique=True,
        index=True,
    )

    issued_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    expiry_date = Column(
        DateTime,
        nullable=True,
    )

    # Course details
    course_duration = Column(
        String(100),
        nullable=True,
    )

    completion_mode = Column(
        String(100),
        nullable=True,
    )

    # Skills covered (JSON string)
    skills_covered = Column(
        Text,
        nullable=True,
    )

    # Assessment details
    final_assessment_score = Column(
        Float,
        nullable=True,
    )

    performance_grade = Column(
        String(10),
        nullable=True,
    )

    project_completed = Column(
        Boolean,
        nullable=False,
        server_default=text("0"),
    )

    # Security
    certificate_hash = Column(
        String(64),
        nullable=True,
        unique=True,
    )

    verification_url = Column(
        String(500),
        nullable=True,
    )

    # QR Code (stored as base64)
    qr_code = Column(
        Text,
        nullable=True,
    )

    certificate_url = Column(
        String(500),
        nullable=True,
    )

    # Digital signature
    digital_signature = Column(
        String(256),
        nullable=True,
    )

    # Blockchain anchoring fields
    blockchain_network = Column(
        String(50),
        nullable=True,
    )

    blockchain_tx_id = Column(
        String(100),
        nullable=True,
        index=True,
    )

    blockchain_hash = Column(
        String(64),
        nullable=True,
    )

    blockchain_anchored_at = Column(
        DateTime,
        nullable=True,
    )

    hash_algorithm = Column(
        String(20),
        nullable=True,
        server_default="SHA-256",
    )

    # Relationships

    user = relationship("User", back_populates="certificates")
    learning_path = relationship("LearningPath")

    __table_args__ = (
        Index("idx_certificate_user_id", "user_id"),
        Index("idx_certificate_learning_path_id", "learning_path_id"),
        Index("idx_certificate_issued_at", "issued_at"),
        Index("idx_certificate_unique_id", "certificate_unique_id"),
    )

    def generate_certificate_id(self) -> str:
        """Generate a unique certificate ID"""
        role_code = "".join([c.upper() for c in self.role_title if c.isalnum()])[:8]
        year = datetime.utcnow().year
        unique_num = str(self.id).zfill(4)
        return f"CCA-{role_code}-{year}-{unique_num}"

    def generate_hash(self) -> str:
        """Generate a secure hash for certificate validation"""
        data = f"{self.user_id}:{self.learning_path_id}:{self.role_title}:{self.user_name}:{self.issued_at}:{secrets.token_hex(16)}"
        return hashlib.sha256(data.encode()).hexdigest()

    def generate_verification_url(self, base_url: str = "https://careercompass.ai") -> str:
        """Generate verification URL"""
        return f"{base_url}/verify/{self.certificate_unique_id}"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "learning_path_id": self.learning_path_id,
            "role_title": self.role_title,
            "user_name": self.user_name,
            "certificate_unique_id": self.certificate_unique_id,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "course_duration": self.course_duration,
            "completion_mode": self.completion_mode,
            "skills_covered": self.skills_covered,
            "final_assessment_score": self.final_assessment_score,
            "performance_grade": self.performance_grade,
            "project_completed": self.project_completed,
            "certificate_hash": self.certificate_hash,
            "verification_url": self.verification_url,
            "qr_code": self.qr_code,
            "certificate_url": self.certificate_url,
            "digital_signature": self.digital_signature,
            "blockchain_network": self.blockchain_network,
            "blockchain_tx_id": self.blockchain_tx_id,
            "blockchain_hash": self.blockchain_hash,
            "blockchain_anchored_at": self.blockchain_anchored_at.isoformat() if self.blockchain_anchored_at else None,
            "hash_algorithm": self.hash_algorithm,
        }
