#!/usr/bin/env python3
"""
Script to create admin user
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from models.database import SessionLocal, create_tables
from models.user import User
import bcrypt

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists and delete if so
        existing_admin = db.query(User).filter(User.email == 'admin@careercompass.ai').first()
        if existing_admin:
            db.delete(existing_admin)
            db.commit()
            print("Existing admin user deleted")

        # Create admin user
        hashed_password = bcrypt.hashpw('AdminPass123!'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = User(
            email='admin@careercompass.ai',
            name='Admin User',
            password_hash=hashed_password,
            role='ADMIN'
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully")
        print("Email: admin@careercompass.ai")
        print("Password: AdminPass123!")

    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    create_admin()
