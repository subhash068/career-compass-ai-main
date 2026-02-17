"""
Test script to verify that user exam scores are being stored correctly in the database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.database import get_db
from models.user_skill import UserSkill
from models.skill_assessment import SkillAssessmentSkill, UserAnswer
from models.user import User
from sqlalchemy import desc

def verify_database_storage():
    """Verify that exam scores are being stored in the database"""
    print("=" * 70)
    print("VERIFYING DATABASE STORAGE - User Exam Scores")
    print("=" * 70)
    
    db = next(get_db())
    
    try:
        # 1. Check user_skills table
        print("\n1. Checking 'user_skills' table...")
        user_skills = db.query(UserSkill).order_by(desc(UserSkill.assessed_at)).limit(5).all()
        
        if not user_skills:
            print("   ⚠ No records found in user_skills table")
        else:
            print(f"   ✓ Found {len(user_skills)} recent user skill records")
            for us in user_skills:
                user = db.query(User).filter(User.id == us.user_id).first()
                user_email = user.email if user else "Unknown"
                print(f"   - User: {user_email} | Skill ID: {us.skill_id} | "
                      f"Score: {us.score}% | Level: {us.level} | "
                      f"Confidence: {us.confidence}% | "
                      f"Assessed: {us.assessed_at}")
        
        # 2. Check skill_assessment_skills table
        print("\n2. Checking 'skill_assessment_skills' table...")
        assessment_skills = db.query(SkillAssessmentSkill).order_by(
            desc(SkillAssessmentSkill.created_at)
        ).limit(5).all()
        
        if not assessment_skills:
            print("   ⚠ No records found in skill_assessment_skills table")
        else:
            print(f"   ✓ Found {len(assessment_skills)} recent assessment skill records")
            for asm in assessment_skills:
                print(f"   - Assessment ID: {asm.assessment_id} | Skill ID: {asm.skill_id} | "
                      f"Score: {asm.score}% | Level: {asm.level} | "
                      f"Confidence: {asm.confidence}% | "
                      f"Created: {asm.created_at}")
        
        # 3. Check user_answers table
        print("\n3. Checking 'user_answers' table...")
        user_answers = db.query(UserAnswer).order_by(desc(UserAnswer.created_at)).limit(5).all()
        
        if not user_answers:
            print("   ⚠ No records found in user_answers table")
        else:
            print(f"   ✓ Found {len(user_answers)} recent user answer records")
            for ua in user_answers:
                print(f"   - Assessment ID: {ua.assessment_id} | Question ID: {ua.question_id} | "
                      f"Answer: {ua.user_answer} | Correct: {ua.is_correct} | "
                      f"Created: {ua.created_at}")
        
        # 4. Summary statistics
        print("\n4. Summary Statistics...")
        total_user_skills = db.query(UserSkill).count()
        total_assessment_skills = db.query(SkillAssessmentSkill).count()
        total_user_answers = db.query(UserAnswer).count()
        
        print(f"   - Total user_skills records: {total_user_skills}")
        print(f"   - Total skill_assessment_skills records: {total_assessment_skills}")
        print(f"   - Total user_answers records: {total_user_answers}")
        
        # 5. Verify data integrity
        print("\n5. Data Integrity Check...")
        issues = []
        
        # Check for user_skills with null scores
        null_scores = db.query(UserSkill).filter(UserSkill.score == None).count()
        if null_scores > 0:
            issues.append(f"   ⚠ {null_scores} user_skills records have NULL scores")
        
        # Check for user_skills with invalid levels
        valid_levels = ['beginner', 'intermediate', 'advanced', 'expert']
        invalid_levels = db.query(UserSkill).filter(
            ~UserSkill.level.in_(valid_levels)
        ).count()
        if invalid_levels > 0:
            issues.append(f"   ⚠ {invalid_levels} user_skills records have invalid levels")
        
        if not issues:
            print("   ✓ All data integrity checks passed!")
        else:
            for issue in issues:
                print(issue)
        
        print("\n" + "=" * 70)
        if user_skills or assessment_skills or user_answers:
            print("✓ VERIFICATION COMPLETE - Scores ARE being stored in database!")
        else:
            print("⚠ VERIFICATION COMPLETE - No exam data found in database yet")
            print("  (This is normal if no exams have been submitted yet)")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"\n✗ VERIFICATION FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = verify_database_storage()
    sys.exit(0 if success else 1)
