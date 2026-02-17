"""
Test script to verify the question creation fix
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.database import Base, get_database_url
from models.skill_question import SkillQuestion
from models.skill import Skill
from models.domain import Domain
import json

def test_question_creation():
    """Test that questions can be created with proper options serialization"""
    print("=" * 60)
    print("Testing Question Creation Fix")
    print("=" * 60)
    
    # Setup test database
    database_url = get_database_url()
    print(f"\n1. Using database: {database_url}")
    
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Test 1: Create a question with options using set_options method
        print("\n2. Testing SkillQuestion model with set_options()...")
        
        # First, check if we have any skills
        skill = db.query(Skill).first()
        if not skill:
            print("   ⚠ No skills found in database. Creating a test skill...")
            # Create a test domain first
            domain = db.query(Domain).first()
            if not domain:
                domain = Domain(name="Test Domain", description="Test domain for question creation")
                db.add(domain)
                db.commit()
                db.refresh(domain)
                print(f"   ✓ Created test domain: {domain.name} (ID: {domain.id})")
            
            skill = Skill(name="Test Skill", description="Test skill", domain_id=domain.id)
            db.add(skill)
            db.commit()
            db.refresh(skill)
            print(f"   ✓ Created test skill: {skill.name} (ID: {skill.id})")
        else:
            print(f"   ✓ Using existing skill: {skill.name} (ID: {skill.id})")
        
        # Create question using the fixed approach (without options in constructor)
        question = SkillQuestion(
            skill_id=skill.id,
            question_text="What is the capital of France?",
            question_type="multiple_choice",
            correct_answer="Paris",
            difficulty="easy",
            explanation="Paris is the capital of France.",
        )
        
        # Set options using the model's method (this is the fix)
        test_options = ["Paris", "London", "Berlin", "Madrid"]
        question.set_options(test_options)
        
        db.add(question)
        db.commit()
        db.refresh(question)
        
        print(f"   ✓ Question created successfully (ID: {question.id})")
        
        # Verify options were properly serialized
        retrieved_options = question.get_options()
        print(f"   ✓ Options retrieved: {retrieved_options}")
        
        if retrieved_options == test_options:
            print("   ✓ Options match! Serialization working correctly.")
        else:
            print(f"   ✗ Options mismatch! Expected: {test_options}, Got: {retrieved_options}")
            return False
        
        # Test 2: Verify the options are stored as JSON in database
        print("\n3. Verifying database storage format...")
        
        # Query raw data from database
        from sqlalchemy import text
        result = db.execute(text(f"SELECT options FROM skill_questions WHERE id = {question.id}"))
        raw_options = result.scalar()
        
        print(f"   Raw options from DB: {raw_options}")
        print(f"   Type: {type(raw_options)}")
        
        # Verify it's valid JSON
        try:
            parsed = json.loads(raw_options) if isinstance(raw_options, str) else raw_options
            print(f"   ✓ Options are valid JSON: {parsed}")
        except json.JSONDecodeError as e:
            print(f"   ✗ Invalid JSON: {e}")
            return False
        
        # Clean up test data
        print("\n4. Cleaning up test data...")
        db.delete(question)
        db.commit()
        print("   ✓ Test question deleted")
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED - Fix is working correctly!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_question_creation()
    sys.exit(0 if success else 1)
