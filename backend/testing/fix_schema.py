from models.database import engine
from sqlalchemy import text

def fix_schema():
    with engine.connect() as conn:
        # Add created_at and updated_at to skill_questions
        try:
            conn.execute(text("""
                ALTER TABLE skill_questions 
                ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            """))
            print("✓ Added created_at to skill_questions")
        except Exception as e:
            print(f"Error adding created_at: {e}")
        
        try:
            conn.execute(text("""
                ALTER TABLE skill_questions 
                ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            """))
            print("✓ Added updated_at to skill_questions")
        except Exception as e:
            print(f"Error adding updated_at: {e}")
        
        # Also fix user_skills and domains if needed
        tables = ['user_skills', 'domains']
        for table in tables:
            try:
                conn.execute(text(f"""
                    ALTER TABLE {table} 
                    ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                """))
                print(f"✓ Added created_at to {table}")
            except Exception as e:
                print(f"Note for {table} created_at: {e}")
            
            try:
                conn.execute(text(f"""
                    ALTER TABLE {table} 
                    ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                """))
                print(f"✓ Added updated_at to {table}")
            except Exception as e:
                print(f"Note for {table} updated_at: {e}")
        
        conn.commit()
        print("\nSchema fix complete!")

if __name__ == "__main__":
    fix_schema()
