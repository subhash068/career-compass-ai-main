from models.database import get_db
from sqlalchemy import text

def verify_table():
    db = next(get_db())
    result = db.execute(text('DESCRIBE skill_assessment_skills'))
    columns = [row[0] for row in result]
    print("Columns in skill_assessment_skills table:")
    for col in columns:
        print(f"  - {col}")
    
    if 'created_at' in columns and 'updated_at' in columns:
        print("\n✅ Migration successful! Both created_at and updated_at columns exist.")
    else:
        print("\n❌ Migration issue!")
        if 'created_at' not in columns:
            print("   - Missing: created_at")
        if 'updated_at' not in columns:
            print("   - Missing: updated_at")

if __name__ == "__main__":
    verify_table()
