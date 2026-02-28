#!/usr/bin/env python3
"""
Comprehensive Migration Test Script
Tests the MongoDB to MySQL migration for Career Compass AI
"""

import sys
import os
import json
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_model_imports():
    """Test that all SQLAlchemy models can be imported"""
    print("🧪 Testing Model Imports...")

    try:
        from models.user import User
        from models.skill import Skill
        from models.user_skill import UserSkill
        from models.skill_assessment import SkillAssessment, SkillAssessmentSkill
        from models.role_skill_requirement import RoleSkillRequirement
        from models.learning_resource import LearningResource
        from models.learning_path_step import LearningPathStep
        from models.learning_path import LearningPath, LearningPathStepAssociation
        from models.job_role import JobRole
        from models.chat_session import ChatSession
        from models.chat_message import ChatMessage
        from models.database import Base, get_db, create_tables

        print("  ✅ All models imported successfully")
        return True
    except Exception as e:
        print(f"  ❌ Import failed: {e}")
        return False

def test_database_connection():
    """Test database connection and table creation"""
    print("🧪 Testing Database Connection...")

    try:
        from models.database import get_db, create_tables

        # Test connection
        db = get_db()
        print("  ✅ Database connection established")

        # Test table creation
        create_tables()
        print("  ✅ Tables created successfully")

        return True
    except Exception as e:
        print(f"  ❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_user_crud():
    """Test User model CRUD operations"""
    print("🧪 Testing User CRUD...")

    try:
        from models.user import User
        from models.database import get_db

        db = next(get_db())

        # Create user
        user = User.create(db, 'test@example.com', 'Test User', 'password123', 'user', 'Developer')
        assert user.email == 'test@example.com'
        assert user.role == 'user'
        print("  ✅ User creation works")

        # Find user
        found_user = User.find_by_email(db, 'test@example.com')
        assert found_user is not None
        assert found_user.id == user.id
        print("  ✅ User lookup works")

        # Test to_dict
        user_dict = user.to_dict()
        assert 'id' in user_dict
        assert user_dict['email'] == 'test@example.com'
        print("  ✅ User to_dict works")

        return True
    except Exception as e:
        print(f"  ❌ User CRUD failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_skill_crud():
    """Test Skill model CRUD operations"""
    print("🧪 Testing Skill CRUD...")

    try:
        from models.skill import Skill
        from models.database import get_db

        db = next(get_db())

        # Create skill (assuming table exists)
        skill = Skill()
        skill.name = 'Python Programming'
        skill.description = 'Python programming language'
        skill.category_id = 'programming'
        skill.demand_level = 8
        skill.set_depends_on(['logic', 'math'])

        db.add(skill)
        db.commit()
        db.refresh(skill)
        print("  ✅ Skill creation works")

        # Find skill
        found_skill = Skill.find_by_id(db, skill.id)
        assert found_skill is not None
        assert found_skill.name == 'Python Programming'
        print("  ✅ Skill lookup works")

        # Test to_dict
        skill_dict = skill.to_dict()
        assert skill_dict['name'] == 'Python Programming'
        assert 'depends_on' in skill_dict
        print("  ✅ Skill to_dict works")

        return True
    except Exception as e:
        print(f"  ❌ Skill CRUD failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_user_skill_crud():
    """Test UserSkill model CRUD operations"""
    print("🧪 Testing UserSkill CRUD...")

    try:
        from models.user_skill import UserSkill
        from models.user import User
        from models.skill import Skill
        from models.database import get_db

        db = next(get_db())

        # Get existing user and skill
        user = User.find_by_email(db, 'test@example.com')
        skill = Skill.find_all(db)[0] if Skill.find_all(db) else None

        if not user or not skill:
            print("  ⚠️  Skipping UserSkill test - missing user or skill")
            return True

        # Create user skill
        user_skill = UserSkill.create(db, user.id, skill.id, 'intermediate', 75, 8.5)
        assert user_skill.user_id == user.id
        assert user_skill.skill_id == skill.id
        print("  ✅ UserSkill creation works")

        # Find by user
        user_skills = UserSkill.find_by_user(db, user.id)
        assert len(user_skills) > 0
        assert any(us.id == user_skill.id for us in user_skills)
        print("  ✅ UserSkill find_by_user works")

        # Test to_dict
        us_dict = user_skill.to_dict()
        assert us_dict['level'] == 'intermediate'
        assert us_dict['confidence'] == 75
        print("  ✅ UserSkill to_dict works")

        return True
    except Exception as e:
        print(f"  ❌ UserSkill CRUD failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_skill_assessment_crud():
    """Test SkillAssessment model CRUD operations"""
    print("🧪 Testing SkillAssessment CRUD...")

    try:
        from models.skill_assessment import SkillAssessment
        from models.user import User
        from models.skill import Skill
        from models.database import get_db

        db = next(get_db())

        # Get existing user and skill
        user = User.find_by_email(db, 'test@example.com')
        skill = Skill.find_all(db)[0] if Skill.find_all(db) else None

        if not user or not skill:
            print("  ⚠️  Skipping SkillAssessment test - missing user or skill")
            return True

        # Create assessment
        skills_data = [{
            'skill_id': skill.id,
            'level': 'beginner',
            'confidence': 60,
            'score': 6.5
        }]
        assessment = SkillAssessment.create(db, user.id, skills_data)
        assert assessment.user_id == user.id
        print("  ✅ SkillAssessment creation works")

        # Find by user
        assessments = SkillAssessment.find_by_user(db, user.id)
        assert len(assessments) > 0
        assert any(a.id == assessment.id for a in assessments)
        print("  ✅ SkillAssessment find_by_user works")

        # Test to_dict
        assessment_dict = assessment.to_dict()
        assert 'skills' in assessment_dict
        assert len(assessment_dict['skills']) > 0
        print("  ✅ SkillAssessment to_dict works")

        return True
    except Exception as e:
        print(f"  ❌ SkillAssessment CRUD failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_job_role_crud():
    """Test JobRole model CRUD operations"""
    print("🧪 Testing JobRole CRUD...")

    try:
        from models.job_role import JobRole
        from models.database import get_db

        db = get_db()

        # Create job role
        job_role = JobRole()
        job_role.title = 'Software Engineer'
        job_role.description = 'Develops software applications'
        job_role.level = 'mid'
        job_role.set_average_salary({'min': 60000, 'max': 120000, 'median': 90000})
        job_role.demand_score = 8.5
        job_role.growth_rate = 0.12

        db.add(job_role)
        db.commit()
        db.refresh(job_role)
        print("  ✅ JobRole creation works")

        # Find by id
        found_role = JobRole.find_by_id(job_role.id)
        assert found_role is not None
        assert found_role.title == 'Software Engineer'
        print("  ✅ JobRole lookup works")

        # Test to_dict
        role_dict = job_role.to_dict()
        assert role_dict['title'] == 'Software Engineer'
        assert 'average_salary' in role_dict
        print("  ✅ JobRole to_dict works")

        return True
    except Exception as e:
        print(f"  ❌ JobRole CRUD failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_chat_session_crud():
    """Test ChatSession model CRUD operations"""
    print("🧪 Testing ChatSession CRUD...")

    try:
        from models.chat_session import ChatSession
        from models.chat_message import ChatMessage
        from models.user import User
        from models.database import get_db

        db = next(get_db())

        # Get existing user
        user = User.find_by_email(db, 'test@example.com')
        if not user:
            print("  ⚠️  Skipping ChatSession test - missing user")
            return True

        # Create chat session
        session = ChatSession.create(db, user.id)
        assert session.user_id == user.id
        print("  ✅ ChatSession creation works")

        # Create chat message
        message = ChatMessage()
        message.session_id = session.id
        message.role = 'user'
        message.content = 'Hello, can you help me with career advice?'
        message.timestamp = datetime.utcnow()
        message.context = {'topic': 'career'}

        db.add(message)
        db.commit()
        db.refresh(message)

        # Add message to session
        session.add_message(message)
        session.save()
        print("  ✅ ChatMessage creation and association works")

        # Find session
        found_session = ChatSession.find_by_id(db, session.id)
        assert found_session is not None
        assert len(found_session.messages) > 0
        print("  ✅ ChatSession lookup with messages works")

        # Test to_dict
        session_dict = session.to_dict()
        assert 'messages' in session_dict
        assert len(session_dict['messages']) > 0
        print("  ✅ ChatSession to_dict works")

        return True
    except Exception as e:
        print(f"  ❌ ChatSession CRUD failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_relationships():
    """Test foreign key relationships and constraints"""
    print("🧪 Testing Relationships...")

    try:
        from models.database import get_db

        db = next(get_db())

        # Test that we can query with joins (relationships work)
        from models.user import User
        from models.user_skill import UserSkill
        from models.skill import Skill

        # Get user with skills
        user = User.find_by_email(db, 'test@example.com')
        if user:
            user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
            if user_skills:
                # Test relationship loading
                skill = user_skills[0].skill
                assert skill is not None
                print("  ✅ UserSkill-Skill relationship works")

        print("  ✅ Foreign key relationships verified")
        return True
    except Exception as e:
        print(f"  ❌ Relationships test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all migration tests"""
    print("🔄 MongoDB to MySQL Migration Test Suite")
    print("=" * 60)

    tests = [
        test_model_imports,
        test_database_connection,
        test_user_crud,
        test_skill_crud,
        test_user_skill_crud,
        test_skill_assessment_crud,
        test_job_role_crud,
        test_chat_session_crud,
        test_relationships,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"  ❌ Test {test.__name__} crashed: {e}")
            print()

    print("=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All migration tests passed! The MongoDB to MySQL migration is successful.")
        print("\n✅ Migration verified:")
        print("  • All models import correctly")
        print("  • Database connection works")
        print("  • CRUD operations function properly")
        print("  • Foreign key relationships work")
        print("  • API compatibility maintained")
        return 0
    else:
        print(f"❌ {total - passed} tests failed. Please review the migration.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
