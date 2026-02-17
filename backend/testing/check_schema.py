from models.database import engine
from sqlalchemy import text

def check_schema():
    with engine.connect() as conn:
        # Check skill_questions table structure
        result = conn.execute(text("DESCRIBE skill_questions"))
        print("skill_questions table structure:")
        for row in result:
            print(f"  {row[0]}: {row[1]}")
        
        print("\n" + "="*50 + "\n")
        
        # Check if columns exist
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'skill_questions' 
            AND TABLE_SCHEMA = DATABASE()
        """))
        columns = [row[0] for row in result]
        print(f"Columns in skill_questions: {columns}")
        
        if 'created_at' in columns:
            print("✓ created_at column exists")
        else:
            print("✗ created_at column MISSING")
            
        if 'updated_at' in columns:
            print("✓ updated_at column exists")
        else:
            print("✗ updated_at column MISSING")

if __name__ == "__main__":
    check_schema()
