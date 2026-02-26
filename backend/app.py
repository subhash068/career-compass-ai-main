import sys
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from models.database import get_db

# Import models
from models.user import User
from models.skill import Skill
from models.domain import Domain
from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement
from models.learning_path_step import LearningPathStep
from models.learning_path import LearningPath, LearningPathStepAssociation
from models.learning_resource import LearningResource
from models.chat_session import ChatSession
from models.chat_message import ChatMessage
from models.skill_assessment import SkillAssessment
from models.user_skill import UserSkill

# Routers
from routes import auth_fastapi as auth
from routes.skills import router as skills_router
from routes.assessment import router as assessment_router
from routes.domains import router as domains_router
from routes.career import router as career_router
from routes.learning import router as learning_router
from routes.chatbot import router as chatbot_router
from routes.admin import router as admin_router
from routes.admin_quiz import router as admin_quiz_router
from routes.admin_logs import router as admin_logs_router
from routes.admin_domains import router as admin_domains_router
from routes.user_notes import router as user_notes_router
from routes.resume import router as resume_router





# DATABASE_URL from models.database

# -----------------------------
# Create FastAPI app
# -----------------------------
app = FastAPI(
    title="Career Compass AI",
    description="AI-powered career guidance and skill analysis platform",
    version="1.0.0",
)

# print(f"DEBUG: DATABASE_URL = {DATABASE_URL}")

# -----------------------------
# CORS middleware (CORRECT)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:8080",

    #     "http://10.50.47.101:8080",
        # "http://192.168.42.1:8080/",
        # "http://192.168.118.1:8080/",
        # "http://10.50.47.101:8080/",
        # "http://10.50.47.101:5000/",

        # "http://192.168.42.1:8080/",
        # "http://192.168.42.1:5000/",
        # "http://localhost:5173",
        # "http://localhost:8081",
        # "http://127.0.0.1:5000",
        # "http://127.0.0.1:5173",
        # "http://127.0.0.1:8080",
        # "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Routers
# -----------------------------
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(skills_router, prefix="/skills", tags=["Skills"])
app.include_router(assessment_router, tags=["Assessment"])

app.include_router(domains_router, prefix="/api", tags=["Domains"])
app.include_router(career_router, tags=["Career"])
app.include_router(learning_router, tags=["Learning"])
app.include_router(chatbot_router, tags=["Chatbot"])
app.include_router(admin_router, tags=["Admin"])
app.include_router(admin_quiz_router, tags=["Admin Quiz"])
app.include_router(admin_logs_router, tags=["Admin Logs"])
app.include_router(admin_domains_router, tags=["Admin Domains & Skills"])
app.include_router(user_notes_router, tags=["User Notes"])
app.include_router(resume_router, tags=["Resumes"])


# -----------------------------
# Health check
# -----------------------------
@app.get("/status")
def get_status(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "running", "database": "connected"}

# -----------------------------
# Debug users
# -----------------------------
@app.get("/debug/users")
def debug_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "name": u.name} for u in users]

# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
