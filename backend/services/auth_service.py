from typing import Dict, Any
from sqlalchemy.orm import Session
import jwt
import datetime
import os
import re
import bleach
import smtplib
from email.mime.text import MIMEText

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

    _otp_store: Dict[tuple, Dict[str, Any]] = {}

    @staticmethod
    def _generate_otp() -> str:
        from random import randint
        return f"{randint(100000, 999999)}"

    @staticmethod
    def _send_email(to_email: str, subject: str, body: str) -> None:
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        from_email = os.getenv("SMTP_FROM") or smtp_user

        if not smtp_host or not smtp_user or not smtp_pass or not from_email:
            raise RuntimeError("SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM")

        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

    @staticmethod
    def send_otp(db: Session, email: str, purpose: str) -> Dict[str, Any]:
        purpose = purpose.lower().strip()
        if purpose not in ("verify", "reset"):
            raise ValueError("Invalid OTP purpose")

        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user:
            raise ValueError("User with this email does not exist")

        code = AuthService._generate_otp()
        expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        AuthService._otp_store[(purpose, email.lower().strip())] = {"code": code, "expires": expires}

        if purpose == "verify":
            subject = "Your Career Compass email verification code"
            body = f"Hi {user.name},\n\nYour verification code is: {code}\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email."
        else:
            subject = "Your Career Compass password reset code"
            body = f"Hi {user.name},\n\nYour password reset code is: {code}\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email."

        AuthService._send_email(to_email=email, subject=subject, body=body)
        return {"message": "OTP sent successfully"}

    @staticmethod
    def verify_otp(db: Session, email: str, code: str, purpose: str) -> Dict[str, Any]:
        purpose = purpose.lower().strip()
        if purpose not in ("verify", "reset"):
            raise ValueError("Invalid OTP purpose")

        key = (purpose, email.lower().strip())
        record = AuthService._otp_store.get(key)
        if not record:
            raise ValueError("No OTP found for this email")

        if datetime.datetime.utcnow() > record["expires"]:
            AuthService._otp_store.pop(key, None)
            raise ValueError("OTP expired")

        if str(code).strip() != record["code"]:
            raise ValueError("Invalid OTP code")

        AuthService._otp_store.pop(key, None)

        if purpose == "verify":
            return {"message": "Email verified successfully"}

        reset_token = jwt.encode(
            {
                "sub": str(db.query(User).filter(User.email == email.lower().strip()).first().id),
                "type": "password_reset",
                "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        return {"message": "OTP verified", "reset_token": reset_token}

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
            raise ValueError("Password must be at least 8 characters and contain letters and numbers")

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

    @staticmethod
    def refresh_access_token(
        db: Session,
        user_id: int,
        refresh_token: str,
    ) -> Dict[str, Any]:
        try:
            payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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
                "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        return {"access_token": access_token, "token_type": "bearer"}

    @staticmethod
    def initiate_password_reset(db: Session, email: str) -> Dict[str, Any]:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError("User with this email does not exist")

        reset_token = jwt.encode(
            {
                "sub": str(user.id),
                "type": "password_reset",
                "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        return {"message": "Password reset initiated", "reset_token": reset_token}

    @staticmethod
    def reset_password(db: Session, reset_token: str, new_password: str) -> Dict[str, Any]:
        if not AuthService.validate_password(new_password):
            raise ValueError("Password must be at least 8 characters and contain letters and numbers")
        try:
            payload = jwt.decode(reset_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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

    @staticmethod
    def _generate_tokens(user_id: int) -> Dict[str, Any]:
        access_token = jwt.encode(
            {
                "sub": str(user_id),
                "type": "access",
                "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        refresh_token = jwt.encode(
            {
                "sub": str(user_id),
                "type": "refresh",
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    @staticmethod
    def _hash_refresh_token(token: str) -> str:
        import hashlib
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def _get_redis_client():
        import redis
        return redis.Redis(
            host='redis-19426.c239.us-east-1-2.ec2.cloud.redislabs.com',
            port=19426,
            decode_responses=True,
            username="default",
            password="8cWErxIfAC2l8PjEAfYLLp339h6Ekv2m",
        )
