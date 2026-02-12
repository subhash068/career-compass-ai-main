from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .database import Base

class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    # Relationships
    skills = relationship("Skill", back_populates="domain")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
        }
