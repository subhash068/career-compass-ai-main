"""
Models package for Career Compass AI.
"""

from .database import Base, get_db, SessionLocal, engine, create_tables

# Import all model classes to ensure mappers are registered
# Import in dependency order to avoid circular import issues
from .domain import Domain
from .skill import Skill
from .skill_question import SkillQuestion
from .job_role import JobRole
from .role_skill_requirement import RoleSkillRequirement
from .learning_resource import LearningResource
from .learning_path_step import LearningPathStep
from .learning_path import LearningPath, LearningPathStepAssociation
from .skill_assessment import SkillAssessment, SkillAssessmentSkill
from .assessment import Assessment
from .assessment_answer import AssessmentAnswer
from .assessment_question import AssessmentQuestion
from .chat_session import ChatSession
from .chat_message import ChatMessage
from .user import User
from .user_skill import UserSkill
from .user_note import UserNote
from .resume import Resume
from .certificate import Certificate

__all__ = [
    "Base",
    "get_db",
    "SessionLocal",
    "engine",
    "create_tables",
    "User",
    "UserSkill",
    "UserNote",
    "Resume",
    "Skill",
    "SkillQuestion",
    "Domain",
    "Assessment",
    "AssessmentAnswer",
    "AssessmentQuestion",
    "ChatMessage",
    "ChatSession",
    "JobRole",
    "LearningPath",
    "LearningPathStep",
    "LearningResource",
    "RoleSkillRequirement",
    "SkillAssessment",
    "LearningPathStepAssociation",
    "SkillAssessmentSkill",
    "Certificate",
]
