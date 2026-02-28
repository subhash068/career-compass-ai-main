#!/usr/bin/env python3
"""
Test script to verify the learning path generation is working correctly.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from models.database import SessionLocal, engine
from models.job_role import JobRole
from models.user import User
from models.role_skill_requirement import RoleSkillRequirement
from services.learning_service import LearningService

def test_learning_path_generation():
    """Test the learning path generation with actual database data."""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("Testing Learning Path Generation")
        print("=" * 60)
        
        # 1. Check if we have job roles
        roles = db.query(JobRole).all()
        print(f"\n1. Found {len(roles)} job roles")
        if not roles:
            print("   ERROR: No job roles found in database!")
            return False
        
        for role in roles[:3]:
            role_name = getattr(role, 'title', getattr(role, 'name', 'Unknown'))
            print(f"   - Role {role.id}: {role_name}")

        
        # 2. Check if we have users
        users = db.query(User).all()
        print(f"\n2. Found {len(users)} users")
        if not users:
            print("   ERROR: No users found in database!")
            return False
        
        test_user = users[0]
        print(f"   - Using user {test_user.id}: {getattr(test_user, 'username', getattr(test_user, 'email', 'Unknown'))}")
        
        # 3. Check role skill requirements
        test_role = roles[0]
        requirements = db.query(RoleSkillRequirement).filter_by(role_id=test_role.id).all()
        print(f"\n3. Role {test_role.id} has {len(requirements)} skill requirements")
        
        # 4. Test learning path generation
        print(f"\n4. Testing learning path generation...")
        print(f"   User ID: {test_user.id}, Role ID: {test_role.id}")
        
        try:
            result = LearningService.generate_learning_path(
                db=db,
                user_id=test_user.id,
                target_role_id=test_role.id
            )
            
            print(f"\n   ✓ SUCCESS! Learning path generated:")
            print(f"     - Path ID: {result.get('id')}")
            print(f"     - Total Duration: {result.get('total_duration')}")
            print(f"     - Progress: {result.get('progress')}%")
            print(f"     - Steps: {len(result.get('steps', []))}")
            
            if result.get('steps'):
                for i, step in enumerate(result['steps'][:3]):
                    skill_name = step.get('skill', {}).get('name', 'Unknown')
                    print(f"       Step {i+1}: {skill_name} ({step.get('target_level', 'unknown')})")
            
            return True
            
        except ValueError as e:
            print(f"\n   ✗ ValueError: {e}")
            return False
        except Exception as e:
            print(f"\n   ✗ ERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    finally:
        db.close()

if __name__ == "__main__":
    success = test_learning_path_generation()
    print("\n" + "=" * 60)
    if success:
        print("TEST PASSED ✓")
    else:
        print("TEST FAILED ✗")
    print("=" * 60)
    sys.exit(0 if success else 1)
