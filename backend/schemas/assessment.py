from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime


# Request Schemas
class InitializeAssessmentRequest(BaseModel):
    domain_id: int = Field(..., description="Selected domain ID")
    skill_ids: List[int] = Field(..., description="List of selected skill IDs", min_items=1)


class StartSkillQuizRequest(BaseModel):
    skill_id: int = Field(..., description="Skill ID to start quiz for")


class SubmitQuizRequest(BaseModel):
    skill_id: int = Field(..., description="Skill ID being assessed")
    answers: Dict[int, str] = Field(..., description="Question ID -> User Answer mapping")
    time_taken: Optional[int] = Field(None, description="Time taken in seconds")


# Response Schemas
class SkillInfo(BaseModel):
    id: int
    name: str
    description: Optional[str]
    difficulty: Optional[str] = "medium"


class SelectedSkillsResponse(BaseModel):
    skills: List[SkillInfo]
    assessment_id: Optional[int] = None


class QuestionResponse(BaseModel):
    id: int
    question_text: str
    options: List[str]
    difficulty: str


class StartQuizResponse(BaseModel):
    skill_id: int
    skill_name: str
    questions: List[QuestionResponse]
    time_limit: int = 600  # 10 minutes in seconds


class QuizResult(BaseModel):
    skill_id: int
    skill_name: str
    total_questions: int
    correct_answers: int
    percentage: float
    level: str  # Beginner, Intermediate, Advanced
    time_taken: Optional[int] = None


class SubmitQuizResponse(BaseModel):
    assessment_id: int
    skill_results: List[QuizResult]
    overall_score: float
    overall_level: str
    confidence_updated: bool


class AssessmentResultResponse(BaseModel):
    skill_id: int
    skill_name: str
    score: float
    percentage: float
    level: str
    confidence: int
    completed_at: datetime


# Error Response
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None


# Validation Schemas
class ValidateSkillAccess(BaseModel):
    user_id: int
    skill_id: int
    assessment_id: Optional[int] = None
