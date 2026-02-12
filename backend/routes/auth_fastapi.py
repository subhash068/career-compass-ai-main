from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import jwt
import os

from models.database import get_db
from models.user import User
from services.auth_service import AuthService

router = APIRouter(tags=["Authentication"])
security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET_KEY is not set in environment variables")

# --------------------------------------------------
# REQUEST / RESPONSE SCHEMAS
# --------------------------------------------------
class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str
    role: Optional[str] = "user"


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: Optional[str] = None
    role: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    current_role: Optional[str] = None


# --------------------------------------------------
# AUTH DEPENDENCY
# --------------------------------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = int(payload.get("sub"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# --------------------------------------------------
# REGISTER
# --------------------------------------------------
@router.post("/register", response_model=dict, status_code=201)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        return AuthService.register_user(
            db=db,
            email=request.email,
            name=request.name,
            password=request.password,
            role=request.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------------------------------------
# LOGIN
# --------------------------------------------------
@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    try:
        result = AuthService.authenticate_user(
            db=db,
            email=request.email,
            password=request.password,
        )

        # user = db.query(User).filter(User.email == request.email.lower().strip()).first()
        user = result["user"]  # ✅ USE RETURNED USER
        return TokenResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                phone=user.phone,
                role=user.role,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")


# --------------------------------------------------
# TOKEN REFRESH
# --------------------------------------------------
class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=dict)
def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            request.refresh_token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = int(payload.get("sub"))

        return AuthService.refresh_access_token(
            db=db,
            user_id=user_id,
            refresh_token=request.refresh_token,
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")



# --------------------------------------------------
# PROFILE
# --------------------------------------------------
@router.get("/profile", response_model=UserResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        phone=current_user.phone,
        role=current_user.role,
    )


@router.put("/profile", response_model=UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.name is not None:
        current_user.name = request.name
    if request.phone is not None:
        current_user.phone = request.phone
    if request.current_role is not None:
        current_user.current_role = request.current_role

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        phone=current_user.phone,
        role=current_user.role,
    )


# --------------------------------------------------
# PASSWORD RESET
# --------------------------------------------------
@router.post("/forgot-password", response_model=dict)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        return AuthService.initiate_password_reset(
            db=db,
            email=request.email,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset-password", response_model=dict)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        return AuthService.reset_password(
            db=db,
            reset_token=request.reset_token,
            new_password=request.new_password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
