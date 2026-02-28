#!/usr/bin/env python3
"""
Fix skill scores in database - convert from decimals to percentages
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models.database import DATABASE_URL, Base, get_db
from models.user_skill import UserSkill

def fix_skill_scores():
    """Convert all skill scores from decimals (0-1) to percentages (0-100)"""
    print("=" * 60)
    print("FIXING SKILL SCORES")
    print("=" * 60)
    
    db = next(get_db())
    
    try:
        # Get all user skills
        user_skills = db.query(UserSkill).all()
        print(f"Found {len(user_skills)} user skills to check")
        
        fixed_count = 0
        skipped_count = 0
        
        for user_skill in user_skills:
            old_score = user_skill.score
            skill_name = user_skill.skill.name if user_skill.skill else f"Skill {user_skill.skill_id}"
            
            # If score is less than 1.0, it's likely a decimal that needs conversion
            if old_score < 1.0 and old_score > 0:
                # Convert to percentage
                new_score = old_score * 100
                user_skill.score = new_score
                fixed_count += 1
                print(f"  FIXED: {skill_name}: {old_score} -> {new_score:.2f}")
            elif old_score >= 1.0:
                # Already in percentage format
                skipped_count += 1
                print(f"  OK: {skill_name}: {old_score:.2f}% (already correct)")
            else:
                # Score is 0, leave it
                skipped_count += 1
                print(f"  SKIP: {skill_name}: {old_score} (zero score)")
        
        # Commit changes
        db.commit()
        print(f"\n{'=' * 60}")
        print(f"SUMMARY:")
        print(f"  Fixed: {fixed_count} skills")
        print(f"  Skipped: {skipped_count} skills")
        print(f"{'=' * 60}")
        print("Database updated successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_skill_scores()
