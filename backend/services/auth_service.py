from typing import Dict, Any
from sqlalchemy.orm import Session
import jwt
import datetime
import os
import re
import bleach

# Try relative imports first, fallback to absolute
try:
    from ..models.user import User
except ImportError:
    from models.user import User



JWT_SECRET = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET_KEY is not set")


class AuthService:
    # --------------------------------------------------
    # VALIDATION HELPERS
    # --------------------------------------------------
    @staticmethod
    def validate_email(email: str) -> bool:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    @staticmethod
    def validate_password(password: str) -> bool:
        return (
            len(password) >= 8
            and any(c.isdigit() for c in password)
            and any(c.isalpha() for c in password)
        )

    @staticmethod
    def sanitize_input(value: str) -> str:
        return bleach.clean(value, strip=True)

    # --------------------------------------------------
    # USER REGISTRATION
    # --------------------------------------------------
    @staticmethod
    def register_user(
        db: Session,
        email: str,
        name: str,
        password: str,
        role: str = "user",
    ) -> Dict[str, Any]:

        email = email.lower().strip()
        name = AuthService.sanitize_input(name)

        if not AuthService.validate_email(email):
            raise ValueError("Invalid email format")

        if not AuthService.validate_password(password):
            raise ValueError(
                "Password must be at least 8 characters and contain letters and numbers"
            )

        if db.query(User).filter(User.email == email).first():
            raise ValueError("User with this email already exists")

        user = User(email=email, name=name, role=role)
        user.set_password(password)

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "message": "User registered successfully",
            "user_id": user.id,
            **AuthService._generate_tokens(user.id),
        }

    # --------------------------------------------------
    # LOGIN
    # --------------------------------------------------
    @staticmethod
    def authenticate_user(
        db: Session,
        email: str,
        password: str,
    ) -> Dict[str, Any]:

        email = email.lower().strip()
        user = db.query(User).filter(User.email == email).first()
        
        if not user or not user.verify_password(password):
            raise ValueError("Invalid email or password")

        tokens = AuthService._generate_tokens(user.id)

        return {
            "user": user,
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": tokens["token_type"],
        }


    # --------------------------------------------------
    # TOKEN REFRESH
    # --------------------------------------------------
    @staticmethod
    def refresh_access_token(
        db: Session,
        user_id: int,
        refresh_token: str,
    ) -> Dict[str, Any]:

        try:
            payload = jwt.decode(
                refresh_token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM],
            )
            if payload.get("type") != "refresh":
                raise ValueError("Invalid refresh token type")
        except jwt.ExpiredSignatureError:
            raise ValueError("Refresh token expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid refresh token")

        if int(payload.get("sub")) != user_id:
            raise ValueError("Token does not belong to this user")

        if not db.query(User).filter(User.id == user_id).first():
            raise ValueError("User no longer exists")

        access_token = jwt.encode(
            {
                "sub": str(user_id),
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(minutes=15),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    # --------------------------------------------------
    # PASSWORD RESET
    # --------------------------------------------------
    @staticmethod
    def initiate_password_reset(
        db: Session,
        email: str,
    ) -> Dict[str, Any]:

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError("User with this email does not exist")

        reset_token = jwt.encode(
            {
                "sub": str(user.id),
                "type": "password_reset",
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(minutes=15),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )

        return {
            "message": "Password reset initiated",
            "reset_token": reset_token,
        }

    @staticmethod
    def reset_password(
        db: Session,
        reset_token: str,
        new_password: str,
    ) -> Dict[str, Any]:

        if not AuthService.validate_password(new_password):
            raise ValueError(
                "Password must be at least 8 characters and contain letters and numbers"
            )

        try:
            payload = jwt.decode(
                reset_token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM],
            )
        except jwt.ExpiredSignatureError:
            raise ValueError("Reset token expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid reset token")

        if payload.get("type") != "password_reset":
            raise ValueError("Invalid reset token type")

        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise ValueError("User not found")

        user.set_password(new_password)
        db.commit()

        return {"message": "Password reset successfully"}

    # --------------------------------------------------
    # TOKEN GENERATION
    # --------------------------------------------------
    @staticmethod
    def _generate_tokens(user_id: int) -> Dict[str, Any]:
        access_token = jwt.encode(
            {
                "sub": str(user_id),
                "type": "access",
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(minutes=15),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )

        refresh_token = jwt.encode(
            {
                "sub": str(user_id),
                "type": "refresh",
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(days=7),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    # --------------------------------------------------
    # TOKEN HASHING (for security tests)
    # --------------------------------------------------
    @staticmethod
    def _hash_refresh_token(token: str) -> str:
        import hashlib
        return hashlib.sha256(token.encode()).hexdigest()

    # --------------------------------------------------
    # REDIS CLIENT (for security tests)
    # --------------------------------------------------
    @staticmethod
    def _get_redis_client():
        import redis
        return redis.Redis(host='localhost', port=6379, db=0)
