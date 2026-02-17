#!/usr/bin/env python3
"""
Script to create a specific user
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from models.database import SessionLocal, create_tables
# Import all models in dependency order to ensure relationships are resolved
from models import (
    domain, skill, skill_question, job_role, role_skill_requirement,
    learning_resource, learning_path_step, learning_path, skill_assessment,
    assessment, assessment_answer, assessment_question, chat_session, chat_message,
    user, user_skill
)
from models.user import User

def create_specific_user(email, name, password, role='user'):
    db = SessionLocal()
    try:
        # Check if user already exists and delete if so
        existing_user = db.query(User).filter(User.email == email.lower().strip()).first()
        if existing_user:
            db.delete(existing_user)
            db.commit()
            print(f"Existing user {email} deleted")

        # Create user
        user = User(
            email=email.lower().strip(),
            name=name,
            role=role
        )
        user.set_password(password)
        db.add(user)
        db.commit()
        print(f"User created successfully")
        print(f"Email: {email}")
        print(f"Name: {name}")
        print(f"Role: {role}")

    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python create_specific_user.py <email> <name> <password>")
        sys.exit(1)

    email = sys.argv[1]
    name = sys.argv[2]
    password = sys.argv[3]
    create_specific_user(email, name, password)
