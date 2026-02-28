#!/usr/bin/env python3
"""
Check if a user has admin role in the database
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from models.database import get_db, SessionLocal
from models.user import User

def check_user_role(email: str = None):
    """Check user role in database"""
    db = SessionLocal()
    try:
        if email:
            user = db.query(User).filter(User.email == email.lower().strip()).first()
            if user:
                print(f"\n{'='*50}")
                print(f"User: {user.email}")
                print(f"Name: {user.name}")
                print(f"Role: {user.role}")
                print(f"ID: {user.id}")
                print(f"{'='*50}\n")
                
                if user.role.lower() != 'admin':
                    print(f"⚠️  WARNING: User '{email}' does NOT have admin role!")
                    print(f"   Current role: '{user.role}'")
                    print(f"\nTo make this user an admin, run:")
                    print(f"   python check_admin.py --make-admin {email}")
                else:
                    print(f"✅ User '{email}' has admin role.")
            else:
                print(f"❌ User '{email}' not found in database")
        else:
            # List all users
            users = db.query(User).all()
            print(f"\n{'='*70}")
            print(f"{'ID':<5} {'Email':<30} {'Name':<20} {'Role':<10}")
            print(f"{'-'*70}")
            for user in users:
                print(f"{user.id:<5} {user.email:<30} {user.name:<20} {user.role:<10}")
            print(f"{'='*70}\n")
            print(f"Total users: {len(users)}")
            
            # Count admins
            admins = db.query(User).filter(User.role.ilike('admin')).all()
            print(f"Admin users: {len(admins)}")
            if admins:
                print("\nAdmin users:")
                for admin in admins:
                    print(f"  - {admin.email} ({admin.name})")
                    
    finally:
        db.close()

def make_admin(email: str):
    """Make a user an admin"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if user:
            old_role = user.role
            user.role = 'admin'
            db.commit()
            print(f"\n✅ SUCCESS: User '{email}' role changed from '{old_role}' to 'admin'")
            print(f"   You can now access the admin dashboard.")
        else:
            print(f"❌ User '{email}' not found in database")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Check and manage user roles')
    parser.add_argument('--email', '-e', help='Check specific user by email')
    parser.add_argument('--make-admin', '-m', help='Make user an admin')
    parser.add_argument('--list', '-l', action='store_true', help='List all users')
    
    args = parser.parse_args()
    
    if args.make_admin:
        make_admin(args.make_admin)
    elif args.email:
        check_user_role(args.email)
    else:
        check_user_role()
