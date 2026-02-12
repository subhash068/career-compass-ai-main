from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


from models.database import get_db
from models.user import User
from services.chatbot_service import ChatbotService
from routes.auth_fastapi import get_current_user

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


# ----------------------------
# Pydantic Schemas
# ----------------------------
class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[int] = None


class ChatMessageResponse(BaseModel):
    message: Dict[str, Any]
    session_id: str
    suggested_actions: Optional[List[Dict[str, Any]]] = None



# ----------------------------
# Routes
# ----------------------------
@router.post("/message", response_model=ChatMessageResponse)
def send_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to the chatbot
    """
    try:
        result = ChatbotService.process_message(
            db=db,
            user_id=current_user.id,
            message=request.message,
            session_id=request.session_id,
        )
        # Transform result to match frontend expectations
        response_data = {
            "message": {
                "id": result.get("session_id", 0),
                "role": "assistant",
                "content": result.get("message", ""),
                "timestamp": result.get("timestamp", datetime.now())
            },
            "session_id": str(result.get("session_id", "")),
            "suggested_actions": result.get("suggested_actions")
        }
        return ChatMessageResponse(**response_data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all chat sessions for current user
    """
    try:
        return ChatbotService.get_sessions(
            db=db,
            user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/messages")
def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all messages for a specific chat session
    """
    try:
        return ChatbotService.get_messages(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/clear")
def clear_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Clear a chat session
    """
    try:
        return ChatbotService.clear_session(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
