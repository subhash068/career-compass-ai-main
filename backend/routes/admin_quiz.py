"""
Admin Quiz Management Routes
Handles MCQ creation, updates, deletion, and Excel uploads
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import pandas as pd
import io

from models.database import get_db
from models.user import User
from models.skill_question import SkillQuestion
from models.skill import Skill
from routes.auth_fastapi import get_current_user

router = APIRouter(prefix="/admin/quiz", tags=["Admin Quiz Management"])


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/questions")
def get_all_questions(
    skip: int = 0,
    limit: int = 100,
    skill_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all quiz questions with filters
    """
    try:
        query = db.query(SkillQuestion)
        
        if skill_id:
            query = query.filter(SkillQuestion.skill_id == skill_id)
        
        if difficulty:
            query = query.filter(SkillQuestion.difficulty == difficulty)
        
        if search:
            query = query.filter(SkillQuestion.question_text.contains(search))
        
        total = query.count()
        questions = query.offset(skip).limit(limit).all()
        
        return {
            "questions": [
                {
                    "id": q.id,
                    "skill_id": q.skill_id,
                    "skill_name": q.skill.name if q.skill else None,
                    "question_text": q.question_text,
                    "question_type": q.question_type,
                    "options": q.get_options(),
                    "correct_answer": q.correct_answer,
                    "difficulty": q.difficulty,
                    "explanation": q.explanation,
                    "created_at": q.created_at.isoformat() if q.created_at else None,
                    "updated_at": q.updated_at.isoformat() if q.updated_at else None,
                }
                for q in questions
            ],
            "total": total,
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/questions/{question_id}")
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get a single question by ID
    """
    try:
        question = db.query(SkillQuestion).filter(SkillQuestion.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return {
            "id": question.id,
            "skill_id": question.skill_id,
            "skill_name": question.skill.name if question.skill else None,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "options": question.get_options(),
            "correct_answer": question.correct_answer,
            "difficulty": question.difficulty,
            "explanation": question.explanation,
            "created_at": question.created_at.isoformat() if question.created_at else None,
            "updated_at": question.updated_at.isoformat() if question.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/questions")
def create_question(
    question_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new quiz question
    """
    try:
        # Validate skill exists
        skill = db.query(Skill).filter(Skill.id == question_data.get("skill_id")).first()
        if not skill:
            raise HTTPException(status_code=400, detail="Skill not found")
        
        # Create question
        question = SkillQuestion(
            skill_id=question_data["skill_id"],
            question_text=question_data["question_text"],
            question_type=question_data.get("question_type", "multiple_choice"),
            options=question_data.get("options", []),
            correct_answer=question_data["correct_answer"],
            difficulty=question_data.get("difficulty", "medium"),
            explanation=question_data.get("explanation"),
        )
        
        db.add(question)
        db.commit()
        db.refresh(question)
        
        return {
            "message": "Question created successfully",
            "question": {
                "id": question.id,
                "skill_id": question.skill_id,
                "question_text": question.question_text,
                "difficulty": question.difficulty,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/questions/{question_id}")
def update_question(
    question_id: int,
    question_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update an existing quiz question
    """
    try:
        question = db.query(SkillQuestion).filter(SkillQuestion.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Update fields
        if "skill_id" in question_data:
            skill = db.query(Skill).filter(Skill.id == question_data["skill_id"]).first()
            if not skill:
                raise HTTPException(status_code=400, detail="Skill not found")
            question.skill_id = question_data["skill_id"]
        
        if "question_text" in question_data:
            question.question_text = question_data["question_text"]
        
        if "question_type" in question_data:
            question.question_type = question_data["question_type"]
        
        if "options" in question_data:
            question.set_options(question_data["options"])
        
        if "correct_answer" in question_data:
            question.correct_answer = question_data["correct_answer"]
        
        if "difficulty" in question_data:
            question.difficulty = question_data["difficulty"]
        
        if "explanation" in question_data:
            question.explanation = question_data["explanation"]
        
        db.commit()
        db.refresh(question)
        
        return {
            "message": "Question updated successfully",
            "question": {
                "id": question.id,
                "skill_id": question.skill_id,
                "question_text": question.question_text,
                "difficulty": question.difficulty,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a quiz question
    """
    try:
        question = db.query(SkillQuestion).filter(SkillQuestion.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        db.delete(question)
        db.commit()
        
        return {"message": "Question deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/questions/bulk-delete")
def bulk_delete_questions(
    question_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete multiple questions at once
    """
    try:
        deleted_count = 0
        for question_id in question_ids:
            question = db.query(SkillQuestion).filter(SkillQuestion.id == question_id).first()
            if question:
                db.delete(question)
                deleted_count += 1
        
        db.commit()
        
        return {
            "message": f"Successfully deleted {deleted_count} questions",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-excel")
async def upload_excel(
    file: UploadFile = File(...),
    skill_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Upload questions from Excel file
    Expected columns: question_text, options, correct_answer, difficulty, explanation
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file format. Please upload .xlsx, .xls, or .csv file"
            )
        
        # Read file content
        contents = await file.read()
        
        # Parse Excel/CSV
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['question_text', 'options', 'correct_answer']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process each row
        created_questions = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Validate data
                if pd.isna(row['question_text']) or not str(row['question_text']).strip():
                    errors.append(f"Row {index + 2}: Question text is required")
                    continue
                
                # Parse options
                options = []
                if isinstance(row['options'], str):
                    # Handle comma-separated or newline-separated options
                    if ',' in row['options']:
                        options = [opt.strip() for opt in row['options'].split(',')]
                    else:
                        options = [opt.strip() for opt in row['options'].split('\n') if opt.strip()]
                elif isinstance(row['options'], list):
                    options = row['options']
                
                if len(options) < 2:
                    errors.append(f"Row {index + 2}: At least 2 options required")
                    continue
                
                # Determine skill_id for this question
                question_skill_id = skill_id
                if 'skill_id' in df.columns and not pd.isna(row['skill_id']):
                    question_skill_id = int(row['skill_id'])
                
                if not question_skill_id:
                    errors.append(f"Row {index + 2}: Skill ID is required")
                    continue
                
                # Validate skill exists
                skill = db.query(Skill).filter(Skill.id == question_skill_id).first()
                if not skill:
                    errors.append(f"Row {index + 2}: Skill with ID {question_skill_id} not found")
                    continue
                
                # Create question
                question = SkillQuestion(
                    skill_id=question_skill_id,
                    question_text=str(row['question_text']).strip(),
                    question_type='multiple_choice',
                    options=options,
                    correct_answer=str(row['correct_answer']).strip(),
                    difficulty=str(row.get('difficulty', 'medium')).strip().lower(),
                    explanation=str(row.get('explanation', '')).strip() if not pd.isna(row.get('explanation')) else None,
                )
                
                db.add(question)
                created_questions.append({
                    "row": index + 2,
                    "question_text": question.question_text[:50] + "..."
                })
                
            except Exception as row_error:
                errors.append(f"Row {index + 2}: {str(row_error)}")
        
        # Commit all successful questions
        db.commit()
        
        return {
            "message": f"Successfully created {len(created_questions)} questions",
            "created_count": len(created_questions),
            "error_count": len(errors),
            "errors": errors[:10],  # Return first 10 errors
            "questions_preview": created_questions[:5]  # Return first 5 for preview
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-template")
def download_excel_template(
    current_user: User = Depends(require_admin),
):
    """
    Download Excel template for bulk question upload
    """
    try:
        # Create template DataFrame
        template_data = {
            'question_text': [
                'What is the capital of France?',
                'Which programming language is known as the "language of the web"?',
            ],
            'options': [
                'Paris, London, Berlin, Madrid',
                'JavaScript, Python, Java, C++'
            ],
            'correct_answer': [
                'Paris',
                'JavaScript'
            ],
            'difficulty': [
                'easy',
                'medium'
            ],
            'explanation': [
                'Paris is the capital and most populous city of France.',
                'JavaScript is the primary language for web development.'
            ],
            'skill_id': [
                1,
                2
            ]
        }
        
        df = pd.DataFrame(template_data)
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Questions')
            
            # Get workbook and worksheet for formatting
            workbook = writer.book
            worksheet = writer.sheets['Questions']
            
            # Adjust column widths
            worksheet.column_dimensions['A'].width = 50  # question_text
            worksheet.column_dimensions['B'].width = 40  # options
            worksheet.column_dimensions['C'].width = 20  # correct_answer
            worksheet.column_dimensions['D'].width = 15  # difficulty
            worksheet.column_dimensions['E'].width = 50  # explanation
            worksheet.column_dimensions['F'].width = 10  # skill_id
        
        output.seek(0)
        
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': 'attachment; filename=question_template.xlsx'}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
def get_quiz_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get quiz statistics
    """
    try:
        from sqlalchemy import func
        
        total_questions = db.query(SkillQuestion).count()
        
        # Questions by difficulty
        difficulty_counts = db.query(
            SkillQuestion.difficulty,
            func.count(SkillQuestion.id)
        ).group_by(SkillQuestion.difficulty).all()
        
        # Questions by skill
        skill_counts = db.query(
            Skill.name,
            func.count(SkillQuestion.id)
        ).join(SkillQuestion).group_by(Skill.name).all()
        
        return {
            "total_questions": total_questions,
            "by_difficulty": {d: c for d, c in difficulty_counts},
            "by_skill": {s: c for s, c in skill_counts},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
