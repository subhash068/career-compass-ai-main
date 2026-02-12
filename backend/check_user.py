#!/usr/bin/env python3
"""
Script to check if a user exists and verify password
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from models.database import SessionLocal
from models.user import User

def check_user(email, password):
    db = SessionLocal()
    try:
        email = email.lower().strip()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} does not exist.")
            return

        print(f"User found: {user.name}, email: {user.email}, role: {user.role}")
        print(f"Password hash: {user.password_hash}")

        if user.verify_password(password):
            print("Password is correct.")
        else:
            print("Password is incorrect.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python check_user.py <email> <password>")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    check_user(email, password)
