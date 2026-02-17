#!/usr/bin/env python3
"""
Check if learning path tables have the required columns for assessments
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text, inspect
from models.database import engine

def check_tables():

    
    with engine.connect() as conn:
        # Check learning_path_steps table
        print("Checking learning_path_steps table...")
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'learning_path_steps'
            AND TABLE_SCHEMA = DATABASE()
        """))
        columns = [row[0] for row in result]
        print(f"  Columns found: {columns}")
        
        if 'assessment_questions' in columns:
            print("  ✓ assessment_questions column exists")
        else:
            print("  ✗ assessment_questions column MISSING!")
            print("  Run: ALTER TABLE learning_path_steps ADD COLUMN assessment_questions TEXT;")
        
        # Check learning_path_step_associations table
        print("\nChecking learning_path_step_associations table...")
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'learning_path_step_associations'
            AND TABLE_SCHEMA = DATABASE()
        """))
        columns = [row[0] for row in result]
        print(f"  Columns found: {columns}")
        
        if 'assessment_passed' in columns:
            print("  ✓ assessment_passed column exists")
        else:
            print("  ✗ assessment_passed column MISSING!")
            print("  Run: ALTER TABLE learning_path_step_associations ADD COLUMN assessment_passed BOOLEAN DEFAULT FALSE;")

if __name__ == "__main__":
    check_tables()
