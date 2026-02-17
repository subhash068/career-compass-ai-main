#!/usr/bin/env python3
"""
Migration script to add missing columns to learning path tables
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from models.database import engine

def migrate():
    """Add missing columns to learning path tables"""
    
    with engine.connect() as conn:
        # Check and add assessment_questions to learning_path_steps
        print("Checking learning_path_steps table...")
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'learning_path_steps'
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME = 'assessment_questions'
        """))
        
        if result.fetchone():
            print("  ✓ assessment_questions column already exists")
        else:
            print("  → Adding assessment_questions column...")
            conn.execute(text("""
                ALTER TABLE learning_path_steps 
                ADD COLUMN assessment_questions TEXT NULL
            """))
            conn.commit()
            print("  ✓ assessment_questions column added")
        
        # Check and add assessment_passed to learning_path_step_associations
        print("\nChecking learning_path_step_associations table...")
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'learning_path_step_associations'
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME = 'assessment_passed'
        """))
        
        if result.fetchone():
            print("  ✓ assessment_passed column already exists")
        else:
            print("  → Adding assessment_passed column...")
            conn.execute(text("""
                ALTER TABLE learning_path_step_associations 
                ADD COLUMN assessment_passed BOOLEAN DEFAULT FALSE
            """))
            conn.commit()
            print("  ✓ assessment_passed column added")
        
        print("\n✓ Migration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
