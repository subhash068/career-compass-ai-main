"""
Resume Model
Stores user resumes and ATS analysis results
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(255), nullable=False)
    
    # Personal Information
    personal_info = Column(JSON, nullable=True)  # name, email, phone, linkedin, portfolio, location
    
    # Professional Summary
    summary = Column(Text, nullable=True)
    
    # Work Experience (array of objects)
    experience = Column(JSON, nullable=True)  # [{company, title, location, start_date, end_date, description, achievements}]
    
    # Education (array of objects)
    education = Column(JSON, nullable=True)  # [{school, degree, field, location, start_date, end_date, gpa}]
    
    # Skills
    skills = Column(JSON, nullable=True)  # [skill1, skill2, ...]
    
    # Certifications (array of objects)
    certifications = Column(JSON, nullable=True)  # [{name, issuer, date, expiry}]
    
    # Projects (array of objects)
    projects = Column(JSON, nullable=True)  # [{name, description, technologies, link}]
    
    # ATS Analysis Results
    ats_score = Column(Float, nullable=True)
    ats_analysis = Column(JSON, nullable=True)  # Detailed ATS analysis results
    parsed_content = Column(Text, nullable=True)  # Raw text extracted from uploaded file
    
    # File upload info
    original_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="resumes")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "personal_info": self.personal_info or {},
            "summary": self.summary,
            "experience": self.experience or [],
            "education": self.education or [],
            "skills": self.skills or [],
            "certifications": self.certifications or [],
            "projects": self.projects or [],
            "ats_score": self.ats_score,
            "ats_analysis": self.ats_analysis or {},
            "original_filename": self.original_filename,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def find_by_user(cls, db, user_id):
        return db.query(cls).filter(cls.user_id == user_id).order_by(cls.created_at.desc()).all()

    @classmethod
    def find_by_id(cls, db, resume_id, user_id=None):
        query = db.query(cls).filter(cls.id == resume_id)
        if user_id:
            query = query.filter(cls.user_id == user_id)
        return query.first()
