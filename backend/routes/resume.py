"""
Resume API Routes
Handles resume CRUD operations and ATS analysis
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import json

from models.database import get_db
from models.user import User
from models.resume import Resume
from routes.auth_fastapi import get_current_user
from services.resume_service import ResumeService

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])


# ============== Resume CRUD Operations ==============

@router.get("", response_model=Dict[str, Any])
async def get_user_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all resumes for the current user
    """
    try:
        resumes = ResumeService.get_user_resumes(db, current_user.id)
        return {
            "success": True,
            "resumes": [resume.to_dict() for resume in resumes],
            "count": len(resumes)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch resumes: {str(e)}"
        )


@router.post("", response_model=Dict[str, Any])
async def create_resume(
    title: str = Form(...),
    personal_info: str = Form(...),
    summary: Optional[str] = Form(None),
    experience: Optional[str] = Form("[]"),
    education: Optional[str] = Form("[]"),
    skills: Optional[str] = Form("[]"),
    certifications: Optional[str] = Form("[]"),
    projects: Optional[str] = Form("[]"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new resume
    """
    try:
        # Parse JSON strings
        personal_info_dict = json.loads(personal_info)
        experience_list = json.loads(experience) if experience else []
        education_list = json.loads(education) if education else []
        skills_list = json.loads(skills) if skills else []
        certifications_list = json.loads(certifications) if certifications else []
        projects_list = json.loads(projects) if projects else []
        
        resume = ResumeService.create_resume(
            db=db,
            user_id=current_user.id,
            title=title,
            personal_info=personal_info_dict,
            summary=summary,
            experience=experience_list,
            education=education_list,
            skills=skills_list,
            certifications=certifications_list,
            projects=projects_list
        )
        
        return {
            "success": True,
            "message": "Resume created successfully",
            "resume": resume.to_dict()
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create resume: {str(e)}"
        )


@router.get("/{resume_id}", response_model=Dict[str, Any])
async def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific resume by ID
    """
    try:
        resume = Resume.find_by_id(db, resume_id, current_user.id)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        return {
            "success": True,
            "resume": resume.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch resume: {str(e)}"
        )


@router.put("/{resume_id}", response_model=Dict[str, Any])
async def update_resume(
    resume_id: int,
    title: Optional[str] = Form(None),
    personal_info: Optional[str] = Form(None),
    summary: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    education: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    certifications: Optional[str] = Form(None),
    projects: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing resume
    """
    try:
        # Build update data
        update_data = {}
        
        if title:
            update_data["title"] = title
        if personal_info:
            update_data["personal_info"] = json.loads(personal_info)
        if summary is not None:
            update_data["summary"] = summary
        if experience:
            update_data["experience"] = json.loads(experience)
        if education:
            update_data["education"] = json.loads(education)
        if skills:
            update_data["skills"] = json.loads(skills)
        if certifications:
            update_data["certifications"] = json.loads(certifications)
        if projects:
            update_data["projects"] = json.loads(projects)
        
        resume = ResumeService.update_resume(
            db=db,
            resume_id=resume_id,
            user_id=current_user.id,
            **update_data
        )
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        return {
            "success": True,
            "message": "Resume updated successfully",
            "resume": resume.to_dict()
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update resume: {str(e)}"
        )


@router.delete("/{resume_id}", response_model=Dict[str, Any])
async def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a resume
    """
    try:
        success = ResumeService.delete_resume(db, resume_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        return {
            "success": True,
            "message": "Resume deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete resume: {str(e)}"
        )


# ============== File Upload & ATS Analysis ==============

@router.post("/upload", response_model=Dict[str, Any])
async def upload_resume(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a resume file (PDF or DOCX) and parse it
    """
    try:
        # Validate file type
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only PDF and DOCX files are allowed."
            )
        
        # Read file content
        content = await file.read()
        
        # Check file size (max 5MB)
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 5MB limit."
            )
        
        # Parse the file
        parse_result = ResumeService.parse_resume_file(content, file.filename)
        
        if not parse_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse file: {parse_result.get('error', 'Unknown error')}"
            )
        
        # Extract structured data
        extracted_data = ResumeService.extract_resume_data(parse_result["text"])
        
        # Create resume with parsed content
        resume_title = title or f"Uploaded Resume - {file.filename}"
        
        resume = ResumeService.create_resume(
            db=db,
            user_id=current_user.id,
            title=resume_title,
            personal_info=extracted_data.get("personal_info", {}),
            summary=extracted_data.get("summary", ""),
            experience=extracted_data.get("experience", []),
            education=extracted_data.get("education", []),
            skills=extracted_data.get("skills", []),
            certifications=[],
            projects=[]
        )
        
        # Store parsed content and file info
        resume.parsed_content = parse_result["text"]
        resume.original_filename = file.filename
        db.commit()
        
        # Perform ATS analysis
        ats_analysis = ResumeService.analyze_ats_score(parse_result["text"])
        
        # Update resume with ATS score
        resume.ats_score = ats_analysis["overall_score"]
        resume.ats_analysis = ats_analysis
        db.commit()
        
        return {
            "success": True,
            "message": "Resume uploaded and analyzed successfully",
            "resume": resume.to_dict(),
            "ats_analysis": ats_analysis,
            "parsed_text_preview": parse_result["text"][:500] + "..." if len(parse_result["text"]) > 500 else parse_result["text"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload resume: {str(e)}"
        )


@router.post("/{resume_id}/ats-score", response_model=Dict[str, Any])
async def analyze_ats_score(
    resume_id: int,
    job_description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze ATS score for a resume
    Optionally provide a job description for targeted analysis
    """
    try:
        resume = Resume.find_by_id(db, resume_id, current_user.id)
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        # Get text to analyze
        text_to_analyze = resume.parsed_content or ""
        
        # If no parsed content, try to build from structured data
        if not text_to_analyze:
            text_parts = []
            if resume.summary:
                text_parts.append(resume.summary)
            if resume.skills:
                text_parts.append(" ".join(resume.skills))
            if resume.experience:
                for exp in resume.experience:
                    text_parts.append(exp.get("description", ""))
            text_to_analyze = " ".join(text_parts)
        
        # Perform ATS analysis
        ats_analysis = ResumeService.analyze_ats_score(text_to_analyze, job_description)
        
        # Update resume with new analysis
        resume.ats_score = ats_analysis["overall_score"]
        resume.ats_analysis = ats_analysis
        db.commit()
        
        return {
            "success": True,
            "resume_id": resume_id,
            "ats_analysis": ats_analysis
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze ATS score: {str(e)}"
        )


@router.get("/{resume_id}/ats-analysis", response_model=Dict[str, Any])
async def get_ats_analysis(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the stored ATS analysis for a resume
    """
    try:
        resume = Resume.find_by_id(db, resume_id, current_user.id)
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        if not resume.ats_analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No ATS analysis found for this resume. Please run analysis first."
            )
        
        return {
            "success": True,
            "resume_id": resume_id,
            "ats_analysis": resume.ats_analysis,
            "ats_score": resume.ats_score
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get ATS analysis: {str(e)}"
        )
