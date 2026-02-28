#!/usr/bin/env python3
"""
Script to create test user
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from models.database import SessionLocal, create_tables
# Import all models to ensure relationships are resolved
from models import user_skill, skill, role_skill_requirement, job_role, skill_assessment, learning_path, learning_path_step, learning_resource, chat_session, chat_message
from models.user import User
import bcrypt

def create_test_user():
    db = SessionLocal()
    try:
        # Check if test user already exists and delete if so
        existing_user = db.query(User).filter(User.email == 'test@test.com').first()
        if existing_user:
            db.delete(existing_user)
            db.commit()
            print("Existing test user deleted")

        # Create test user
        test_password = 'TestPass123'  # Valid password: 8+ chars, letters and numbers
        test_user = User(
            email='test@test.com',
            name='Test User',
            role='user'
        )
        test_user.set_password(test_password)
        db.add(test_user)
        db.commit()
        print("Test user created successfully")
        print("Email: test@test.com")
        print(f"Password: {test_password}")

    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    create_test_user()
