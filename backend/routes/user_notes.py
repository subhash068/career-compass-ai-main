"""
User Notes API Routes
Handles CRUD operations for user notes and code snippets
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from models.database import get_db
from models.user import User
from models.user_note import UserNote
from routes.auth_fastapi import get_current_user

router = APIRouter(prefix="/api/notes", tags=["User Notes"])


# Pydantic Schemas
class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    code_snippet: Optional[str] = None
    code_language: Optional[str] = None
    learning_resource_id: Optional[int] = None
    learning_path_step_id: Optional[int] = None
    tags: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    code_snippet: Optional[str] = None
    code_language: Optional[str] = None
    learning_resource_id: Optional[int] = None
    learning_path_step_id: Optional[int] = None
    tags: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    code_snippet: Optional[str]
    code_language: Optional[str]
    learning_resource_id: Optional[int]
    learning_path_step_id: Optional[int]
    tags: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    notes: List[NoteResponse]
    total: int


@router.get("", response_model=NoteListResponse)
def get_user_notes(
    skip: int = 0,
    limit: int = 50,
    tag: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all notes for the current user.
    Optional filter by tag.
    """
    try:
        query = db.query(UserNote).filter(UserNote.user_id == current_user.id)
        
        if tag:
            query = query.filter(UserNote.tags.ilike(f"%{tag}%"))
        
        total = query.count()
        notes = query.order_by(UserNote.created_at.desc()).offset(skip).limit(limit).all()
        
        return {
            "notes": [note.to_dict() for note in notes],
            "total": total
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notes: {str(e)}"
        )


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new note for the current user.
    """
    try:
        note = UserNote.create(
            db=db,
            user_id=current_user.id,
            title=note_data.title,
            content=note_data.content,
            code_snippet=note_data.code_snippet,
            code_language=note_data.code_language,
            learning_resource_id=note_data.learning_resource_id,
            learning_path_step_id=note_data.learning_path_step_id,
            tags=note_data.tags
        )
        return note.to_dict()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific note by ID.
    """
    note = UserNote.find_by_id(db, note_id, user_id=current_user.id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return note.to_dict()


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a specific note.
    """
    note = UserNote.find_by_id(db, note_id, user_id=current_user.id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    try:
        # Update fields if provided
        if note_data.title is not None:
            note.title = note_data.title
        if note_data.content is not None:
            note.content = note_data.content
        if note_data.code_snippet is not None:
            note.code_snippet = note_data.code_snippet
        if note_data.code_language is not None:
            note.code_language = note_data.code_language
        if note_data.learning_resource_id is not None:
            note.learning_resource_id = note_data.learning_resource_id
        if note_data.learning_path_step_id is not None:
            note.learning_path_step_id = note_data.learning_path_step_id
        if note_data.tags is not None:
            note.tags = note_data.tags
        
        db.commit()
        db.refresh(note)
        return note.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}"
        )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific note.
    """
    note = UserNote.find_by_id(db, note_id, user_id=current_user.id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    try:
        db.delete(note)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}"
        )


@router.get("/search/{query}")
def search_notes(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search notes by title, content, or tags.
    """
    try:
        from sqlalchemy import or_
        
        search_filter = or_(
            UserNote.title.ilike(f"%{query}%"),
            UserNote.content.ilike(f"%{query}%"),
            UserNote.tags.ilike(f"%{query}%")
        )
        
        notes = db.query(UserNote).filter(
            UserNote.user_id == current_user.id,
            search_filter
        ).order_by(UserNote.created_at.desc()).all()
        
        return {
            "notes": [note.to_dict() for note in notes],
            "total": len(notes)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search notes: {str(e)}"
        )


@router.get("/tags/all")
def get_all_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all unique tags used by the current user.
    """
    try:
        notes = db.query(UserNote).filter(
            UserNote.user_id == current_user.id,
            UserNote.tags.isnot(None)
        ).all()
        
        # Extract and deduplicate tags
        all_tags = set()
        for note in notes:
            if note.tags:
                tags = [tag.strip() for tag in note.tags.split(",")]
                all_tags.update(tags)
        
        return {
            "tags": sorted(list(all_tags))
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tags: {str(e)}"
        )
