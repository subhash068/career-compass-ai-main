"""
Migration script to add domain_id columns to job_roles and skill_assessments tables.
Run this after updating the models.
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from models.database import engine, IS_SQLITE, get_database_url

def migrate():
    print(f"Database URL: {get_database_url()}")
    print(f"Is SQLite: {IS_SQLITE}")
    
    with engine.connect() as conn:
        if IS_SQLITE:
            # SQLite migration
            print("\n=== Running SQLite Migration ===")
            
            # Check if domain_id column exists in job_roles
            result = conn.execute(text("PRAGMA table_info(job_roles)"))
            columns = [row[1] for row in result]
            
            if 'domain_id' not in columns:
                print("Adding domain_id to job_roles...")
                conn.execute(text("ALTER TABLE job_roles ADD COLUMN domain_id INTEGER"))
                conn.execute(text("CREATE INDEX idx_job_role_domain ON job_roles(domain_id)"))
                print("✓ Added domain_id to job_roles")
            else:
                print("✓ domain_id already exists in job_roles")
            
            # Check if domain_id column exists in skill_assessments
            result = conn.execute(text("PRAGMA table_info(skill_assessments)"))
            columns = [row[1] for row in result]
            
            if 'domain_id' not in columns:
                print("Adding domain_id to skill_assessments...")
                conn.execute(text("ALTER TABLE skill_assessments ADD COLUMN domain_id INTEGER"))
                conn.execute(text("CREATE INDEX idx_skill_assessment_domain_id ON skill_assessments(domain_id)"))
                print("✓ Added domain_id to skill_assessments")
            else:
                print("✓ domain_id already exists in skill_assessments")
                
        else:
            # MySQL migration
            print("\n=== Running MySQL Migration ===")
            
            # Check and add domain_id to job_roles
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = 'job_roles' AND column_name = 'domain_id'
            """))
            if result.scalar() == 0:
                print("Adding domain_id to job_roles...")
                conn.execute(text("ALTER TABLE job_roles ADD COLUMN domain_id INT"))
                conn.execute(text("CREATE INDEX idx_job_role_domain ON job_roles(domain_id)"))
                conn.execute(text("ALTER TABLE job_roles ADD FOREIGN KEY (domain_id) REFERENCES domains(id)"))
                print("✓ Added domain_id to job_roles")
            else:
                print("✓ domain_id already exists in job_roles")
            
            # Check and add domain_id to skill_assessments
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = 'skill_assessments' AND column_name = 'domain_id'
            """))
            if result.scalar() == 0:
                print("Adding domain_id to skill_assessments...")
                conn.execute(text("ALTER TABLE skill_assessments ADD COLUMN domain_id INT"))
                conn.execute(text("CREATE INDEX idx_skill_assessment_domain_id ON skill_assessments(domain_id)"))
                conn.execute(text("ALTER TABLE skill_assessments ADD FOREIGN KEY (domain_id) REFERENCES domains(id)"))
                print("✓ Added domain_id to skill_assessments")
            else:
                print("✓ domain_id already exists in skill_assessments")
        
        conn.commit()
        print("\n=== Migration Complete ===")

if __name__ == "__main__":
    migrate()
